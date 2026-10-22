import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthScreen from './components/AuthScreen'
import SetupNotice from './components/SetupNotice'
import FinishSetup from './components/FinishSetup'
import Splash from './components/Splash'
import AuthStalled from './components/AuthStalled'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import { isConfigMissing } from './lib/firebase-config'

function Gate() {
  const { firebaseUser, profile, loading, stalled } = useAuth()

  // Deep-linkable view state lives in the component tree, not the URL, so the
  // app survives being served from a GitHub Pages subpath.
  useEffect(() => {
    document.documentElement.classList.toggle('role-teacher', profile?.role === 'teacher')
  }, [profile?.role])

  if (isConfigMissing) return <SetupNotice />

  if (loading) return stalled ? <AuthStalled /> : <Splash />

  if (!firebaseUser) return <AuthScreen />

  if (!profile) return <FinishSetup />

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
