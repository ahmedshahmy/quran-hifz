import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, fbSignOut, signIn } from '../lib/firebase'
import { createStudentProfile, createTeacherProfile, getUser, watchUser } from '../lib/db'
import type { UserDoc } from '../lib/types'

export interface AuthState {
  /** Firebase user, present the moment auth resolves. */
  firebaseUser: User | null
  /** Firestore profile carrying the role; null while loading. */
  profile: UserDoc | null
  loading: boolean
  /** True when auth never resolved (e.g. Authentication is not provisioned). */
  stalled: boolean
  /** Set when signed in but no profile document exists yet. */
  needsProfile: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  signupTeacher: (name: string, email: string, password: string) => Promise<void>
  signupStudent: (name: string, email: string, password: string, code: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  setError: (e: string | null) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfile, setNeedsProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Keeps the splash up while a signup finishes writing its profile, so the
  // "setup incomplete" gate never flashes mid-registration.
  const [registering, setRegistering] = useState(false)
  // Guards against an endless splash: if Firebase Auth never reports its initial
  // state (typical when the Authentication service is not provisioned), show a
  // diagnostic screen instead of spinning forever.
  const [stalled, setStalled] = useState(false)

  useEffect(() => {
    if (!loading) {
      setStalled(false)
      return
    }
    const t = setTimeout(() => setStalled(true), 8000)
    return () => clearTimeout(t)
  }, [loading])
  // Pending signup details, used if the profile write must be retried.
  const [pendingSignup, setPendingSignup] = useState<
    { kind: 'teacher'; name: string; email: string } | { kind: 'student'; name: string; email: string; code: string } | null
  >(null)

  // Track Firebase auth, then load the Firestore profile.
  useEffect(() => {
    let unsubProfile: (() => void) | undefined
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u)
      unsubProfile?.()
      unsubProfile = undefined

      if (!u) {
        setProfile(null)
        setNeedsProfile(false)
        setLoading(false)
        return
      }

      const doc = await getUser(u.uid).catch(() => null)
      setProfile(doc)
      setNeedsProfile(!doc)
      setLoading(false)

      // Keep the profile live so a teacher renaming a student propagates.
      unsubProfile = watchUser(u.uid, (live) => {
        setProfile(live)
        setNeedsProfile(!live)
      })
    })
    return () => {
      unsubAuth()
      unsubProfile?.()
    }
  }, [])

  async function login(email: string, password: string) {
    setError(null)
    try {
      await signIn(email, password)
    } catch (e) {
      setError(authErrorMessage(e))
      throw e
    }
  }

  async function signupTeacher(name: string, email: string, password: string) {
    setError(null)
    setRegistering(true)
    const { signupTeacher: doSignup } = await import('../lib/signup')
    try {
      const uid = await doSignup(name, email, password)
      setPendingSignup({ kind: 'teacher', name, email })
      const created = await createTeacherProfile(uid, name, email)
      setProfile(created)
      setNeedsProfile(false)
      setPendingSignup(null)
    } catch (e) {
      setError(authErrorMessage(e))
      throw e
    } finally {
      setRegistering(false)
    }
  }

  async function signupStudent(
    name: string,
    email: string,
    password: string,
    code: string,
  ) {
    setError(null)
    setRegistering(true)
    const { signupStudent: doSignup } = await import('../lib/signup')
    try {
      const uid = await doSignup(name, email, password)
      setPendingSignup({ kind: 'student', name, email, code })
      const created = await createStudentProfile(uid, name, email, code)
      setProfile(created)
      setNeedsProfile(false)
      setPendingSignup(null)
    } catch (e) {
      setError(authErrorMessage(e))
      throw e
    } finally {
      setRegistering(false)
    }
  }

  async function logout() {
    await fbSignOut(auth)
    setProfile(null)
    setNeedsProfile(false)
  }

  async function refreshProfile() {
    if (!firebaseUser) return
    // A signed-in user with no profile can finish setup here (e.g. the
    // Firestore write failed right after account creation).
    if (pendingSignup) {
      const created =
        pendingSignup.kind === 'teacher'
          ? await createTeacherProfile(firebaseUser.uid, pendingSignup.name, pendingSignup.email)
          : await createStudentProfile(
              firebaseUser.uid,
              pendingSignup.name,
              pendingSignup.email,
              pendingSignup.code,
            )
      setProfile(created)
      setNeedsProfile(false)
      setPendingSignup(null)
      return
    }
    const doc = await getUser(firebaseUser.uid)
    setProfile(doc)
    setNeedsProfile(!doc)
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading: loading || registering,
        stalled,
        needsProfile,
        error,
        login,
        signupTeacher,
        signupStudent,
        logout,
        refreshProfile,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** Maps Firebase auth error codes to plain-language messages. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address does not look valid.'
    case 'auth/missing-password':
      return 'Please enter a password.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a minute and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled. Enable it in the Firebase console.'
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'You do not have permission for that action.'
    default:
      return (e as Error)?.message || 'Something went wrong. Please try again.'
  }
}
