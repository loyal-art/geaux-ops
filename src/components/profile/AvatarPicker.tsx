'use client'

import { useState, useTransition } from 'react'
import { updateAvatarColor } from '@/app/profile/actions'
import { AVATAR_COLORS } from '@/lib/avatarColors'

interface Props {
  initial:      string  // First letter of user's display name
  currentColor: string  // Currently stored color key (e.g. 'gold')
}

export function AvatarPicker({ initial, currentColor }: Props) {
  const [selected, setSelected] = useState(currentColor || 'gold')
  const [isPending, startTransition] = useTransition()

  function handlePick(key: string) {
    if (key === selected) return
    setSelected(key)
    startTransition(async () => {
      await updateAvatarColor(key)
    })
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8B8F9E' }}>
        Avatar Color
      </p>
      <div className="flex flex-wrap gap-3">
        {Object.entries(AVATAR_COLORS).map(([key, { bg, color }]) => (
          <button
            key={key}
            type="button"
            onClick={() => handlePick(key)}
            disabled={isPending}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
            style={{
              backgroundColor: bg,
              color,
              border:    selected === key ? `2px solid ${color}` : '2px solid transparent',
              transform: selected === key ? 'scale(1.1)' : 'scale(1)',
              boxShadow: selected === key ? `0 0 10px ${color}44` : 'none',
            }}
            aria-label={`${key} avatar`}
            aria-pressed={selected === key}
          >
            {initial}
          </button>
        ))}
      </div>
    </div>
  )
}
