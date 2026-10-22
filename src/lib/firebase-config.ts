/**
 * Firebase web config.
 *
 * These values are NOT secrets — a Firebase web config is public by design.
 * Access is controlled by the Firestore security rules in `firestore.rules`
 * and by Firebase Auth. Anyone can read this object; only signed-in users
 * with the right role can read or write class data.
 *
 * Values can also be supplied at build time via VITE_FIREBASE_* env vars
 * (see .github/workflows/deploy.yml), which take precedence.
 */

const env = import.meta.env as Record<string, string | undefined>

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

const fromEnv: FirebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: env.VITE_FIREBASE_APP_ID ?? '',
}

/** Values pasted here are used when the env vars above are absent. */
const inline: FirebaseConfig = {
  apiKey: 'AIzaSyC8TeHx1wGOUzdjNJjP1JYgtCh41PIE1vA',
  authDomain: 'hifz-85506.firebaseapp.com',
  projectId: 'hifz-85506',
  storageBucket: 'hifz-85506.firebasestorage.app',
  messagingSenderId: '880364344478',
  appId: '1:880364344478:web:fb77c0d337936d1653d78f',
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: fromEnv.apiKey || inline.apiKey,
  authDomain: fromEnv.authDomain || inline.authDomain,
  projectId: fromEnv.projectId || inline.projectId,
  storageBucket: fromEnv.storageBucket || inline.storageBucket,
  messagingSenderId: fromEnv.messagingSenderId || inline.messagingSenderId,
  appId: fromEnv.appId || inline.appId,
}

/** True when the config still holds placeholders, so setup can be shown. */
export const isConfigMissing = /PASTE_|^$/.test(firebaseConfig.apiKey) || /PASTE_|^$/.test(firebaseConfig.projectId)
