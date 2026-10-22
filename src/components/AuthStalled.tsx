/**
 * Shown when Firebase Auth never resolves its initial state.
 *
 * The usual cause is that the project's Authentication service has not been
 * provisioned, in which case `onAuthStateChanged` never fires and the app would
 * otherwise sit on the splash screen forever with no explanation.
 */
export default function AuthStalled() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-950 p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-2xl">
          ⚠️
        </div>
        <h1 className="text-lg font-bold text-slate-900">Can’t reach the login service</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The app loaded, but Firebase Authentication did not respond. This usually means the
          project’s Authentication service has not been set up yet.
        </p>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3.5">
          <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
            Check these in the Firebase console
          </p>
          <ol className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-slate-600">
            <li>
              1. <b>Authentication → Get started</b> has been clicked
            </li>
            <li>
              2. <b>Email/Password</b> provider is <b>Enabled</b>
            </li>
            <li>
              3. <b>Firestore Database</b> has been created
            </li>
            <li>
              4. Your site’s domain is listed under <b>Authentication → Settings → Authorized
              domains</b>
            </li>
          </ol>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-5 w-full rounded-2xl bg-brand-900 py-3.5 text-sm font-bold text-white"
        >
          Try again
        </button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
          The full checklist is in the project README.
        </p>
      </div>
    </div>
  )
}
