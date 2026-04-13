'use client'

import { useLocalStorage } from '@/lib/hooks/useLocalStorage'

export function MyDayToggle() {
  const [enabled, setEnabled] = useLocalStorage('geaux-myday-homepage', false)

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className="card-hover w-full flex items-center gap-4 px-5 py-4 rounded-2xl active:opacity-70"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'rgba(200,164,78,0.12)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold" style={{ color: '#E8E9ED' }}>
          Make My Day your homepage
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8B8F9E' }}>
          Opens dashboard with My Day expanded
        </p>
      </div>

      {/* Toggle switch */}
      <div
        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
        style={{ backgroundColor: enabled ? '#C8A44E' : 'rgba(255,255,255,0.1)' }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
          style={{
            backgroundColor: enabled ? '#0F1117' : '#8B8F9E',
            transform: enabled ? 'translateX(22px)' : 'translateX(2px)',
          }}
        />
      </div>
    </button>
  )
}
