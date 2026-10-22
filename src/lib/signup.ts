import { auth } from './firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

/**
 * Creates a Firebase Auth account and signs the user in on the primary app.
 *
 * Used for self-signup (teacher registering, or a student joining a class).
 * Teacher-creates-student is handled separately in firebase.ts so that the
 * teacher's own session is never disturbed.
 */
export async function signupTeacher(name: string, email: string, password: string): Promise<string> {
  return createAccount(name, email, password)
}

export async function signupStudent(name: string, email: string, password: string): Promise<string> {
  return createAccount(name, email, password)
}

async function createAccount(name: string, email: string, password: string): Promise<string> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() })
  return cred.user.uid
}
