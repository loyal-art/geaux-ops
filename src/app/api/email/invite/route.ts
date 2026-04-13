import { NextResponse } from 'next/server'
import { sendInviteEmail } from '@/lib/email/sendInviteEmail'

const SIGNUP_URL = 'https://geaux-ops.vercel.app/signup'

/**
 * POST /api/email/invite
 *
 * Body: { to: string, inviterName: string, role: string, signupUrl?: string }
 *
 * Sends a branded invite email via Resend.
 * Returns 200 on success, 400 on bad input, 500 on send failure.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { to, inviterName, role, signupUrl } = body as Record<string, string>

  if (!to || !inviterName || !role) {
    return NextResponse.json(
      { error: 'Missing required fields: to, inviterName, role' },
      { status: 400 },
    )
  }

  const result = await sendInviteEmail({
    to,
    inviterName,
    role,
    signupUrl: signupUrl ?? SIGNUP_URL,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
