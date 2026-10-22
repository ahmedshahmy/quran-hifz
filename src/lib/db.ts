import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { createStudentAuthUser } from './firebase'
import { db } from './firebase'
import type { ClassDoc, Entry, UserDoc } from './types'
import { mergeRanges } from './quran'

export const USERS = 'users'
export const CLASSES = 'classes'
export const ENTRIES = 'entries'

/** Unambiguous uppercase code, e.g. "K7QP2M". Avoids 0/O/1/I look-alikes. */
export function generateClassCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  const bytes = new Uint32Array(6)
  crypto.getRandomValues(bytes)
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return out
}

// Date helpers live in a Firebase-free module; re-exported for convenience.
export { isoOf, todayISO } from './date'

export function entryId(studentId: string, date: string): string {
  return `${studentId}_${date}`
}

/* ------------------------------- users -------------------------------- */

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, USERS, uid))
  return snap.exists() ? ({ uid, ...(snap.data() as Omit<UserDoc, 'uid'>) }) : null
}

export function watchUser(uid: string, cb: (u: UserDoc | null) => void): Unsubscribe {
  return onSnapshot(
    doc(db, USERS, uid),
    (snap) => cb(snap.exists() ? ({ uid, ...(snap.data() as Omit<UserDoc, 'uid'>) }) : null),
    () => cb(null),
  )
}

/** Registers a teacher and publishes their class code. */
export async function createTeacherProfile(
  uid: string,
  name: string,
  email: string,
): Promise<UserDoc> {
  let code = generateClassCode()
  // Retry a few times in the unlikely event of a collision.
  for (let i = 0; i < 5; i++) {
    const existing = await getDoc(doc(db, CLASSES, code))
    if (!existing.exists()) break
    code = generateClassCode()
  }

  const user: UserDoc = {
    uid,
    role: 'teacher',
    name: name.trim(),
    email: email.trim().toLowerCase(),
    classCode: code,
    createdAt: Date.now(),
  }
  // The profile must exist before the class document: the rules treat an
  // existing teacher profile as the proof that `classes/{code}` may be created.
  await setDoc(doc(db, USERS, uid), user)
  await setDoc(doc(db, CLASSES, code), {
    code,
    teacherId: uid,
    teacherName: name,
    createdAt: Date.now(),
  } satisfies ClassDoc)
  return user
}

export async function getClass(code: string): Promise<ClassDoc | null> {
  const snap = await getDoc(doc(db, CLASSES, code.trim().toUpperCase()))
  return snap.exists() ? (snap.data() as ClassDoc) : null
}

/** Student self-signup: create the profile and join a class by code. */
export async function createStudentProfile(
  uid: string,
  name: string,
  email: string,
  code: string,
): Promise<UserDoc> {
  const cls = await getClass(code)
  if (!cls) throw new Error('No class found with that code. Ask your teacher for the correct code.')
  const user: UserDoc = {
    uid,
    role: 'student',
    name: name.trim(),
    email: email.trim().toLowerCase(),
    classCode: cls.code,
    teacherId: cls.teacherId,
    teacherName: cls.teacherName,
    createdAt: Date.now(),
  }
  await setDoc(doc(db, USERS, uid), user)
  return user
}

/** Teacher enrolls a student: creates the auth account and the profile. */
export async function addStudent(
  teacher: UserDoc,
  name: string,
  email: string,
  password: string,
): Promise<{ uid: string }> {
  const uid = await createStudentAuthUser(email, password, name)
  const user: UserDoc = {
    uid,
    role: 'student',
    name: name.trim(),
    email: email.trim().toLowerCase(),
    classCode: teacher.classCode,
    teacherId: teacher.uid,
    teacherName: teacher.name,
    createdAt: Date.now(),
  }
  await setDoc(doc(db, USERS, uid), user)
  return { uid }
}

/**
 * Every student in the school.
 *
 * Students are shared: any teacher sees the whole roster, not just the ones
 * they personally added. The security rules grant this to teachers only.
 */
export function watchAllStudents(cb: (rows: UserDoc[]) => void): Unsubscribe {
  const q = query(collection(db, USERS), where('role', '==', 'student'))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ ...(d.data() as UserDoc), uid: d.id }))
      rows.sort((a, b) => a.name.localeCompare(b.name))
      cb(rows)
    },
    () => cb([]),
  )
}

/**
 * Removes a student from the teacher's class.
 *
 * Deletes their profile AND every hifz entry they have, so no orphaned records
 * are left behind (Firestore charges for orphans' reads and they would become
 * invisible dead weight). The Firebase Auth account cannot be deleted from the
 * client SDK, so the login survives — the student can rejoin using the class
 * code, and the teacher can re-add them with a different email.
 */
export async function removeStudent(studentId: string): Promise<{ entries: number }> {
  // Any teacher may remove a student now that the roster is shared. Their whole
  // history goes with them so no orphaned records are left behind.
  const q = query(collection(db, ENTRIES), where('studentId', '==', studentId))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(db, USERS, studentId))
  return { entries: snap.size }
}

/* ------------------------------ entries ------------------------------- */

function normalizeEntry(e: Partial<Entry>) {
  return {
    newHifz: mergeRanges(e.newHifz ?? []),
    recentHifz: mergeRanges(e.recentHifz ?? []),
    oldHifz: mergeRanges(e.oldHifz ?? []),
    note: e.note ?? '',
    grade: e.grade ?? '',
  }
}

export async function saveEntry(params: {
  studentId: string
  teacherId: string
  date: string
  newHifz: Entry['newHifz']
  recentHifz: Entry['recentHifz']
  oldHifz: Entry['oldHifz']
  note?: string
  grade?: string
  /** Name of the teacher saving, so students can see who marked their work. */
  teacherName?: string
}): Promise<void> {
  const id = entryId(params.studentId, params.date)
  const ref = doc(db, ENTRIES, id)
  const body = normalizeEntry(params)
  // A single merge write covers both "first log of the day" and "re-save", so
  // saving never depends on first reading the document back.
  await setDoc(
    ref,
    {
      id,
      studentId: params.studentId,
      teacherId: params.teacherId,
      teacherName: params.teacherName ?? '',
      date: params.date,
      ...body,
      updatedAt: Date.now(),
    },
    { merge: true },
  )
}

export async function getEntry(studentId: string, date: string): Promise<Entry | null> {
  const snap = await getDoc(doc(db, ENTRIES, entryId(studentId, date)))
  return snap.exists() ? ({ ...(snap.data() as Entry), id: snap.id }) : null
}

/** All entries for one student, newest-first. No orderBy avoids an index. */
export async function listEntries(studentId: string): Promise<Entry[]> {
  const q = query(collection(db, ENTRIES), where('studentId', '==', studentId))
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => ({ ...(d.data() as Entry), id: d.id }))
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return rows
}

export function watchEntries(studentId: string, cb: (rows: Entry[]) => void): Unsubscribe {
  const q = query(collection(db, ENTRIES), where('studentId', '==', studentId))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ ...(d.data() as Entry), id: d.id }))
      rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      cb(rows)
    },
    () => cb([]),
  )
}

/**
 * One day's entries across the whole school — used for the "logged today"
 * counter. Filtering by date keeps this to a handful of documents instead of
 * loading every entry ever recorded.
 */
export function watchEntriesForDate(
  date: string,
  cb: (rows: Entry[]) => void,
): Unsubscribe {
  const q = query(collection(db, ENTRIES), where('date', '==', date))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ ...(d.data() as Entry), id: d.id }))),
    () => cb([]),
  )
}

/** One-shot read of every entry, used by the class-progress tab. */
export async function fetchAllEntries(): Promise<Entry[]> {
  const snap = await getDocs(collection(db, ENTRIES))
  return snap.docs.map((d) => ({ ...(d.data() as Entry), id: d.id }))
}

export { serverTimestamp }
