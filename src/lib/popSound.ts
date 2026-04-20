'use client'

// Geaux Ops Pops — short "pop" SFX via Web Audio API.
//
// Respects the user's `geaux-pop-sounds` localStorage preference (default on).
// Safe to call on every step completion; silently no-ops in SSR, private
// browsing, or when the browser hasn't yet granted audio (before first
// user gesture).

const PREF_KEY = 'geaux-pop-sounds'

export function isPopSoundEnabled(): boolean {
  try {
    if (typeof window === 'undefined') return false
    const v = localStorage.getItem(PREF_KEY)
    return v === null ? true : v === 'true'
  } catch {
    return true
  }
}

type AudioCtxCtor = typeof AudioContext
let sharedCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null
    if (sharedCtx) return sharedCtx
    const Ctor: AudioCtxCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext
    if (!Ctor) return null
    sharedCtx = new Ctor()
    return sharedCtx
  } catch {
    return null
  }
}

export function playPop(): void {
  if (!isPopSoundEnabled()) return
  const ctx = getCtx()
  if (!ctx) return

  try {
    // Resume if suspended (some browsers suspend until a user gesture)
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})

    const now = ctx.currentTime

    // Oscillator — sine sweep from 820 Hz → 180 Hz for the classic pop shape
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(820, now)
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.13)

    // Envelope — sharp attack, short exponential decay
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.22)
  } catch {
    // Audio playback blocked or unsupported — silent no-op
  }
}
