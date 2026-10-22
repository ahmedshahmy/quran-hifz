import { SURAHS, TOTAL_AYAHS, type Surah } from './quranData'

export { SURAHS, TOTAL_AYAHS }
export type { Surah }

/** A contiguous span of ayahs inside one surah, e.g. Al-Baqarah 1–5. */
export interface HifzRange {
  surah: number
  from: number
  to: number
}

export const NUM_JUZ = 30

const byNumber = new Map<number, Surah>(SURAHS.map((s) => [s.n, s]))

export function getSurah(n: number): Surah | undefined {
  return byNumber.get(n)
}

/** Absolute (1-based) index of this surah's first ayah within the whole Quran. */
const surahOffset = new Map<number, number>()
{
  let acc = 0
  for (const s of SURAHS) {
    surahOffset.set(s.n, acc)
    acc += s.ayahs
  }
}

/** Total number of ayahs in a surah (0 for an invalid number). */
export function ayahCount(surah: number): number {
  return byNumber.get(surah)?.ayahs ?? 0
}

/**
 * Encodes a verse as a single integer so that ranges can be deduplicated
 * with a Set. Ayah numbers never exceed 286, so 1000 is a safe multiplier.
 */
export function verseKey(surah: number, ayah: number): number {
  return surah * 1000 + ayah
}

/** Absolute 0-based position of a verse across the whole Quran. */
export function absoluteIndex(surah: number, ayah: number): number {
  return (surahOffset.get(surah) ?? 0) + (ayah - 1)
}

export function isValidRange(r: HifzRange): boolean {
  const s = byNumber.get(r.surah)
  if (!s) return false
  return (
    Number.isInteger(r.from) &&
    Number.isInteger(r.to) &&
    r.from >= 1 &&
    r.to >= r.from &&
    r.to <= s.ayahs
  )
}

/** Expands a range into the set of verse keys it covers. */
export function addRangeTo(set: Set<number>, r: HifzRange): Set<number> {
  if (!isValidRange(r)) return set
  for (let a = r.from; a <= r.to; a++) set.add(verseKey(r.surah, a))
  return set
}

/** Union of every range in every list — i.e. everything ever recorded. */
export function expandRanges(ranges: HifzRange[]): Set<number> {
  const set = new Set<number>()
  for (const r of ranges) addRangeTo(set, r)
  return set
}

/** How many juz a surah spans, used to attribute verses to juz. */
export function juzOfVerse(surah: number, ayah: number): number | undefined {
  const s = byNumber.get(surah)
  if (!s) return undefined
  for (const span of s.juz) if (ayah >= span.f && ayah <= span.t) return span.j
  return undefined
}

export interface JuzProgress {
  juz: number
  memorized: number
  total: number
  ratio: number
}

const JUZ_TOTALS: number[] = (() => {
  const totals = Array.from({ length: NUM_JUZ }, () => 0)
  for (const s of SURAHS) {
    for (const span of s.juz) {
      totals[span.j - 1] += span.t - span.f + 1
    }
  }
  return totals
})()

export function juzTotal(juz: number): number {
  return JUZ_TOTALS[juz - 1] ?? 0
}

/** Memorized-versus-total breakdown for each of the 30 juz. */
export function juzBreakdown(keys: ReadonlySet<number>): JuzProgress[] {
  const counts = Array.from({ length: NUM_JUZ }, () => 0)
  for (const key of keys) {
    const surah = Math.floor(key / 1000)
    const ayah = key % 1000
    const j = juzOfVerse(surah, ayah)
    if (j) counts[j - 1]++
  }
  return JUZ_TOTALS.map((total, i) => ({
    juz: i + 1,
    memorized: counts[i],
    total,
    ratio: total ? counts[i] / total : 0,
  }))
}

export interface SurahProgress {
  surah: Surah
  memorized: number
  total: number
  ratio: number
  complete: boolean
}

/** Memorized-versus-total breakdown for every surah that has any progress. */
export function surahBreakdown(keys: ReadonlySet<number>): SurahProgress[] {
  const counts = new Map<number, number>()
  for (const key of keys) {
    const surah = Math.floor(key / 1000)
    counts.set(surah, (counts.get(surah) ?? 0) + 1)
  }
  return SURAHS.map((s) => {
    const memorized = counts.get(s.n) ?? 0
    return {
      surah: s,
      memorized,
      total: s.ayahs,
      ratio: s.ayahs ? memorized / s.ayahs : 0,
      complete: memorized === s.ayahs,
    }
  })
}

/** Percentage of the whole Quran memorized, 0–100 with one decimal place. */
export function percentOfQuran(count: number): number {
  return Math.round((count / TOTAL_AYAHS) * 1000) / 10
}

/** Human-readable label for a range, e.g. "Al-Baqarah 1–5". */
export function formatRange(r: HifzRange): string {
  const s = byNumber.get(r.surah)
  const name = s ? s.name : `Surah ${r.surah}`
  if (r.from === r.to) return `${name} ${r.from}`
  if (r.from === 1 && s && r.to === s.ayahs) return `${name} (full)`
  return `${name} ${r.from}–${r.to}`
}

/** Merges ranges that overlap or touch inside the same surah, for tidy storage/display. */
export function mergeRanges(ranges: HifzRange[]): HifzRange[] {
  const byS = new Map<number, HifzRange[]>()
  for (const r of ranges) {
    if (!isValidRange(r)) continue
    const list = byS.get(r.surah) ?? []
    list.push({ ...r })
    byS.set(r.surah, list)
  }
  const out: HifzRange[] = []
  for (const surah of [...byS.keys()].sort((a, b) => a - b)) {
    const list = byS.get(surah)!.sort((a, b) => a.from - b.from || a.to - b.to)
    let cur = list[0]
    for (let i = 1; i < list.length; i++) {
      const next = list[i]
      if (next.from <= cur.to + 1) {
        cur = { surah, from: cur.from, to: Math.max(cur.to, next.to) }
      } else {
        out.push(cur)
        cur = next
      }
    }
    if (cur) out.push(cur)
  }
  return out
}

/** Number of ayahs in a range list, counting overlaps only once. */
export function countAyahs(ranges: HifzRange[]): number {
  return expandRanges(ranges).size
}
