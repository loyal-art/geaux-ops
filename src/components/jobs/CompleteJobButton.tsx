'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { completeJob } from '@/app/jobs/actions'

interface Props {
  jobId:          string
  jobTitle:       string
  totalSteps:     number
  completedSteps: number
}

// ── Confetti burst (gold + green, two waves) ──────────────────────────────────

function fireConfetti() {
  // First burst — center
  confetti({
    particleCount: 130,
    spread:        80,
    origin:        { y: 0.65 },
    colors:        ['#C8A44E', '#4ADE80', '#EAB308', '#FFFFFF', '#60A5FA'],
    zIndex:        9999,
  })
  // Second burst — flanks, 220 ms later
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread:        110,
      origin:        { x: 0.25, y: 0.55 },
      colors:        ['#C8A44E', '#EAB308'],
      zIndex:        9999,
    })
    confetti({
      particleCount: 60,
      spread:        110,
      origin:        { x: 0.75, y: 0.55 },
      colors:        ['#4ADE80', '#FFFFFF'],
      zIndex:        9999,
    })
  }, 220)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CompleteJobButton({ jobId, jobTitle, totalSteps, completedSteps }: Props) {
  const [showModal, setShowModal]      = useState(false)
  const [isPending, startTransition]   = useTransition()
  const router                         = useRouter()

  // Once the modal is visible, fire confetti and schedule redirect
  useEffect(() => {
    if (!showModal) return

    fireConfetti()

    const redirectTimer = setTimeout(() => {
      router.push('/dashboard')
    }, 3500)

    return () => clearTimeout(redirectTimer)
  }, [showModal, router])

  function handleClick() {
    startTransition(async () => {
      const result = await completeJob(jobId)
      if (!result.error) {
        setShowModal(true)
      }
    })
  }

  return (
    <>
      {/* ── Button ── */}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
        style={{
          backgroundColor: 'rgba(74,222,128,0.1)',
          color:           '#4ADE80',
          border:          '1px solid rgba(74,222,128,0.3)',
        }}
      >
        {isPending ? 'Saving…' : 'Mark Complete'}
      </button>

      {/* ── Well done modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-5"
          style={{
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter:  'blur(6px)',
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 text-center"
            style={{
              backgroundColor: '#1A1D27',
              border:          '1px solid rgba(74,222,128,0.35)',
              boxShadow:       '0 0 50px rgba(74,222,128,0.18), 0 24px 64px rgba(0,0,0,0.55)',
            }}
          >
            {/* Trophy */}
            <div className="text-5xl mb-5">🎉</div>

            {/* Headline */}
            <h2
              className="text-2xl font-extrabold mb-2"
              style={{ color: '#4ADE80' }}
            >
              Well done!
            </h2>

            {/* Job title */}
            <p
              className="text-sm font-semibold leading-snug mb-4"
              style={{ color: '#E8E9ED' }}
            >
              {jobTitle}
            </p>

            {/* Step count badge */}
            {totalSteps > 0 && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold"
                style={{
                  backgroundColor: 'rgba(74,222,128,0.12)',
                  color:           '#4ADE80',
                }}
              >
                ✓&nbsp;{completedSteps} of {totalSteps} steps completed
              </div>
            )}

            {/* Redirect hint */}
            <p
              className="text-[11px]"
              style={{ color: '#8B8F9E' }}
            >
              Redirecting to dashboard…
            </p>
          </div>
        </div>
      )}
    </>
  )
}
