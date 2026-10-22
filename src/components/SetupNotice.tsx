export default function SetupNotice() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-950 p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
          🔧
        </div>
        <h1 className="text-lg font-bold text-slate-900">Firebase is not configured</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This app stores classes in Firebase, so it needs a project config before it can sign
          anyone in.
        </p>
        <ol className="mt-4 space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="font-bold text-brand-700">1.</span> Create a project at{' '}
            <a className="font-semibold text-brand-700 underline" href="https://console.firebase.google.com">
              console.firebase.google.com
            </a>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-brand-700">2.</span> Add a Web app and copy its config.
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-brand-700">3.</span> Enable{' '}
            <b>Authentication → Email/Password</b> and create a{' '}
            <b>Firestore</b> database.
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-brand-700">4.</span> Paste the config into{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">src/lib/firebase-config.ts</code>{' '}
            (or set the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">VITE_FIREBASE_*</code>{' '}
            secrets) and redeploy.
          </li>
        </ol>
        <p className="mt-4 rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-900">
          Then publish the rules in <code className="font-semibold">firestore.rules</code> so
          teachers can only see their own class and students only see themselves.
        </p>
      </div>
    </div>
  )
}
