import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { description, client, finish, focus } = await request.json()

  if (!description?.trim()) {
    return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  const anthropic = new Anthropic({ apiKey })

  const userPrompt = [
    `Job description: ${description.trim()}`,
    client?.trim() ? `Client: ${client.trim()}` : '',
    finish?.trim() ? `Finish definition (what done looks like): ${finish.trim()}` : '',
    focus?.trim() ? `Focus areas: ${focus.trim()}` : '',
  ].filter(Boolean).join('\n')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: 'You are a project operations assistant for a small business. Given a job description, client, finish definition, and focus areas, generate a structured job with: a clear title, a list of 5-15 actionable steps in logical order, a suggested priority (urgent/normal/low), and a suggested category (business/home/personal/misc). Respond in JSON only with keys: title, steps (array of strings), priority, category.',
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = textBlock.text.trim()
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim()
    }

    const result = JSON.parse(jsonStr)

    // Validate shape
    if (!result.title || !Array.isArray(result.steps)) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
    }

    return NextResponse.json({
      title: result.title,
      steps: result.steps,
      priority: ['urgent', 'normal', 'low'].includes(result.priority) ? result.priority : 'normal',
      category: ['business', 'home', 'personal', 'misc'].includes(result.category) ? result.category : 'misc',
    })
  } catch (err) {
    console.error('AI generation error:', err)
    return NextResponse.json({ error: 'Failed to generate job' }, { status: 500 })
  }
}
