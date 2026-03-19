'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Icons ─────────────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function BoardIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function RecurringIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

// ── Nav Items ─────────────────────────────────────────────────────────────────

const NAV = [
  { href: '/dashboard', label: 'Home',    Icon: HomeIcon },
  { href: '/board',     label: 'Board',   Icon: BoardIcon },
  { href: '/recurring', label: 'Recurring', Icon: RecurringIcon },
  { href: '/profile',   label: 'Profile', Icon: ProfileIcon },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{
        backgroundColor: '#1A1D27',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center max-w-lg mx-auto px-1">

        {/* Home */}
        {NAV.slice(0, 2).map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 flex-1 py-3 transition-opacity"
              style={{ color: active ? '#C8A44E' : '#8B8F9E' }}
            >
              <Icon active={active} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          )
        })}

        {/* Center create button */}
        <Link
          href="/jobs/new"
          className="flex flex-col items-center flex-1 py-2"
          aria-label="New Job"
        >
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: '#C8A44E' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F1117" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span className="text-[10px] font-medium tracking-wide mt-0.5" style={{ color: '#C8A44E' }}>
            New
          </span>
        </Link>

        {/* Tasks + Profile */}
        {NAV.slice(2).map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 flex-1 py-3 transition-opacity"
              style={{ color: active ? '#C8A44E' : '#8B8F9E' }}
            >
              <Icon active={active} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          )
        })}

      </div>
    </nav>
  )
}
