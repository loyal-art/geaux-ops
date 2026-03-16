'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signUp, signInWithGoogle } from '@/app/auth/actions'

// ── Logo ──────────────────────────────────────────────────────────────────────

function GeauxLogo() {
  return (
    <div className="flex items-center gap-2.5 mb-8">
      <svg
        width="32" height="32" viewBox="0 0 32 32" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon points="16,3 30,27 2,27" fill="#C8A44E" opacity="0.9" />
        <polygon points="16,10 25,25 7,25" fill="#0F1117" />
        <polygon points="16,14 22,24 10,24" fill="#C8A44E" opacity="0.5" />
      </svg>
      <div>
        <p className="text-lg font-bold tracking-widest" style={{ color: '#C8A44E' }}>
          GEAUX OPS
        </p>
        <p className="text-xs tracking-wide" style={{ color: '#8B8F9E', marginTop: '-2px' }}>
          Command Center
        </p>
      </div>
    </div>
  )
}

// ── Google Icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Input field ───────────────────────────────────────────────────────────────

function Field({
  id, name, label, type = 'text', placeholder, autoComplete,
}: {
  id: string
  name: string
  label: string
  type?: string
  placeholder: string
  autoComplete?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
        style={{ color: '#8B8F9E' }}
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#E8E9ED',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = '#C8A44E'
          e.currentTarget.style.boxShadow   = '0 0 0 2px rgba(200,164,78,0.15)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.boxShadow   = 'none'
        }}
      />
    </div>
  )
}

// ── Submit Button (loading-aware) ─────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
    >
      {pending ? 'Creating account…' : 'Create Account'}
    </button>
  )
}

// ── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm mb-4 border"
      style={{
        backgroundColor: 'rgba(248,113,113,0.08)',
        borderColor: 'rgba(248,113,113,0.25)',
        color: '#F87171',
      }}
    >
      {message}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [state, formAction] = useActionState(signUp, null)

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0F1117' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          backgroundColor: '#1A1D27',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <GeauxLogo />

        <h1 className="text-2xl font-bold mb-1" style={{ color: '#E8E9ED' }}>
          Create your account
        </h1>
        <p className="text-sm mb-7" style={{ color: '#8B8F9E' }}>
          Set up your Geaux Ops command center
        </p>

        {state?.error && <ErrorBanner message={state.error} />}

        {/* Sign up form */}
        <form action={formAction} className="space-y-3">
          <Field
            id="display_name"
            name="display_name"
            label="Your Name"
            placeholder="Loyal"
            autoComplete="name"
          />
          <Field
            id="email"
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            id="password"
            name="password"
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />

          <div className="pt-1">
            <SubmitButton />
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <span className="text-xs" style={{ color: '#8B8F9E' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Google OAuth */}
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#E8E9ED',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        {/* Sign in link */}
        <p className="text-center text-sm mt-6" style={{ color: '#8B8F9E' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium hover:underline transition-opacity hover:opacity-80"
            style={{ color: '#C8A44E' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
