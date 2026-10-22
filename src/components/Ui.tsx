import { useState } from 'react'

export function AppHeader({
  title,
  subtitle,
  onLogout,
  right,
  showBack,
  onBack,
}: {
  title: string
  subtitle?: string
  onLogout?: () => void
  right?: React.ReactNode
  showBack?: boolean
  onBack?: () => void
}) {
  return (
    <header className="safe-top sticky top-0 z-30 bg-brand-900 text-white">
      <div className="flex items-center gap-3 px-4 py-3">
        {showBack ? (
          <button
            onClick={onBack}
            aria-label="Back"
            className="-ml-1.5 rounded-xl p-2 active:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-bold">{title}</h1>
          {subtitle ? <p className="truncate text-[11px] text-brand-200">{subtitle}</p> : null}
        </div>
        {right}
        {onLogout ? (
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="rounded-xl p-2 text-brand-200 active:bg-white/10"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  )
}

export function ClassCodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Clipboard API is unavailable on insecure origins; the code stays visible.
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-bold tracking-[0.15em] text-gold-300 ring-1 ring-white/15 active:bg-white/20"
      title="Tap to copy your class code"
    >
      {copied ? 'COPIED' : code}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 012-2h10" />
      </svg>
    </button>
  )
}

export function Sheet({
  open,
  onClose,
  children,
  title,
  subtitle,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="animate-fade-up relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-900">{title}</h2>
            {subtitle ? <p className="truncate text-[11px] text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-slate-400 active:bg-slate-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-3xl">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-slate-500">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
