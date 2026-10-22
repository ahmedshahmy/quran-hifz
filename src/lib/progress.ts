import { useMemo } from 'react'
import {
  TOTAL_AYAHS,
  expandRanges,
  juzBreakdown,
  percentOfQuran,
  surahBreakdown,
  type HifzRange,
  type JuzProgress,
  type SurahProgress,
} from '../lib/quran'
import type { Entry } from '../lib/types'
import { isoOf } from './date'

export interface ProgressSummary {
  /** Distinct ayahs memorized across every recorded entry. */
  memorizedAyahs: number
  totalAyahs: number
  percent: number
  juz: JuzProgress[]
  surahs: SurahProgress[]
  juzCompleted: number
  surahsCompleted: number
  /** Ayahs in the last 7 / 30 days, derived from newHifz. */
  last7Days: number
  activeDays: number
}

export function summarize(entries: Entry[]): ProgressSummary {
  const all: HifzRange[] = []
  for (const e of entries) {
    all.push(...(e.newHifz ?? []), ...(e.recentHifz ?? []), ...(e.oldHifz ?? []))
  }
  const keys = expandRanges(all)
  const memorizedAyahs = keys.size
  const juz = juzBreakdown(keys)
  const surahs = surahBreakdown(keys)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffISO = isoOf(cutoff)

  const last7Days = expandRanges(
    entries.filter((e) => e.date >= cutoffISO).flatMap((e) => e.newHifz ?? []),
  ).size

  return {
    memorizedAyahs,
    totalAyahs: TOTAL_AYAHS,
    percent: percentOfQuran(memorizedAyahs),
    juz,
    surahs,
    juzCompleted: juz.filter((j) => j.total > 0 && j.memorized === j.total).length,
    surahsCompleted: surahs.filter((s) => s.complete).length,
    last7Days,
    activeDays: new Set(entries.map((e) => e.date)).size,
  }
}

export function useProgress(entries: Entry[]): ProgressSummary {
  return useMemo(() => summarize(entries), [entries])
}

/** Colour for a completion ratio, darkening as a juz/surah fills up. */
export function ratioColor(ratio: number, base: 'brand' | 'gold' = 'brand'): string {
  if (ratio <= 0) return '#e6ebe9'
  if (base === 'gold') {
    if (ratio >= 1) return '#d9a441'
    return '#eec25f'
  }
  if (ratio >= 1) return '#0d5c4f'
  if (ratio >= 0.75) return '#1c7c68'
  if (ratio >= 0.5) return '#289a80'
  if (ratio >= 0.25) return '#43b499'
  return '#74d0b8'
}
