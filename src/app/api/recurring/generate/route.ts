import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { calcNextGenerateAt } from '@/lib/recurring'
import type { RecurringFrequency, TemplateStep } from '@/lib/types'

/**
 * GET /api/recurring/generate
 *
 * Called by Vercel Cron (see vercel.json) at 06:00 UTC every day.
 * Also callable manually by the owner via the UI (with the correct secret).
 *
 * For each active recurring_schedule whose next_generate_at is in the past:
 *  1. Fetch the linked job_template
 *  2. Create a new job (status: unassigned, or assigned if schedule.assigned_to is set)
 *  3. Copy all template default_steps into job_steps
 *  4. Update last_generated_at = now(), next_generate_at = next window
 */
export async function GET(request: Request) {
  // ── Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET> ───────────
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // ── Fetch all active schedules that are due ────────────────────────────────
  const { data: schedules, error: fetchError } = await supabase
    .from('recurring_schedules')
    .select('*')
    .eq('active', true)
    .lte('next_generate_at', now.toISOString())

  if (fetchError) {
    console.error('[recurring/generate] fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ generated: 0, message: 'No schedules due' })
  }

  let generated = 0
  const errors: string[] = []

  for (const schedule of schedules) {
    try {
      // ── Load template ─────────────────────────────────────────────────────
      const { data: template, error: tmplError } = await supabase
        .from('job_templates')
        .select('*')
        .eq('id', schedule.template_id)
        .single()

      if (tmplError || !template) {
        errors.push(`Schedule ${schedule.id}: template not found`)
        continue
      }

      // ── Create job ────────────────────────────────────────────────────────
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          template_id:  schedule.template_id,
          title:        template.name,
          status:       schedule.assigned_to ? 'in_progress' : 'unassigned',
          priority:     'normal',
          assigned_to:  schedule.assigned_to ?? null,
          group_id:     schedule.group_id ?? null,
          created_by:   schedule.assigned_to ?? null,
        })
        .select('id')
        .single()

      if (jobError || !job) {
        errors.push(`Schedule ${schedule.id}: job creation failed — ${jobError?.message}`)
        continue
      }

      // ── Copy steps from template ──────────────────────────────────────────
      const steps = (template.default_steps as TemplateStep[] | null) ?? []
      if (steps.length > 0) {
        await supabase.from('job_steps').insert(
          steps.map(s => ({
            job_id:           job.id,
            text:             s.text,
            sort_order:       s.sort_order,
            is_high_impact:   s.is_high_impact,
            allowance_amount: s.allowance_amount ?? 0,
            done:             false,
          }))
        )
      }

      // ── Advance schedule timestamps ───────────────────────────────────────
      const nextGenerateAt = calcNextGenerateAt(schedule.frequency as RecurringFrequency, now)

      await supabase
        .from('recurring_schedules')
        .update({
          last_generated_at: now.toISOString(),
          next_generate_at:  nextGenerateAt.toISOString(),
        })
        .eq('id', schedule.id)

      generated++
    } catch (err) {
      errors.push(`Schedule ${schedule.id}: unexpected error — ${String(err)}`)
    }
  }

  console.log(`[recurring/generate] generated=${generated} errors=${errors.length}`)

  return NextResponse.json({
    generated,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: now.toISOString(),
  })
}
