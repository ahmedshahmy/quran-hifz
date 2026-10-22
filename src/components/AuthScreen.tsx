import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Footer from './Footer'

type Mode = 'login' | 'teacher' | 'student'

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-[15px] text-slate-900 ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
      />
    </label>
  )
}

export default function AuthScreen() {
  const { login, signupTeacher, signupStudent, error, setError } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else if (mode === 'teacher') await signupTeacher(name, email, password)
      else await signupStudent(name, email, password, code)
    } catch {
      /* the context puts a readable message in `error` */
    } finally {
      setBusy(false)
    }
  }

  const titles: Record<Mode, string> = {
    login: 'Welcome back',
    teacher: 'Create a teacher account',
    student: 'Join your hifz class',
  }
  const subtitles: Record<Mode, string> = {
    login: 'Sign in to continue with your class.',
    teacher: 'You will get a class code to share with your students.',
    student: 'Enter the class code your teacher gave you.',
  }

  return (
    <div className="min-h-dvh bg-brand-950">
      <div className="relative overflow-hidden px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10 text-center">
        <div
          className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle,#43b499,transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle,#d9a441,transparent 70%)' }}
        />
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f5d78e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5.5A1.5 1.5 0 015.5 4H10a2 2 0 012 2v13a2 2 0 00-2-2H5.5A1.5 1.5 0 014 15.5v-10z" />
            <path d="M20 5.5A1.5 1.5 0 0018.5 4H14a2 2 0 00-2 2v13a2 2 0 012-2h4.5a1.5 1.5 0 001.5-1.5v-10z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">Quran Hifz Class</h1>
        <p className="font-arabic mt-1 text-lg text-gold-300" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </div>

      <div className="animate-fade-up min-h-[60dvh] rounded-t-[2rem] bg-white px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-5 flex rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-xl py-2.5 transition ${
                mode === 'login' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => switchMode('teacher')}
              className={`flex-1 rounded-xl py-2.5 transition ${
                mode !== 'login' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign up
            </button>
          </div>

          {mode !== 'login' ? (
            <div className="mb-5 grid grid-cols-2 gap-2">
              {(
                [
                  { m: 'teacher' as const, label: 'I am a teacher', icon: '👨‍🏫' },
                  { m: 'student' as const, label: 'I am a student', icon: '🎓' },
                ]
              ).map((o) => (
                <button
                  key={o.m}
                  onClick={() => switchMode(o.m)}
                  className={`rounded-2xl px-3 py-3 text-xs font-bold ring-1 transition ${
                    mode === o.m
                      ? 'bg-brand-50 text-brand-900 ring-brand-300'
                      : 'bg-white text-slate-500 ring-slate-200'
                  }`}
                >
                  <span className="mb-1 block text-lg">{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
          ) : null}

          <h2 className="text-lg font-bold text-slate-900">{titles[mode]}</h2>
          <p className="mt-0.5 mb-4 text-[13px] text-slate-500">{subtitles[mode]}</p>

          <form onSubmit={submit} className="space-y-3.5">
            {mode !== 'login' ? (
              <Field
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abdullah Khan"
                autoComplete="name"
                required
              />
            ) : null}

            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              required
            />

            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? 'Your password' : 'At least 6 characters'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'login' ? undefined : 6}
              required
            />

            {mode === 'student' ? (
              <Field
                label="Class code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. K7QP2M"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={6}
                className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-center text-lg font-bold tracking-[0.25em] text-slate-900 uppercase ring-1 ring-slate-200 outline-none placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
                required
              />
            ) : null}

            {error ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-900 py-4 text-[15px] font-bold text-white shadow-lg shadow-brand-900/20 transition active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? (
                <>
                  <span className="spinner h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                  Please wait…
                </>
              ) : mode === 'login' ? (
                'Log in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
            {mode === 'login'
              ? 'Teachers and students use the same login screen.'
              : mode === 'teacher'
                ? 'Your class code is generated automatically after signup.'
                : 'No class code yet? Ask your teacher to add you.'}
          </p>
        </div>

        <Footer />
      </div>
    </div>
  )
}
