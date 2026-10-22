import { useEffect, useMemo, useState } from 'react'
import { BUCKET_META, type HifzBuckets, type UserDoc } from '../lib/types'
import { getEntry, saveEntry, todayISO } from '../lib/db'
import { countAyahs, formatRange, type HifzRange } from '../lib/quran'
import RangeEditor from '../components/RangeEditor'
import { Sheet } from '../components/Ui'
import { authErrorMessage } from '../context/AuthContext'

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const EMPTY: HifzBuckets = { newHifz: [], recentHifz: [], oldHifz: [] }

/**
 * The daily class log for one student: new, recent and old hifz recorded
 * separately, exactly as recited in class.
 */
export default function EntryEditor({
  student,
  teacherId,
  open,
  initialDate,
  onClose,
  onSaved,
}: {
  student: UserDoc | null
  teacherId: string
  open: boolean
  initialDate: string
  onClose: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState(initialDate)
  const [buckets, setBuckets] = useState<HifzBuckets>(EMPTY)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset whenever a different student is opened.
  useEffect(() => {
    if (!open || !student) return
    setDate(initialDate)
  }, [open, student?.uid, initialDate])

  useEffect(() => {
    if (!open || !student) return
    let cancelled = false
    setLoading(true)
    setError('')
    getEntry(student.uid, date)
      .then((e) => {
        if (cancelled) return
        if (e) {
          setBuckets({
            newHifz: e.newHifz ?? [],
            recentHifz: e.recentHifz ?? [],
            oldHifz: e.oldHifz ?? [],
          })
          setNote(e.note ?? '')
        } else {
          setBuckets(EMPTY)
          setNote('')
        }
      })
      .catch(() => !cancelled && setBuckets(EMPTY))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [open, student?.uid, date])

  const totals = useMemo(
    () => ({
      newHifz: countAyahs(buckets.newHifz),
      recentHifz: countAyahs(buckets.recentHifz),
      oldHifz: countAyahs(buckets.oldHifz),
    }),
    [buckets],
  )

  const isEmpty =
    buckets.newHifz.length === 0 && buckets.recentHifz.length === 0 && buckets.oldHifz.length === 0

  function setBucket(key: keyof HifzBuckets, next: HifzRange[]) {
    setBuckets((b) => ({ ...b, [key]: next }))
  }

  async function save(entryDate: string) {
    if (!student) return
    setSaving(true)
    setError('')
    try {
      await saveEntry({
        studentId: student.uid,
        teacherId,
        date: entryDate,
        newHifz: buckets.newHifz,
        recentHifz: buckets.recentHifz,
        oldHifz: buckets.oldHifz,
        note,
      })
      onSaved()
      onClose()
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  /** "Nothing recorded today" is a real answer, so allow saving an empty day. */
  async function markAbsent() {
    await save(date)
  }

  return (
    <Sheet
      open={open && !!student}
      onClose={onClose}
      title={student?.name ?? ''}
      subtitle={`Daily hifz log · ${prettyDate(date)}`}
    >
      <div className="scroll-thin flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <label className="mb-4 block">
          <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Class date
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value || todayISO())}
              className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-brand-600"
            />
            <button
              onClick={() => setDate(todayISO())}
              className="shrink-0 rounded-2xl bg-slate-100 px-3 py-3 text-xs font-bold text-slate-600 active:bg-slate-200"
            >
              Today
            </button>
          </div>
        </label>

        <div className="space-y-4">
          {BUCKET_META.map((b) => (
            <section
              key={b.key}
              className={`rounded-2xl bg-white p-3.5 ring-1 ${
                b.key === 'newHifz'
                  ? 'ring-emerald-100'
                  : b.key === 'recentHifz'
                    ? 'ring-amber-100'
                    : 'ring-sky-100'
              }`}
            >
              <div className="mb-2.5 flex items-baseline gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    b.key === 'newHifz'
                      ? 'bg-emerald-500'
                      : b.key === 'recentHifz'
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                  }`}
                />
                <h3 className="text-[13px] font-bold text-slate-800">{b.title}</h3>
                <span className="font-arabic text-xs text-slate-400" dir="rtl">
                  {b.arabic}
                </span>
                <span className="ml-auto shrink-0 text-[11px] font-semibold text-slate-400">
                  {totals[b.key]} ayah{totals[b.key] === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mb-2.5 text-[11px] text-slate-400">{b.subtitle}</p>
              <RangeEditor
                value={buckets[b.key]}
                onChange={(next) => setBucket(b.key, next)}
                accent={b.key === 'newHifz' ? 'emerald' : b.key === 'recentHifz' ? 'amber' : 'sky'}
                emptyHint="Nothing recorded for this section."
              />
            </section>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Teacher note (optional)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="e.g. Excellent tajweed, needs work on madd…"
            className="w-full resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-200 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
          />
        </label>

        {(buckets.newHifz.length || buckets.recentHifz.length || buckets.oldHifz.length) && (
          <div className="mt-4 rounded-2xl bg-brand-50 p-3">
            <p className="text-[11px] font-semibold tracking-wide text-brand-800 uppercase">
              Summary for {prettyDate(date)}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {BUCKET_META.filter((b) => buckets[b.key].length > 0).map((b) => (
                <li key={b.key} className="text-[11px] text-brand-900">
                  <b>{b.title}:</b> {buckets[b.key].map(formatRange).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error ? (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-3 text-center text-[11px] text-slate-400">Loading saved entry…</p>
        ) : null}
      </div>

      <div className="safe-bottom shrink-0 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => save(date)}
          disabled={saving || loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-900/15 active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="spinner h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </>
          ) : (
            `Save log for ${prettyDate(date)}`
          )}
        </button>
        {!isEmpty ? null : (
          <button
            onClick={markAbsent}
            disabled={saving}
            className="mt-2 w-full rounded-2xl py-2.5 text-xs font-semibold text-slate-400 active:bg-slate-50 disabled:opacity-60"
          >
            Nothing recited today — save an empty day
          </button>
        )}
      </div>
    </Sheet>
  )
}
