import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createStudentProfile } from '../lib/db'
import { authErrorMessage } from '../context/AuthContext'

/**
 * Shown when someone is signed in but has no class profile.
 *
 * Two cases reach here:
 *   1. A signup that created the login but failed to write the profile.
 *   2. A student the teacher removed from the class — their login survives, so
 *      they need a way back in rather than a dead end.
 */
export default function FinishSetup() {
  const { firebaseUser, refreshProfile, logout } = useAuth()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)

  async function join(e: React.FormEvent) {
    e.preventDefault()
    if (!firebaseUser) return
    setBusy(true)
    setError('')
    try {
      const name =
        firebaseUser.displayName?.trim() ||
        firebaseUser.email?.split('@')[0] ||
        'Student'
      await createStudentProfile(firebaseUser.uid, name, firebaseUser.email ?? '', code)
      // The auth context subscribes to this profile live, so the dashboard
      // appears on its own once the document exists.
      await refreshProfile()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f6f7f6] p-5">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
            🎓
          </div>
          <h1 className="text-center text-lg font-bold text-slate-900">Join your hifz class</h1>
          <p className="mt-2 text-center text-[13px] leading-relaxed text-slate-500">
            Your login works, but it isn’t linked to a class yet. Enter the code your teacher
            gave you.
          </p>

          <form onSubmit={join} className="mt-5 space-y-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CLASS CODE"
              maxLength={6}
              required
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-center text-lg font-bold tracking-[0.25em] text-slate-900 uppercase ring-1 ring-slate-200 outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
            />

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
                  Joining…
                </>
              ) : (
                'Join class'
              )}
            </button>
          </form>

          <button
            onClick={async () => {
              setRetrying(true)
              try {
                await refreshProfile()
              } catch {
                /* stays on this screen */
              } finally {
                setRetrying(false)
              }
            }}
            disabled={retrying}
            className="mt-2 w-full rounded-2xl py-2.5 text-xs font-semibold text-slate-400 active:bg-slate-50 disabled:opacity-60"
          >
            {retrying ? 'Checking…' : 'I just signed up — retry setup'}
          </button>
        </div>

        <button
          onClick={logout}
          className="mt-3 w-full rounded-2xl py-3 text-xs font-semibold text-slate-400 active:bg-slate-100"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
