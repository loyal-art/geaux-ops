import type { RecurringFrequency } from '@/lib/types'

/**
 * Calculate the next UTC midnight at which a recurring schedule should fire.
 *
 * Rules:
 *  daily    → tomorrow midnight UTC
 *  weekdays → next Mon–Fri midnight UTC (skips Sat & Sun)
 *  weekly   → same weekday next week, midnight UTC
 *  monthly  → same calendar day next month, midnight UTC
 */
export function calcNextGenerateAt(
  frequency: RecurringFrequency,
  from: Date = new Date(),
): Date {
  const next = new Date(from)

  switch (frequency) {
    case 'daily':
      next.setUTCDate(next.getUTCDate() + 1)
      next.setUTCHours(0, 0, 0, 0)
      break

    case 'weekdays': {
      // Advance one day at a time until we land on Mon–Fri
      do {
        next.setUTCDate(next.getUTCDate() + 1)
        next.setUTCHours(0, 0, 0, 0)
      } while (next.getUTCDay() === 0 || next.getUTCDay() === 6)
      break
    }

    case 'weekly':
      next.setUTCDate(next.getUTCDate() + 7)
      next.setUTCHours(0, 0, 0, 0)
      break

    case 'monthly':
      next.setUTCMonth(next.getUTCMonth() + 1)
      next.setUTCHours(0, 0, 0, 0)
      break
  }

  return next
}

/** Human-readable label for a frequency value */
export function frequencyLabel(frequency: RecurringFrequency): string {
  const labels: Record<RecurringFrequency, string> = {
    daily:    'Daily',
    weekdays: 'Weekdays (Mon–Fri)',
    weekly:   'Weekly',
    monthly:  'Monthly',
  }
  return labels[frequency]
}
