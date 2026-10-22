import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthScreen from './components/AuthScreen'
import SetupNotice from './components/SetupNotice'
import Splash from './components/Splash'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import { isConfigMissing } from './lib/firebase-config'

function Gate() {
  const { firebaseUser, profile, loading, needsProfile, refreshProfile, logout } = useAuth()
  const [retrying, setRetrying] = useState(false)

  // Deep-linkable view state lives in the component tree, not the URL, so the
  // app survives being served from a GitHub Pages subpath.
  useEffect(() => {
    document.documentElement.classList.toggle('role-teacher', profile?.role === 'teacher')
  }, [profile?.role])

  if (isConfigMissing) return <SetupNotice />

  if (loading) return <Splash />

  if (!firebaseUser) return <AuthScreen />

  if (!profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-5">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
            ⚠️
          </div>
          <h1 className="text-lg font-bold text-slate-800">Account setup incomplete</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {needsProfile
              ? 'Your login exists but your class profile was not finished. Tap below to finish setting it up.'
              : 'We could not load your profile.'}
          </p>
          <button
            onClick={async () => {
              setRetrying(true)
              try {
                await refreshProfile()
              } catch {
                /* surfaced by the gate on the next render */
              } finally {
                setRetrying(false)
              }
            }}
            disabled={retrying}
            className="mt-5 w-full rounded-2xl bg-brand-900 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {retrying ? 'Finishing…' : 'Finish setup'}
          </button>
          <button
            onClick={logout}
            className="mt-2 w-full rounded-2xl py-3 text-sm font-semibold text-slate-500 active:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </div>
    )
  }

  if (profile.role === 'teacher') return <TeacherDashboard />
  return <StudentDashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
