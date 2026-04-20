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

function ClientsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
  { href: '/dashboard', label: 'Home',      Icon: HomeIcon },
  { href: '/people',    label: 'People',    Icon: ClientsIcon },
  { href: '/recurring', label: 'Recurring', Icon: RecurringIcon },
  { href: '/profile',   label: 'Profile',   Icon: ProfileIcon },
]

// ── Nav item (bubble background on active) ───────────────────────────────────

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string
  label: string
  Icon: ({ active }: { active: boolean }) => React.ReactElement
  active: boolean
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center flex-1 py-2 transition-opacity"
      style={{ color: active ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width:           '40px',
          height:          '40px',
          borderRadius:    'var(--radius-full)',
          backgroundColor: active ? 'rgba(200,164,78,0.14)' : 'transparent',
          transition:      'background-color 180ms ease',
        }}
      >
        <Icon active={active} />
      </span>
      <span
        className="mt-0.5"
        style={{
          fontSize:      '10px',
          fontWeight:    active ? 'var(--weight-bold)' : 'var(--weight-semibold)',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        {label}
      </span>
    </Link>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BottomNav({ canCreateJobs = true }: { canCreateJobs?: boolean }) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop:       '1px solid rgba(255,255,255,0.06)',
        backdropFilter:  'blur(12px)',
      }}
    >
      <div className="flex items-center max-w-lg mx-auto px-1">

        {/* Home + People */}
        {NAV.slice(0, 2).map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return <NavItem key={href} href={href} label={label} Icon={Icon} active={active} />
        })}

        {/* Center create bubble — hidden for workers / viewers */}
        {canCreateJobs ? (
          <Link
            href="/jobs/new"
            className="flex flex-col items-center flex-1 py-2"
            aria-label="New Job"
          >
            <span
              className="relative flex items-center justify-center transition-transform active:scale-95"
              style={{
                width:        '52px',
                height:       '52px',
                borderRadius: 'var(--radius-full)',
                background:   'var(--gradient-gold)',
                boxShadow:    '0 0 22px rgba(200,164,78,0.55), var(--shadow-lg)',
              }}
            >
              {/* Bubble shine */}
              <span
                aria-hidden
                className="absolute pointer-events-none"
                style={{
                  top:          '20%',
                  left:         '24%',
                  width:        '16px',
                  height:       '9px',
                  borderRadius: '9999px',
                  background:   'rgba(255,255,255,0.5)',
                  filter:       'blur(1.5px)',
                }}
              />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F1117" strokeWidth="2.8" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span
              className="mt-0.5"
              style={{
                fontSize:      '10px',
                fontWeight:    'var(--weight-bold)',
                letterSpacing: 'var(--tracking-wide)',
                color:         'var(--accent-gold)',
              }}
            >
              New
            </span>
          </Link>
        ) : (
          <div className="flex-1" aria-hidden />
        )}

        {/* Recurring + Profile */}
        {NAV.slice(2).map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return <NavItem key={href} href={href} label={label} Icon={Icon} active={active} />
        })}

      </div>
    </nav>
  )
}
