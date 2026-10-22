/**
 * Small-print attribution shown at the bottom of the user-facing screens.
 * Centred and width-matched to the page column, and it respects the iOS
 * home-indicator inset so it never sits underneath the system bar.
 */
export default function Footer({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const base = tone === 'dark' ? 'text-white/45' : 'text-slate-400'
  const link =
    tone === 'dark'
      ? 'text-white/60 decoration-white/25 hover:text-white/80'
      : 'text-slate-500 decoration-slate-300 hover:text-slate-600'

  return (
    <footer
      className="mx-auto w-full max-w-lg px-4 pt-8"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/* The max width keeps the credit clear of the floating "+" button on the
          teacher dashboard, which overlays the bottom-right corner. */}
      <p className={`mx-auto max-w-[13.5rem] text-center text-[10px] leading-relaxed ${base}`}>
        By Ahamed Shahmy -{' '}
        <a
          href="mailto:maa.shahmy@gmail.com"
          className={`underline decoration-1 underline-offset-2 ${link}`}
        >
          maa.shahmy@gmail.com
        </a>
      </p>
    </footer>
  )
}
