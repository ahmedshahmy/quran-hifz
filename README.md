# Quran Hifz Class

A mobile-first web app for a Qur'an memorization (hifz) class. Teachers log in,
add students, and record each class day's **new hifz**, **recent hifz** and
**old hifz** separately. Students log in and watch their progress, including a
pie chart of how much of the whole Qur'an they have memorized.

Live app: `https://<your-username>.github.io/<repo-name>/`

---

## Features

**For teachers**

- Email/password login; a class is created automatically with a short join code.
- Add students yourself (the app creates their login on the spot, without
  logging you out), or share the class code so students can sign up.
- Per-day log with three separate sections that mirror the classroom:
  | Section | Arabic | Meaning |
  |---|---|---|
  | New Hifz | سبق (Sabaq) | newly memorized that day |
  | Recent Hifz | سبقی (Sabqi) | recently memorized, revised that day |
  | Old Hifz | منزل (Manzil) | long-term memorized, revised that day |
- Ranges are entered as *surah + first ayah + last ayah*, so "Al-Mulk 1–10" is
  three taps. Any surah can be added whole with one button.
- Optional teacher note per day; pick any past date to back-fill a missed day.
- Class dashboard: who is logged today and how much of the Qur'an each student
  has memorized.

**For students**

- See today's sabaq the moment the teacher records it.
- Pie chart of the whole Qur'an (memorized vs remaining), plus a 30-wedge pie
  showing how far each juz has come.
- Surah-by-surah progress bars and a full day-by-day history with teacher notes.
- Consecutive-day streak.

**Under the hood**

- Progress is counted in **ayahs**: every recorded range is unioned into a set,
  so overlapping revisions never inflate the total. `% = memorized / 6236`.
- Qur'an metadata (114 surahs, ayah counts, juz boundaries) is generated from the
  [quran.com API v4](https://api.quran.com) and verified at generation time:
  114 surahs, 6236 ayahs, juz ranges summing to 6236.
- No chart library — the pies are hand-drawn SVG, so the bundle stays small.
- Firebase Auth + Firestore, locked down with role-based security rules.

---

## Setup

The app needs a Firebase project for logins and shared data (GitHub Pages only
serves static files).

### 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and
   add a project.
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** (production mode is fine).
4. **Project settings → Your apps → Web (`</>`)** and copy the config object.

### 2. Paste the config

Edit `src/lib/firebase-config.ts` and fill in the `inline` object:

```ts
const inline: FirebaseConfig = {
  apiKey: 'AIza…',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef',
}
```

This object is **not a secret** — it only identifies the project, and the
Firestore rules below are what actually protect the data. (You can also supply
these as `VITE_FIREBASE_*` repository secrets instead; env vars win.)

### 3. Publish the security rules

Copy the contents of `firestore.rules` into
**Firestore Database → Rules → Publish**.

Without this step Firestore denies every request and the app cannot store
anything.

### 4. Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` runs the tests,
type-checks, builds, and publishes to Pages.

Then enable it once: **Settings → Pages → Source → GitHub Actions**.

---

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # hifz progress maths (18 checks)
npm run build    # production build into dist/
```

`npm run gen:quran` regenerates `src/lib/quranData.ts` from the checked-in API
snapshots (`chapters.json`, `scripts/juzs.json`).

---

## Data model

```
users/{uid}          { role: 'teacher'|'student', name, email, classCode,
                       teacherId?, teacherName?, createdAt }
classes/{code}       { code, teacherId, teacherName, createdAt }
entries/{sid_date}   { studentId, teacherId, date: 'YYYY-MM-DD',
                       newHifz[], recentHifz[], oldHifz[],
                       note, createdAt, updatedAt }
```

A hifz range is `{ surah: 2, from: 255, to: 257 }` — surah number plus inclusive
ayah bounds.

**Why `entries/{studentId}_{date}`?** The document id is deterministic, so the
teacher's form loads an existing day with a single `getDoc` — no index, no
duplicate days, and re-saving updates rather than appends.

## Restricting who can be a teacher

The app cannot know whether someone really is a teacher — the role is chosen on
the sign-up screen. By default **any** email can register a class (they still
only ever see their own empty class; your students' data is never exposed).

To lock registration down to known teachers, create one Firestore document:

**Console → Firestore Database → Start collection → collection id `config` →
document id `teachers` → add a field:**

| Field | Type | Value |
|---|---|---|
| `emails` | array (strings) | `owner@example.com`, `ustadh@example.com` |

Write the emails in **lowercase** — that is how Firebase normalises them.

How the rule behaves (`firestore.rules` → `teacherIsAllowed`):

- The document is **absent** → registration stays open (nothing breaks).
- The document **exists** → only listed emails can create a teacher profile.
- Existing teacher accounts are unaffected; this gates sign-up only.
- Students are unaffected and keep joining with the class code.
- The document is invisible to the app: it is read only inside the rules.

An unlisted address that tries to sign up sees *"This email is not registered as
a teacher"* and is signed back out rather than being left half-created.

To add a teacher later, edit the array in the console. To re-open registration,
delete the document.

## Security rules summary

| Actor | Can do |
|---|---|
| Teacher | Read/write entries and profiles of **their own** students only |
| Student | Read **their own** profile and entries only; cannot write hifz |
| Anyone signed in | Look up a class code to join (teacher name + id only) |

Students cannot promote themselves: profile updates keep `role`, `classCode`
and `teacherId` unchanged.

---

## Project layout

```
src/
  lib/
    quranData.ts     generated Qur'an metadata (114 surahs, juz spans)
    quran.ts         range maths: expand, union, merge, juz/surah breakdown
    progress.ts      entry aggregation + percentages
    firebase.ts      Firebase init; secondary-app trick for creating students
    firebase-config.ts
    db.ts            Firestore reads/writes and live subscriptions
    types.ts         shared types and the three bucket definitions
  components/        Donut chart, progress panel, range editor, auth screen, UI kit
  pages/             TeacherDashboard, StudentDashboard, EntryEditor
  context/           AuthContext
firestore.rules
scripts/             Qur'an data generator, maths tests
```

## Licence

MIT
