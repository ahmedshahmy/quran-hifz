import { useState } from 'react'
import Donut from './Donut'
import { ratioColor, type ProgressSummary } from '../lib/progress'
import { NUM_JUZ } from '../lib/quran'

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
      <div className="text-lg font-bold text-brand-900 sm:text-xl">{value}</div>
      <div className="mt-0.5 text-[11px] leading-tight font-medium text-slate-500">{label}</div>
      {hint ? <div className="text-[10px] text-slate-400">{hint}</div> : null}
    </div>
  )
}

/**
 * The headline visual: one pie for the whole Quran, plus a 30-wedge pie
 * showing how full each juz is.
 */
export default function ProgressPanel({ summary }: { summary: ProgressSummary }) {
  const [view, setView] = useState<'quran' | 'juz'>('quran')

  const remaining = Math.max(0, summary.totalAyahs - summary.memorizedAyahs)

  const juzSegments = summary.juz.map((j) => ({
    value: 1,
    color: ratioColor(j.ratio),
    label: `Juz ${j.juz}: ${j.memorized}/${j.total} ayahs`,
  }))

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Quran Memorization</h2>
            <p className="text-[11px] text-slate-500">
              {summary.memorizedAyahs.toLocaleString()} of {summary.totalAyahs.toLocaleString()}{' '}
              ayahs
            </p>
          </div>
          <div className="flex shrink-0 rounded-full bg-slate-100 p-0.5 text-[11px] font-semibold">
            {(['quran', 'juz'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1.5 transition ${
                  view === v ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                {v === 'quran' ? 'Whole' : 'By Juz'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 px-4 py-6 sm:flex-row sm:justify-center sm:gap-10">
          <div className="relative w-full max-w-[230px]">
            {view === 'quran' ? (
              <Donut
                ariaLabel={`${summary.percent}% of the Quran memorized`}
                size={230}
                thickness={0.3}
                gap={2}
                segments={[
                  {
                    value: summary.memorizedAyahs,
                    color: '#0d5c4f',
                    label: `Memorized: ${summary.memorizedAyahs} ayahs`,
                  },
                  {
                    value: remaining,
                    color: '#e6ebe9',
                    label: `Remaining: ${remaining} ayahs`,
                  },
                ]}
              >
                <div className="text-4xl font-extrabold tracking-tight text-brand-900">
                  {summary.percent.toFixed(1)}
                  <span className="text-lg font-bold">%</span>
                </div>
                <div className="mt-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                  of the Quran
                </div>
              </Donut>
            ) : (
              <Donut
                ariaLabel="Memorization progress for each of the 30 juz"
                size={230}
                thickness={0.42}
                gap={1.5}
                segments={juzSegments}
              >
                <div className="text-3xl font-extrabold tracking-tight text-brand-900">
                  {summary.juzCompleted}
                  <span className="text-base font-bold text-slate-400">/30</span>
                </div>
                <div className="mt-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                  juz complete
                </div>
              </Donut>
            )}
          </div>

          {view === 'quran' ? (
            <div className="w-full max-w-[260px] space-y-2.5">
              {[
                { color: '#0d5c4f', label: 'Memorized', count: summary.memorizedAyahs },
                { color: '#e6ebe9', label: 'Remaining', count: remaining },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: row.color }}
                  />
                  <span className="flex-1 text-xs font-medium text-slate-600">{row.label}</span>
                  <span className="text-xs font-bold text-slate-800">{row.count.toLocaleString()}</span>
                </div>
              ))}
              <div className="mt-3 border-t border-dashed border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500">
                Counted from every new, recent and old hifz you have recorded — overlaps are only
                counted once.
              </div>
            </div>
          ) : (
            <div className="grid w-full max-w-[300px] grid-cols-3 gap-1.5">
              {summary.juz.map((j) => (
                <div
                  key={j.juz}
                  title={`Juz ${j.juz}: ${j.memorized}/${j.total}`}
                  className="rounded-lg px-1 py-1.5 text-center ring-1 ring-black/5"
                  style={{ background: ratioColor(j.ratio) }}
                >
                  <div
                    className={`text-[11px] font-bold ${
                      j.ratio > 0.45 ? 'text-white' : 'text-brand-900'
                    }`}
                  >
                    {j.juz}
                  </div>
                  <div
                    className={`text-[9px] font-medium ${
                      j.ratio > 0.45 ? 'text-white/80' : 'text-brand-900/60'
                    }`}
                  >
                    {Math.round(j.ratio * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Juz complete" value={String(summary.juzCompleted)} hint={`of ${NUM_JUZ}`} />
        <Stat label="Surahs complete" value={String(summary.surahsCompleted)} hint="of 114" />
        <Stat label="New in 7 days" value={String(summary.last7Days)} hint="ayahs" />
        <Stat label="Class days logged" value={String(summary.activeDays)} />
      </div>
    </section>
  )
}
