import type { HifzRange } from './quran'

export type Role = 'teacher' | 'student'

/** Firestore `users/{uid}` */
export interface UserDoc {
  uid: string
  role: Role
  name: string
  email: string
  /** Class code shared by a teacher and their students. */
  classCode: string
  /** For students: the teacher who owns them. */
  teacherId?: string
  teacherName?: string
  createdAt?: number
}

/** Firestore `classes/{code}` — lets a student join by code. */
export interface ClassDoc {
  code: string
  teacherId: string
  teacherName: string
  createdAt?: number
}

/** The three daily hifz buckets recorded in class. */
export interface HifzBuckets {
  /** Sabaq — newly memorized today. */
  newHifz: HifzRange[]
  /** Sabqi — recently memorized, revised today. */
  recentHifz: HifzRange[]
  /** Manzil — long-term memorized, revised today. */
  oldHifz: HifzRange[]
}

/** Firestore `entries/{id}` — one daily log per student per day. */
export interface Entry extends HifzBuckets {
  id: string
  studentId: string
  teacherId: string
  /** ISO date, YYYY-MM-DD */
  date: string
  note?: string
  grade?: string
  /** Name of the teacher who last saved this day. */
  teacherName?: string
  createdAt?: number
  updatedAt?: number
}

export const BUCKET_META = [
  {
    key: 'newHifz' as const,
    title: 'New Hifz',
    arabic: 'سبق',
    subtitle: 'Sabaq — memorized today',
    accent: 'emerald',
  },
  {
    key: 'recentHifz' as const,
    title: 'Recent Hifz',
    arabic: 'سبقی',
    subtitle: 'Sabqi — revised from this week',
    accent: 'amber',
  },
  {
    key: 'oldHifz' as const,
    title: 'Old Hifz',
    arabic: 'منزل',
    subtitle: 'Manzil — long-term revision',
    accent: 'sky',
  },
] as const

export type BucketKey = (typeof BUCKET_META)[number]['key']
