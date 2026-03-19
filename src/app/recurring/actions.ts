'use server'

import { createClient } from '@/lib/supabase/server'
import { calcNextGenerateAt } from '@/lib/recurring'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { RecurringFrequency } from '@/lib/types'

// ── Create Recurring Schedule ─────────────────────────────────────────────────

export async function createRecurringSchedule(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify owner role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') {
    redirect('/recurring?error=not-owner')
  }

  const templateId  = formData.get('template_id') as string
  const frequency   = formData.get('frequency') as RecurringFrequency
  const assignedTo  = (formData.get('assigned_to') as string) || null
  const groupId     = (formData.get('group_id') as string) || null

  if (!templateId || !frequency) {
    redirect('/recurring/new?error=missing-fields')
  }

  const nextGenerateAt = calcNextGenerateAt(frequency)

  const { error } = await supabase
    .from('recurring_schedules')
    .insert({
      template_id:      templateId,
      frequency,
      assigned_to:      assignedTo,
      group_id:         groupId,
      active:           true,
      next_generate_at: nextGenerateAt.toISOString(),
    })

  if (error) redirect(`/recurring/new?template=${templateId}&error=${encodeURIComponent(error.message)}`)

  revalidatePath('/recurring')
  redirect('/recurring')
}

// ── Toggle Schedule Active/Paused ─────────────────────────────────────────────

export async function toggleScheduleActive(scheduleId: string, active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') return { error: 'Only owners can manage recurring schedules' }

  // When re-activating, recalculate next_generate_at from now
  const updates: Record<string, unknown> = { active }
  if (active) {
    const { data: schedule } = await supabase
      .from('recurring_schedules')
      .select('frequency')
      .eq('id', scheduleId)
      .single()

    if (schedule) {
      updates.next_generate_at = calcNextGenerateAt(schedule.frequency as RecurringFrequency).toISOString()
    }
  }

  const { error } = await supabase
    .from('recurring_schedules')
    .update(updates)
    .eq('id', scheduleId)

  if (error) return { error: error.message }

  revalidatePath('/recurring')
  return { error: null }
}

// ── Delete Recurring Schedule ─────────────────────────────────────────────────

export async function deleteRecurringSchedule(scheduleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') return { error: 'Only owners can delete recurring schedules' }

  const { error } = await supabase
    .from('recurring_schedules')
    .delete()
    .eq('id', scheduleId)

  if (error) return { error: error.message }

  revalidatePath('/recurring')
  return { error: null }
}
