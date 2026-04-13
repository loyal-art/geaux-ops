import { Resend } from 'resend'

interface InviteEmailParams {
  to:          string
  inviterName: string
  role:        string
  signupUrl:   string
}

function humanizeRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())  // team_member → Team Member
}

function buildHtml(inviterName: string, roleLabel: string, email: string, signupUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#0F1117;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">

    <!-- Wordmark -->
    <div style="margin-bottom:32px;">
      <span style="font-size:22px;font-weight:800;color:#C8A44E;letter-spacing:-0.5px;">Geaux Ops</span>
    </div>

    <!-- Card -->
    <div style="background-color:#1A1D27;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;">

      <h1 style="color:#E8E9ED;font-size:22px;font-weight:700;margin:0 0 12px;line-height:1.3;">
        You&rsquo;ve been invited
      </h1>

      <p style="color:#8B8F9E;font-size:15px;line-height:1.65;margin:0 0 28px;">
        <strong style="color:#E8E9ED;">${inviterName}</strong> has invited you to join
        <strong style="color:#C8A44E;">Geaux Ops</strong> as a
        <strong style="color:#E8E9ED;">${roleLabel}</strong>.
      </p>

      <!-- CTA -->
      <a
        href="${signupUrl}"
        style="display:inline-block;background-color:#C8A44E;color:#0F1117;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;letter-spacing:0.2px;"
      >
        Accept &amp; Sign Up →
      </a>

      <!-- Divider -->
      <div style="margin:28px 0;height:1px;background-color:rgba(255,255,255,0.07);"></div>

      <p style="color:#8B8F9E;font-size:12px;margin:0;line-height:1.6;">
        Sign up using this email address:
        <strong style="color:#E8E9ED;">${email}</strong>
      </p>
    </div>

    <!-- Footer -->
    <p style="color:#8B8F9E;font-size:11px;text-align:center;margin-top:24px;line-height:1.6;">
      Geaux Ops &middot; You received this because ${inviterName} sent you a workspace invitation.<br />
      If you weren&rsquo;t expecting this, you can safely ignore it.
    </p>

  </div>
</body>
</html>`
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function sendInviteEmail({
  to, inviterName, role, signupUrl,
}: InviteEmailParams): Promise<{ error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[sendInviteEmail] RESEND_API_KEY is not set — invite email skipped')
    return { error: 'RESEND_API_KEY not configured' }
  }

  const resend    = new Resend(apiKey)
  const from      = process.env.RESEND_FROM_EMAIL ?? 'Geaux Ops <onboarding@resend.dev>'
  const roleLabel = humanizeRole(role)

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${inviterName} invited you to Geaux Ops`,
    html:    buildHtml(inviterName, roleLabel, to, signupUrl),
  })

  if (error) {
    const msg = (error as { message?: string }).message ?? String(error)
    console.error('[sendInviteEmail] Resend error:', msg)
    return { error: msg }
  }

  return { error: null }
}
