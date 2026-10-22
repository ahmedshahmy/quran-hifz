import { useMemo, useState } from 'react'
import { SURAHS, formatRange, isValidRange, type HifzRange } from '../lib/quran'

const ACCENTS = {
  emerald: {
    ring: 'ring-emerald-200',
    chip: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    btn: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
    text: 'text-emerald-700',
  },
  amber: {
    ring: 'ring-amber-200',
    chip: 'bg-amber-50 text-amber-900 ring-amber-200',
    btn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
    text: 'text-amber-700',
  },
  sky: {
    ring: 'ring-sky-200',
    chip: 'bg-sky-50 text-sky-900 ring-sky-200',
    btn: 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800',
    text: 'text-sky-700',
  },
} as const

/** Bottom-sheet surah chooser: 114 items need search, not a native select. */
function SurahSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (n: number) => void
}) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return SURAHS
    return SURAHS.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.english.toLowerCase().includes(needle) ||
        s.arabic.includes(q.trim()) ||
        String(s.n) === needle,
    )
  }, [q])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="animate-fade-up relative flex max-h-[80vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 pt-3 pb-3">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search surah…"
            className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3.5 py-2.5 text-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2"
          />
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 active:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="scroll-thin overflow-y-auto overscroll-contain p-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">No surah matched “{q}”.</p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.n}
                onClick={() => {
                  onPick(s.n)
                  onClose()
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left active:bg-brand-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-800">
                  {s.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {s.name}
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {s.english} · {s.ayahs} ayahs
                  </span>
                </span>
                <span className="font-arabic shrink-0 text-base text-brand-800">{s.arabic}</span>
              </button>
            ))
          )}
        </div>
        <div className="safe-bottom shrink-0" />
      </div>
    </div>
  )
}

interface RangeEditorProps {
  value: HifzRange[]
  onChange: (next: HifzRange[]) => void
  accent?: keyof typeof ACCENTS
  /** Shown when the list is empty. */
  emptyHint?: string
}

/**
 * Adds ayah ranges for one hifz bucket (new / recent / old).
 * Each entry is "surah + first ayah + last ayah", which is what a teacher
 * actually says in class ("Al-Mulk, ayahs 1 to 10").
 */
export default function RangeEditor({
  value,
  onChange,
  accent = 'emerald',
  emptyHint = 'Nothing added yet.',
}: RangeEditorProps) {
  const a = ACCENTS[accent]
  const [sheetOpen, setSheetOpen] = useState(false)
  const [surah, setSurah] = useState<number>(1)
  const [from, setFrom] = useState('1')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')

  const chosen = SURAHS.find((s) => s.n === surah)!
  const fromNum = Number(from)
  const toNum = to.trim() === '' ? fromNum : Number(to)

  function add() {
    const range: HifzRange = { surah, from: fromNum, to: toNum }
    if (!Number.isInteger(fromNum) || !Number.isInteger(toNum)) {
      setError('Enter ayah numbers.')
      return
    }
    if (!isValidRange(range)) {
      setError(`${chosen.name} has ayahs 1–${chosen.ayahs}. Check your range.`)
      return
    }
    const already = value.some(
      (r) => r.surah === range.surah && r.from === range.from && r.to === range.to,
    )
    if (already) {
      setError('That range is already in the list.')
      return
    }
    setError('')
    onChange([...value, range])
    // Keep the chosen surah so the teacher can add another range from it.
    setFrom(String(range.to + 1 <= chosen.ayahs ? range.to + 1 : 1))
    setTo('')
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  function addWholeSurah() {
    const range: HifzRange = { surah, from: 1, to: chosen.ayahs }
    if (value.some((r) => r.surah === surah && r.from === 1 && r.to === chosen.ayahs)) {
      setError('That whole surah is already in the list.')
      return
    }
    setError('')
    onChange([...value, range])
  }

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl bg-slate-50 p-3 ring-1 ${a.ring}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSheetOpen(true)}
            className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-slate-200 active:bg-slate-50"
          >
            <span className="block truncate text-sm font-semibold text-slate-800">
              {chosen.n}. {chosen.name}
            </span>
            <span className="block truncate text-[11px] text-slate-400">
              {chosen.ayahs} ayahs · {chosen.place}
            </span>
          </button>
          <button
            onClick={addWholeSurah}
            className={`shrink-0 rounded-xl px-2.5 py-2.5 text-[11px] font-bold text-white ${a.btn}`}
            title="Add the entire surah"
          >
            Full
          </button>
        </div>

        <div className="mt-2 flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              From ayah
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={chosen.ayahs}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-2.5 text-center text-sm font-semibold ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <span className="pb-3 text-slate-400">–</span>
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              To ayah
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={chosen.ayahs}
              value={to}
              placeholder={String(fromNum || 1)}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-2.5 text-center text-sm font-semibold ring-1 ring-slate-200 outline-none placeholder:font-normal placeholder:text-slate-300 focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <button
            onClick={add}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm ${a.btn}`}
          >
            Add
          </button>
        </div>

        {error ? <p className="mt-2 text-[11px] font-medium text-rose-600">{error}</p> : null}
      </div>

      {value.length === 0 ? (
        <p className="px-1 text-[11px] text-slate-400">{emptyHint}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((r, i) => (
            <li
              key={`${r.surah}-${r.from}-${r.to}-${i}`}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${a.chip}`}
            >
              {formatRange(r)}
              <button
                onClick={() => removeAt(i)}
                aria-label={`Remove ${formatRange(r)}`}
                className="-mr-1 rounded-full p-0.5 opacity-50 hover:opacity-100 active:bg-black/5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <SurahSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onPick={(n) => {
        setSurah(n)
        setFrom('1')
        setTo('')
        setError('')
      }} />
    </div>
  )
}
