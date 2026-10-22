export default function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-brand-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f5d78e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5.5A1.5 1.5 0 015.5 4H10a2 2 0 012 2v13a2 2 0 00-2-2H5.5A1.5 1.5 0 014 15.5v-10z" />
          <path d="M20 5.5A1.5 1.5 0 0018.5 4H14a2 2 0 00-2 2v13a2 2 0 012-2h4.5a1.5 1.5 0 001.5-1.5v-10z" />
        </svg>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-white">Quran Hifz Class</div>
        <div className="mt-1 text-xs text-brand-200">Loading your class…</div>
      </div>
      <div className="spinner mt-1 h-6 w-6 rounded-full border-2 border-white/20 border-t-gold-400" />
    </div>
  )
}
