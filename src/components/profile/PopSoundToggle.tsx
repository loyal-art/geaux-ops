'use client'

import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { playPop } from '@/lib/popSound'

export function PopSoundToggle() {
  // Default on — matches the spec ("default on")
  const [enabled, setEnabled] = useLocalStorage<boolean>('geaux-pop-sounds', true)

  function toggle() {
    const next = !enabled
    setEnabled(next)
    // Play a sample when switching ON so the user hears what they get
    if (next) {
      // Preference read happens on play; defer so localStorage is updated first
      setTimeout(playPop, 0)
    }
  }

  return (
    <button
      onClick={toggle}
      className="card-hover w-full flex items-center gap-4 px-5 py-4 rounded-2xl active:opacity-70"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'rgba(200,164,78,0.12)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold" style={{ color: '#E8E9ED' }}>
          Play pop sounds
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8B8F9E' }}>
          Short pop when you complete a step
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
