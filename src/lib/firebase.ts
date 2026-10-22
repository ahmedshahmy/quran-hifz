import { initializeApp, getApps, getApp, deleteApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  sendPasswordResetEmail,
  type Auth,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig } from './firebase-config'

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db = getFirestore(app)

export { fbSignOut, sendPasswordResetEmail }

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password)
}

export { updateProfile }

/**
 * Creates a student account WITHOUT disturbing the teacher's session.
 *
 * The Firebase client SDK has no admin API, and `createUserWithEmailAndPassword`
 * signs in the new user on whatever app instance it runs against. Running it on
 * a short-lived secondary app keeps the teacher signed in, then the secondary
 * app is thrown away.
 */
export async function createStudentAuthUser(
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  const secondary = initializeApp(firebaseConfig, `student-create-${Date.now()}`)
  try {
    const secondaryAuth = getAuth(secondary)
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password)
    await updateProfile(cred.user, { displayName })
    const uid = cred.user.uid
    await fbSignOut(secondaryAuth)
    return uid
  } finally {
    // Always tear the secondary app down so it cannot leak listeners.
    await deleteApp(secondary).catch(() => {})
  }
}
