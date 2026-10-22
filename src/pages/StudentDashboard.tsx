import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { todayISO, watchEntries } from '../lib/db'
import { isoOf } from '../lib/date'
import type { Entry } from '../lib/types'
import { BUCKET_META } from '../lib/types'
import { formatRange, countAyahs } from '../lib/quran'
import { useProgress } from '../lib/progress'
import { AppHeader } from '../components/Ui'
import ProgressPanel from '../components/ProgressPanel'

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = todayISO()
  if (iso === today) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (iso === isoOf(yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

const ACCENT_CLASS = {
  newHifz: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  recentHifz: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  oldHifz: { dot: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50' },
} as const

function BucketLine({ entry }: { entry: Entry }) {
  return (
    <div className="space-y-1.5">
      {BUCKET_META.map((b) => {
        const ranges = entry[b.key] ?? []
        if (ranges.length === 0) return null
        const a = ACCENT_CLASS[b.key]
        return (
          <div key={b.key} className="flex items-start gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.dot}`} />
            <div className="min-w-0 flex-1">
              <span className={`text-[10px] font-bold tracking-wide uppercase ${a.text}`}>
                {b.title}
              </span>
              <p className="text-[13px] leading-snug text-slate-700">
                {ranges.map(formatRange).join(' · ')}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Parses YYYY-MM-DD as a local date (new Date() would treat it as UTC). */
function localDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function DayCard({ entry, defaultOpen }: { entry: Entry; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  const total =
    countAyahs(entry.newHifz ?? []) +
    countAyahs(entry.recentHifz ?? []) +
    countAyahs(entry.oldHifz ?? [])

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-3.5 text-left active:bg-slate-50"
      >
        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50">
          <span className="text-[15px] leading-none font-extrabold text-brand-900">
            {Number(entry.date.slice(8, 10))}
          </span>
          <span className="text-[8px] font-bold tracking-wide text-brand-600 uppercase">
            {localDate(entry.date).toLocaleDateString(undefined, { month: 'short' })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-slate-800">{prettyDate(entry.date)}</div>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {BUCKET_META.map((b) => {
              const n = (entry[b.key] ?? []).length
              if (!n) return null
              const a = ACCENT_CLASS[b.key]
              return (
                <span
                  key={b.key}
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${a.bg} ${a.text}`}
                >
                  {b.title.split(' ')[0]} · {n}
                </span>
              )
            })}
            {total === 0 ? (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                No hifz
              </span>
            ) : null}
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#cbd5d1"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {open ? (
        <div className="border-t border-slate-100 px-3.5 pt-3 pb-3.5">
          <BucketLine entry={entry} />
          {entry.note ? (
            <p className="mt-2.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
              <b>Teacher note:</b> {entry.note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function StudentDashboard() {
  const { profile, logout } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState<'progress' | 'history'>('progress')

  useEffect(() => {
    if (!profile) return
    return watchEntries(profile.uid, (rows) => {
      setEntries(rows)
      setLoaded(true)
    })
  }, [profile])

  const summary = useProgress(entries)
  const today = entries.find((e) => e.date === todayISO())

  const streak = useMemo(() => {
    // Count consecutive logged days ending today (or yesterday, if today is
    // not logged yet — the day is not over).
    const dates = new Set(entries.map((e) => e.date))
    let count = 0
    const d = new Date()
    if (!dates.has(todayISO())) d.setDate(d.getDate() - 1)
    for (;;) {
      if (!dates.has(isoOf(d))) break
      count++
      d.setDate(d.getDate() - 1)
      if (count > 3650) break
    }
    return count
  }, [entries])

  if (!profile) return null

  return (
    <div className="min-h-dvh bg-[#f6f7f6] pb-10">
      <AppHeader
        title={profile.name}
        subtitle={profile.teacherName ? `Class of ${profile.teacherName}` : 'Student'}
        onLogout={logout}
        right={
          streak > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-bold text-gold-300 ring-1 ring-white/15">
              🔥 {streak}
            </span>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-lg px-4 pt-4">
        {!loaded ? (
          <div className="flex justify-center py-16">
            <div className="spinner h-7 w-7 rounded-full border-2 border-brand-200 border-t-brand-700" />
          </div>
        ) : (
          <>
            <div className="mb-4 flex rounded-2xl bg-white p-1 text-xs font-bold ring-1 ring-black/5">
              {(
                [
                  { k: 'progress' as const, label: 'My progress' },
                  { k: 'history' as const, label: 'Daily history' },
                ]
              ).map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex-1 rounded-xl py-2.5 transition ${
                    tab === t.k ? 'bg-brand-900 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'progress' ? (
              <div className="space-y-4">
                <ProgressPanel summary={summary} />

                {today ? (
                  <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-black/5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Today
                      </span>
                      <span className="text-[11px] text-slate-400">recorded by your teacher</span>
                    </div>
                    <BucketLine entry={today} />
                    {today.note ? (
                      <p className="mt-2.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                        <b>Teacher note:</b> {today.note}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5">
                    <p className="text-sm font-semibold text-slate-700">Nothing logged yet today</p>
                    <p className="mt-1 text-[12px] text-slate-400">
                      Your teacher will record today’s sabaq after class.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <h3 className="px-1 text-xs font-bold tracking-wide text-slate-500 uppercase">
                    Surah progress
                  </h3>
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    {summary.surahs.filter((s) => s.memorized > 0).length === 0 ? (
                      <p className="p-4 text-center text-[12px] text-slate-400">
                        No hifz recorded yet. Your surah progress will appear here.
                      </p>
                    ) : (
                      summary.surahs
                        .filter((s) => s.memorized > 0)
                        .map((s) => (
                          <div
                            key={s.surah.n}
                            className="flex items-center gap-3 border-b border-slate-50 px-3.5 py-2 last:border-0"
                          >
                            <span className="w-6 shrink-0 text-[10px] font-bold text-slate-300">
                              {s.surah.n}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-[13px] font-semibold text-slate-800">
                                  {s.surah.name}
                                </span>
                                <span className="shrink-0 text-[10px] font-bold text-slate-400">
                                  {s.memorized}/{s.total}
                                </span>
                              </div>
                              <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${
                                    s.complete ? 'bg-gold-500' : 'bg-brand-700'
                                  }`}
                                  style={{ width: `${Math.max(2, s.ratio * 100)}%` }}
                                />
                              </div>
                            </div>
                            <span className="font-arabic w-14 shrink-0 text-right text-[11px] text-brand-800">
                              {s.surah.arabic}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.length === 0 ? (
                  <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
                    <div className="mb-3 text-3xl">📖</div>
                    <p className="text-sm font-semibold text-slate-700">No class days yet</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                      Once your teacher records your hifz, each day appears here with what you
                      recited.
                    </p>
                  </div>
                ) : (
                  entries.map((e, i) => <DayCard key={e.id} entry={e} defaultOpen={i === 0} />)
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
