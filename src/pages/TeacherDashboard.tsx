import { useEffect, useMemo, useState } from 'react'
import { useAuth, authErrorMessage } from '../context/AuthContext'
import {
  addStudent,
  fetchAllEntries,
  removeStudent,
  todayISO,
  watchAllStudents,
  watchEntriesForDate,
} from '../lib/db'
import type { Entry, UserDoc } from '../lib/types'
import { AppHeader, ClassCodeChip, EmptyState, Sheet } from '../components/Ui'
import Footer from '../components/Footer'
import EntryEditor from './EntryEditor'
import ProgressPanel from '../components/ProgressPanel'
import { summarize } from '../lib/progress'

function AddStudentSheet({
  open,
  onClose,
  teacher,
}: {
  open: boolean
  onClose: () => void
  teacher: UserDoc
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ name: string; email: string; password: string } | null>(null)

  function reset() {
    setName('')
    setEmail('')
    setPassword('')
    setError('')
    setDone(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await addStudent(teacher, name, email, password)
      setDone({ name: name.trim(), email: email.trim(), password })
      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        onClose()
        reset()
      }}
      title="Add a student"
      subtitle={`Joins class ${teacher.classCode}`}
    >
      <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
        {done ? (
          <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <p className="text-sm font-bold text-emerald-900">Student added ✓</p>
            <p className="mt-1 text-[13px] leading-relaxed text-emerald-800">
              Give these login details to {done.name}:
            </p>
            <dl className="mt-3 space-y-1.5 rounded-xl bg-white/70 p-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-emerald-700/70">Email</dt>
                <dd className="truncate font-semibold text-emerald-900">{done.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-emerald-700/70">Password</dt>
                <dd className="font-mono font-semibold text-emerald-900">{done.password}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-emerald-700/70">Class code</dt>
                <dd className="font-mono font-semibold text-emerald-900">{teacher.classCode}</dd>
              </div>
            </dl>
            <button
              onClick={reset}
              className="mt-3 w-full rounded-xl bg-white py-2.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200"
            >
              Add another student
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Student name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Yusuf Ahmed"
                autoComplete="off"
                required
                className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-[15px] ring-1 ring-slate-200 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Login email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yusuf@example.com"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-[15px] ring-1 ring-slate-200 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Temporary password
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
                className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-[15px] ring-1 ring-slate-200 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
              />
              <span className="mt-1.5 block text-[11px] text-slate-400">
                The student can change it later by resetting their password.
              </span>
            </label>

            {error ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-900 py-3.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? (
                <>
                  <span className="spinner h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                  Creating account…
                </>
              ) : (
                'Create student login'
              )}
            </button>

            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[11px] leading-relaxed text-slate-500">
                Prefer to let students sign up themselves? Share your class code{' '}
                <b className="tracking-wider text-slate-700">{teacher.classCode}</b> — they choose
                “I am a student” on the sign-up screen.
              </p>
            </div>
          </form>
        )}
      </div>
      <div className="safe-bottom shrink-0" />
    </Sheet>
  )
}

/**
 * Confirmation before removing a student. Deleting the profile and every hifz
 * entry is irreversible, so it is a two-step action with the name shown.
 */
function RemoveStudentSheet({
  student,
  onClose,
}: {
  student: UserDoc | null
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<number | null>(null)

  useEffect(() => {
    if (student) {
      setError('')
      setDone(null)
    }
  }, [student?.uid])

  async function confirm() {
    if (!student) return
    setBusy(true)
    setError('')
    try {
      const { entries } = await removeStudent(student.uid)
      setDone(entries)
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={!!student}
      onClose={onClose}
      title={done === null ? 'Remove student?' : 'Student removed'}
      subtitle={student?.name}
    >
      <div className="px-4 py-4">
        {done === null ? (
          <>
            <p className="text-[13px] leading-relaxed text-slate-600">
              <b>{student?.name}</b> will be removed from your class and{' '}
              <b>all of their hifz records will be deleted</b>. This cannot be undone.
            </p>
            <ul className="mt-3 space-y-1.5 rounded-2xl bg-slate-50 p-3.5 text-[11px] leading-relaxed text-slate-500">
              <li>• Their daily sabaq, sabqi and manzil history is erased.</li>
              <li>• Their login still works — they can rejoin with your class code.</li>
              <li>• To re-add them yourself, use a different email address.</li>
            </ul>

            {error ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
                {error}
              </p>
            ) : null}

            <button
              onClick={confirm}
              disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? (
                <>
                  <span className="spinner h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                  Removing…
                </>
              ) : (
                'Remove and delete their records'
              )}
            </button>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-2xl py-3 text-xs font-semibold text-slate-500 active:bg-slate-100"
            >
              Keep student
            </button>
          </>
        ) : (
          <>
            <p className="text-[13px] leading-relaxed text-slate-600">
              <b>{student?.name}</b> has been removed from your class.
              {done > 0
                ? ` ${done} day${done === 1 ? '' : 's'} of hifz records were deleted.`
                : ' They had no hifz records.'}
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-2xl bg-brand-900 py-3.5 text-sm font-bold text-white"
            >
              Done
            </button>
          </>
        )}
      </div>
      <div className="safe-bottom" />
    </Sheet>
  )
}

function StudentRow({
  student,
  logged,
  onClick,
  onOptions,
}: {
  student: UserDoc
  logged: boolean
  onClick: () => void
  onOptions: () => void
}) {
  const initials = student.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="flex w-full items-stretch gap-0 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition">
      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-l-2xl p-3 text-left active:scale-[0.995]"
      >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
          logged ? 'bg-brand-900 text-white' : 'bg-brand-50 text-brand-800'
        }`}
      >
        {initials || '🎓'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold text-slate-800">{student.name}</div>
        <div className="truncate text-[11px] text-slate-400">{student.email}</div>
      </div>
      {logged ? (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          ✓ Logged
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
          Due
        </span>
      )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5d1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <button
        onClick={onOptions}
        aria-label={`Options for ${student.name}`}
        className="flex w-11 shrink-0 items-center justify-center rounded-r-2xl border-l border-slate-100 text-slate-400 active:bg-slate-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.9" />
          <circle cx="12" cy="12" r="1.9" />
          <circle cx="12" cy="19" r="1.9" />
        </svg>
      </button>
    </div>
  )
}

export default function TeacherDashboard() {
  const { profile, logout } = useAuth()
  const [students, setStudents] = useState<UserDoc[]>([])
  // Distinguishes "the class really is empty" from "the first snapshot has not
  // arrived yet" - on a slow network Firestore can take several seconds, and an
  // empty list would otherwise look like the roster was wiped.
  const [rosterLoaded, setRosterLoaded] = useState(false)
  const [dayEntries, setDayEntries] = useState<Entry[]>([])
  const [allEntries, setAllEntries] = useState<Entry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyVersion, setHistoryVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [removing, setRemoving] = useState<UserDoc | null>(null)
  const [editing, setEditing] = useState<UserDoc | null>(null)
  const [date, setDate] = useState(todayISO())
  const [tab, setTab] = useState<'students' | 'class'>('students')

  // Depend on the uid, not the whole profile object: `profile` is replaced on
  // every live snapshot, and re-subscribing on each replacement tore the
  // listener down before Firestore delivered its first result.
  const uid = profile?.uid

  useEffect(() => {
    if (!uid) return
    // The roster is shared: every teacher manages every student.
    return watchAllStudents((rows) => {
      setStudents(rows)
      setRosterLoaded(true)
    })
  }, [uid])

  // Only the selected day's entries, for the "logged today" counter.
  useEffect(() => {
    if (!uid) return
    return watchEntriesForDate(date, setDayEntries)
  }, [uid, date])

  // The class-progress tab needs the full history; load it when opened rather
  // than holding a permanent listener over every entry ever recorded.
  useEffect(() => {
    if (tab !== 'class' || !uid) return
    let cancelled = false
    setLoadingHistory(true)
    fetchAllEntries()
      .then((rows) => !cancelled && setAllEntries(rows))
      .catch(() => !cancelled && setAllEntries([]))
      .finally(() => !cancelled && setLoadingHistory(false))
    return () => {
      cancelled = true
    }
  }, [tab, uid, historyVersion])

  const loggedToday = useMemo(() => {
    const set = new Set<string>()
    for (const e of dayEntries) set.add(e.studentId)
    return set
  }, [dayEntries])

  const classSummary = useMemo(() => {
    // Aggregate the whole school's history for a class-wide view.
    const ids = new Set(students.map((s) => s.uid))
    return summarize(allEntries.filter((e) => ids.has(e.studentId)))
  }, [allEntries, students])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    )
  }, [students, query])

  if (!profile) return null

  const doneCount = students.filter((s) => loggedToday.has(s.uid)).length

  return (
    <div className="min-h-dvh bg-[#f6f7f6] pb-24">
      <AppHeader
        title={`As-salāmu ʿalaykum, ${profile.name.split(' ')[0]}`}
        subtitle="Teacher · Quran Hifz Class"
        onLogout={logout}
        right={<ClassCodeChip code={profile.classCode} />}
      />

      <div className="mx-auto max-w-lg">
        <div className="flex gap-1.5 px-4 pt-4">
          {(
            [
              { k: 'students' as const, label: `Students (${students.length})` },
              { k: 'class' as const, label: 'Class progress' },
            ]
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                tab === t.k
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'bg-white text-slate-500 ring-1 ring-black/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'students' ? (
          <>
            <div className="px-4 pt-4">
              <div className="rounded-3xl bg-gradient-to-br from-brand-900 to-brand-700 p-4 text-white shadow-lg shadow-brand-900/15">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wide text-brand-200 uppercase">
                      Logged today
                    </p>
                    <p className="mt-1 text-3xl font-extrabold">
                      {doneCount}
                      <span className="text-lg font-bold text-brand-300">/{students.length}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <label className="mb-1 block text-[10px] font-semibold tracking-wide text-brand-200 uppercase">
                      Class date
                    </label>
                    <input
                      type="date"
                      value={date}
                      max={todayISO()}
                      onChange={(e) => setDate(e.target.value || todayISO())}
                      className="rounded-xl bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/20 outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gold-400 transition-all duration-500"
                    style={{
                      width: `${students.length ? (doneCount / students.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="px-4 pt-4">
              <div className="relative">
                <svg
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students…"
                  className="w-full rounded-2xl bg-white py-3 pr-4 pl-10 text-sm ring-1 ring-black/5 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600"
                />
              </div>
            </div>

            <div className="space-y-2 px-4 py-4">
              {!rosterLoaded ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="spinner h-7 w-7 rounded-full border-2 border-brand-200 border-t-brand-700" />
                  <p className="text-[11px] text-slate-400">Loading students…</p>
                </div>
              ) : students.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="No students yet"
                  body="Add your first student to start recording daily sabaq, sabqi and manzil."
                  action={
                    <button
                      onClick={() => setAddOpen(true)}
                      className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/20"
                    >
                      Add a student
                    </button>
                  }
                />
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  No student matches “{query}”.
                </p>
              ) : (
                filtered.map((s) => (
                  <StudentRow
                    key={s.uid}
                    student={s}
                    logged={loggedToday.has(s.uid)}
                    onClick={() => setEditing(s)}
                    onOptions={() => setRemoving(s)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 px-4 py-4">
            {loadingHistory ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="spinner h-7 w-7 rounded-full border-2 border-brand-200 border-t-brand-700" />
                <p className="text-[11px] text-slate-400">Loading class history…</p>
              </div>
            ) : students.length === 0 ? (
              <EmptyState
                icon="📊"
                title="Nothing to show yet"
                body="Class progress appears once you have students and have logged some hifz."
              />
            ) : (
              <>
                <ProgressPanel summary={classSummary} />
                <div className="space-y-2">
                  <h3 className="px-1 text-xs font-bold tracking-wide text-slate-500 uppercase">
                    Per student
                  </h3>
                  {students.map((s) => {
                    const own = summarize(allEntries.filter((e) => e.studentId === s.uid))
                    return (
                      <button
                        key={s.uid}
                        onClick={() => setEditing(s)}
                        className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-slate-800">{s.name}</div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-brand-700"
                              style={{ width: `${Math.max(1, own.percent)}%` }}
                            />
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-extrabold text-brand-800">
                          {own.percent.toFixed(1)}%
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <Footer />
      </div>

      {/* Floating add button */}
      <button
        onClick={() => setAddOpen(true)}
        aria-label="Add student"
        className="fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-900 text-white shadow-xl shadow-brand-900/30 transition active:scale-95"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <AddStudentSheet open={addOpen} onClose={() => setAddOpen(false)} teacher={profile} />

      <RemoveStudentSheet student={removing} onClose={() => setRemoving(null)} />

      <EntryEditor
        student={editing}
        teacherId={profile.uid}
        teacherName={profile.name}
        open={!!editing}
        initialDate={date}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          setHistoryVersion((v) => v + 1)
        }}
      />
    </div>
  )
}
