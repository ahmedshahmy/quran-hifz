/**
 * Date helpers shared by the UI and the progress maths.
 * Deliberately dependency-free (no Firebase) so the maths tests can run on plain
 * Node without booting the Firebase SDK.
 */

/** Formats a Date as YYYY-MM-DD using LOCAL time, never UTC. */
export function isoOf(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today in the user's own timezone. */
export function todayISO(): string {
  return isoOf(new Date())
}
