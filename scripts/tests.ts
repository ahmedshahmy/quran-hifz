/**
 * Verifies the hifz progress maths that drive the pie chart.
 * Bundled with esbuild and run on plain Node (no test framework needed):
 *   node scripts/run-tests.mjs
 */
import assert from 'node:assert/strict'
import {
  TOTAL_AYAHS,
  SURAHS,
  countAyahs,
  expandRanges,
  formatRange,
  isValidRange,
  juzBreakdown,
  mergeRanges,
  percentOfQuran,
  surahBreakdown,
} from '../src/lib/quran.ts'
import { summarize } from '../src/lib/progress.ts'
import type { Entry } from '../src/lib/types.ts'

let passed = 0
const failures: string[] = []

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
  } catch (e) {
    failures.push(`${name}\n    ${(e as Error).message.split('\n').join('\n    ')}`)
  }
}

/* ------------------------------ metadata ------------------------------- */

test('114 surahs', () => assert.equal(SURAHS.length, 114))

test('total ayahs is 6236', () => assert.equal(TOTAL_AYAHS, 6236))

test('ayah counts of known surahs', () => {
  const ayahs = (n: number) => SURAHS.find((s) => s.n === n)!.ayahs
  assert.equal(ayahs(1), 7)
  assert.equal(ayahs(2), 286)
  assert.equal(ayahs(36), 83)
  assert.equal(ayahs(112), 4)
  assert.equal(ayahs(114), 6)
})

test('every surah has contiguous juz spans covering its ayahs', () => {
  for (const s of SURAHS) {
    assert.ok(s.juz.length > 0, `surah ${s.n} has no juz`)
    let covered = 0
    for (const span of s.juz) {
      assert.ok(span.f >= 1 && span.t <= s.ayahs, `surah ${s.n} span out of range`)
      covered += span.t - span.f + 1
    }
    assert.equal(covered, s.ayahs, `surah ${s.n} juz coverage ${covered} != ${s.ayahs}`)
  }
})

/* ------------------------------ range math ----------------------------- */

test('rejects invalid ranges', () => {
  assert.equal(isValidRange({ surah: 1, from: 1, to: 7 }), true)
  assert.equal(isValidRange({ surah: 1, from: 1, to: 8 }), false) // Fatihah has 7
  assert.equal(isValidRange({ surah: 0, from: 1, to: 1 }), false)
  assert.equal(isValidRange({ surah: 2, from: 5, to: 4 }), false)
  assert.equal(isValidRange({ surah: 2, from: 0, to: 4 }), false)
})

test('counts a full surah correctly', () => {
  assert.equal(countAyahs([{ surah: 2, from: 1, to: 286 }]), 286)
})

test('overlapping ranges are counted once', () => {
  const ranges = [
    { surah: 2, from: 1, to: 10 },
    { surah: 2, from: 5, to: 20 },
    { surah: 2, from: 1, to: 20 },
  ]
  assert.equal(countAyahs(ranges), 20)
})

test('ranges in different surahs do not collide', () => {
  // surah*1000+ayah encoding must not alias ayah 5 of surah 3 with ayah 5 of surah 4
  const keys = expandRanges([
    { surah: 3, from: 5, to: 5 },
    { surah: 4, from: 5, to: 5 },
  ])
  assert.equal(keys.size, 2)
})

test('whole Quran equals 100%', () => {
  const all = SURAHS.map((s) => ({ surah: s.n, from: 1, to: s.ayahs }))
  const keys = expandRanges(all)
  assert.equal(keys.size, TOTAL_AYAHS)
  assert.equal(percentOfQuran(keys.size), 100)
})

test('percentages round to one decimal', () => {
  assert.equal(percentOfQuran(7), 0.1) // Al-Fatihah
  assert.equal(percentOfQuran(6236), 100)
  assert.equal(percentOfQuran(0), 0)
})

test('mergeRanges joins touching and overlapping spans', () => {
  const merged = mergeRanges([
    { surah: 2, from: 10, to: 15 },
    { surah: 2, from: 1, to: 9 }, // touches at 9-10
    { surah: 2, from: 40, to: 50 },
    { surah: 2, from: 45, to: 60 }, // overlaps
    { surah: 3, from: 1, to: 2 },
  ])
  assert.deepEqual(merged, [
    { surah: 2, from: 1, to: 15 },
    { surah: 2, from: 40, to: 60 },
    { surah: 3, from: 1, to: 2 },
  ])
})

test('formatRange is readable', () => {
  assert.equal(formatRange({ surah: 2, from: 1, to: 5 }), 'Al-Baqarah 1–5')
  assert.equal(formatRange({ surah: 2, from: 3, to: 3 }), 'Al-Baqarah 3')
  assert.equal(formatRange({ surah: 2, from: 1, to: 286 }), 'Al-Baqarah (full)')
})

/* --------------------------- juz / surah views -------------------------- */

test('juz totals add up to 6236', () => {
  const empty = juzBreakdown(new Set())
  assert.equal(empty.length, 30)
  assert.equal(
    empty.reduce((s, j) => s + j.total, 0),
    TOTAL_AYAHS,
  )
  assert.ok(empty.every((j) => j.memorized === 0))
})

test('memorizing juz 30 reports juz 30 as complete', () => {
  const juz30 = SURAHS.flatMap((s) =>
    s.juz.filter((sp) => sp.j === 30).map((sp) => ({ surah: s.n, from: sp.f, to: sp.t })),
  )
  const keys = expandRanges(juz30)
  const breakdown = juzBreakdown(keys)
  assert.equal(breakdown[29].memorized, breakdown[29].total)
  assert.equal(breakdown[29].ratio, 1)
  assert.equal(keys.size, breakdown[29].total)
})

test('surahBreakdown marks complete surahs', () => {
  const keys = expandRanges([{ surah: 1, from: 1, to: 7 }])
  const rows = surahBreakdown(keys)
  const fatihah = rows.find((r) => r.surah.n === 1)!
  assert.equal(fatihah.complete, true)
  assert.equal(fatihah.ratio, 1)
  assert.equal(rows.find((r) => r.surah.n === 2)!.memorized, 0)
})

/* ------------------------- entry-level aggregation ---------------------- */

function entry(partial: Partial<Entry>): Entry {
  return {
    id: 'x',
    studentId: 's',
    teacherId: 't',
    date: '2025-01-01',
    newHifz: [],
    recentHifz: [],
    oldHifz: [],
    ...partial,
  }
}

test('summarize unions all three buckets', () => {
  const entries = [
    entry({
      date: '2025-01-01',
      newHifz: [{ surah: 2, from: 1, to: 5 }],
      recentHifz: [{ surah: 1, from: 1, to: 7 }],
      oldHifz: [],
    }),
    entry({
      date: '2025-01-02',
      newHifz: [{ surah: 2, from: 3, to: 9 }], // overlaps day 1
      recentHifz: [],
      oldHifz: [{ surah: 114, from: 1, to: 6 }],
    }),
  ]
  const s = summarize(entries)
  // surah 2: 1..9 = 9 unique, surah 1: 7, surah 114: 6
  assert.equal(s.memorizedAyahs, 9 + 7 + 6)
  assert.equal(s.activeDays, 2)
  assert.equal(s.percent, percentOfQuran(22))
})

test('revision of old hifz does not inflate the percentage', () => {
  const memorized = summarize([
    entry({ date: '2025-01-01', newHifz: [{ surah: 36, from: 1, to: 83 }] }),
  ])
  const revised = summarize([
    entry({ date: '2025-01-01', newHifz: [{ surah: 36, from: 1, to: 83 }] }),
    entry({ date: '2025-01-02', oldHifz: [{ surah: 36, from: 1, to: 83 }] }),
    entry({ date: '2025-01-03', recentHifz: [{ surah: 36, from: 1, to: 83 }] }),
  ])
  assert.equal(revised.memorizedAyahs, memorized.memorizedAyahs)
})

test('empty entries summarize to 0%', () => {
  const s = summarize([])
  assert.equal(s.memorizedAyahs, 0)
  assert.equal(s.percent, 0)
  assert.equal(s.juzCompleted, 0)
  assert.equal(s.surahsCompleted, 0)
})

/* -------------------------------- report ------------------------------- */

console.log(`\n${passed} passed, ${failures.length} failed\n`)
if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}\n`)
  process.exit(1)
}
console.log('All hifz progress tests passed ✓')
