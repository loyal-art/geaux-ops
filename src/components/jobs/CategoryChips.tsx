'use client'

import { useState, useTransition } from 'react'
import { updateJobCategory } from '@/app/jobs/actions'
import type { JobCategory } from '@/lib/types'

const CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: 'business', label: 'Business' },
  { value: 'home',     label: 'Home' },
  { value: 'personal', label: 'Personal' },
  { value: 'misc',     label: 'Misc' },
]

export function CategoryChips({
  jobId,
  category,
}: {
  jobId:    string
  category: JobCategory
}) {
  const [current, setCurrent]     = useState<JobCategory>(category)
  const [isPending, startTransition] = useTransition()

  function handleSelect(cat: JobCategory) {
    if (cat === current || isPending) return
    setCurrent(cat)                          // optimistic
    startTransition(async () => {
      await updateJobCategory(jobId, cat)
    })
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map(({ value, label }) => {
        const active = current === value
        return (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            disabled={isPending}
            className="px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all active:scale-95"
            style={{
              backgroundColor: active ? '#C8A44E'                  : 'rgba(255,255,255,0.07)',
              color:           active ? '#0F1117'                  : '#8B8F9E',
              border:          active ? '1px solid transparent'    : '1px solid rgba(255,255,255,0.08)',
              opacity:         isPending ? 0.65 : 1,
              cursor:          isPending ? 'default' : 'pointer',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
