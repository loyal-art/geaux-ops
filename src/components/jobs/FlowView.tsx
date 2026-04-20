'use client'

import {
  useState, useRef, useEffect, useTransition, useMemo, useLayoutEffect,
} from 'react'
import { toggleStep } from '@/app/jobs/actions'
import type { JobStep, StepDependency } from '@/lib/types'
import { playPop } from '@/lib/popSound'

// Shared window event used across views so a pop in the list view also wakes
// a bubble in the flow view (and vice versa) when they re-render.
const UNLOCK_EVENT = 'geaux-ops:step-unlocked'

// ── SVG pop burst — renders inside a bubble's transformed group ───────────────
// Draws 7 gold/green particles + an expanding gold flash ring. Self-cleans via
// forwards animations; the parent remounts via `key` on pop to replay.
// Variation comes from the deterministic `seed` prop (the parent's pop tick)
// so React's purity rules aren't violated by calls to `Math.random` in render.
function BubblePopBurst({ radius, seed }: { radius: number; seed: number }) {
  const rot    = ((seed * 0.6180339887) % 1) * Math.PI * 2
  const colors = ['#C8A44E', '#4ADE80', '#EAB308', '#F5D78A']
  const parts  = Array.from({ length: 7 }, (_, i) => {
    const angle = rot + (i / 7) * Math.PI * 2
    const dist  = radius + 14 + ((seed * 13 + i * 7) % 10)
    return {
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      color: colors[i % colors.length],
      delay: (i * 7 + (seed % 5)) % 40,
    }
  })
  return (
    <g pointerEvents="none">
      {/* Expanding gold flash ring */}
      <circle
        r={radius}
        cx={0}
        cy={0}
        fill="rgba(200,164,78,0.35)"
        stroke="rgba(200,164,78,0.6)"
        strokeWidth={1.2}
        className="geaux-pop-flash-svg"
      />
      {/* Radial particle spray */}
      {parts.map((p, i) => (
        <circle
          key={i}
          cx={0}
          cy={0}
          r={2.4}
          fill={p.color}
          className="geaux-pop-particle-svg"
          style={{
            ['--tx' as string]: `${p.tx}px`,
            ['--ty' as string]: `${p.ty}px`,
            animationDelay: `${p.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </g>
  )
}

// ── Text wrap helper ──────────────────────────────────────────────────────────

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const test = current ? `${current} ${word}` : word
    if (test.length <= maxChars) {
      current = test
    } else {
      if (current) {
        lines.push(current)
        if (lines.length >= maxLines - 1 && i < words.length - 1) {
          // last allowed line — truncate remaining
          const rest = words.slice(i).join(' ')
          lines.push(rest.length > maxChars ? rest.slice(0, maxChars - 1) + '…' : rest)
          return lines
        }
        current = word
      } else {
        lines.push(word.slice(0, maxChars - 1) + '…')
        current = ''
      }
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines.slice(0, maxLines)
}

// ── Node visual style by step state ──────────────────────────────────────────

function nodeStyle(step: JobStep): {
  fill: string; stroke: string; strokeW: number
  textColor: string; glow: boolean; glowColor: string
} {
  if (step.done) return {
    fill: 'rgba(74,222,128,0.18)', stroke: '#4ADE80', strokeW: 2.5,
    textColor: '#4ADE80', glow: false, glowColor: '#4ADE80',
  }
  if (step.is_high_impact) return {
    fill: 'rgba(200,164,78,0.14)', stroke: '#C8A44E', strokeW: 2,
    textColor: '#C8A44E', glow: true, glowColor: '#C8A44E',
  }
  return {
    fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.18)', strokeW: 1.5,
    textColor: '#E8E9ED', glow: false, glowColor: '#8B8F9E',
  }
}

// ── Layout algorithm — radial tree ────────────────────────────────────────────
// Top-level steps spread evenly around the center in a full 360° arc.
// Children spread in a sub-arc pointing away from the center.

interface PositionedNode {
  step:     JobStep
  x:        number
  y:        number
  r:        number   // bubble radius in px
  level:    1 | 2
  parentX?: number
  parentY?: number
}

function layoutNodes(steps: JobStep[]): PositionedNode[] {
  const R1 = 170   // center → top-level
  const R2 = 120   // parent → child

  const topLevel = steps
    .filter(s => !s.parent_step_id)
    .sort((a, b) => a.sort_order - b.sort_order)

  const nodes: PositionedNode[] = []
  const n = topLevel.length

  topLevel.forEach((step, i) => {
    // Evenly distribute around full circle, first node at 12 o'clock (−π/2)
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1)
    const x = Math.cos(angle) * R1
    const y = Math.sin(angle) * R1
    nodes.push({ step, x, y, r: 38, level: 1 })

    const children = steps
      .filter(s => s.parent_step_id === step.id)
      .sort((a, b) => a.sort_order - b.sort_order)

    const m = children.length
    // Spread children in ±angleStep arc centered on the parent's outward direction
    const angleStep = Math.min(0.62, (Math.PI * 1.3) / Math.max(m + 1, 3))
    const totalArc  = (m - 1) * angleStep

    children.forEach((child, j) => {
      const childAngle = angle - totalArc / 2 + j * angleStep
      const cx = x + Math.cos(childAngle) * R2
      const cy = y + Math.sin(childAngle) * R2
      nodes.push({ step: child, x: cx, y: cy, r: 28, level: 2, parentX: x, parentY: y })
    })
  })

  return nodes
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  steps:            JobStep[]
  jobTitle:         string
  jobColor:         string
  readOnly?:        boolean
  allDependencies?: StepDependency[]
}

// ── FlowView ──────────────────────────────────────────────────────────────────

export function FlowView({
  steps, jobTitle, jobColor, readOnly = false, allDependencies = [],
}: Props) {
  // Container dimensions (measured after mount for accurate centering)
  const containerRef  = useRef<HTMLDivElement>(null)
  const [cw, setCw]   = useState(450)
  const [ch, setCh]   = useState(420)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => { setCw(el.clientWidth); setCh(el.clientHeight) }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Pan / zoom state
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale]   = useState(1)

  // Optimistic done-state map (synced from props; overridden during transitions)
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>(
    () => Object.fromEntries(steps.map(s => [s.id, s.done]))
  )
  const [, startTransition] = useTransition()

  useEffect(() => {
    setDoneMap(Object.fromEntries(steps.map(s => [s.id, s.done])))
  }, [steps])

  // Drag tracking
  const dragging    = useRef(false)
  const lastMouse   = useRef({ x: 0, y: 0 })

  // Touch tracking
  const touchPos    = useRef<{ x: number; y: number } | null>(null)
  const touchDist   = useRef<number | null>(null)

  // Non-passive touchmove to prevent page scroll while panning
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onTM(e: TouchEvent) {
      if (e.touches.length === 1 && touchPos.current) {
        e.preventDefault()
        const dx = e.touches[0].clientX - touchPos.current.x
        const dy = e.touches[0].clientY - touchPos.current.y
        touchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        setOffset(p => ({ x: p.x + dx, y: p.y + dy }))
      } else if (e.touches.length === 2 && touchDist.current !== null) {
        e.preventDefault()
        const dx   = e.touches[1].clientX - e.touches[0].clientX
        const dy   = e.touches[1].clientY - e.touches[0].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const r    = dist / touchDist.current
        setScale(s => Math.max(0.2, Math.min(3, s * r)))
        touchDist.current = dist
      }
    }
    el.addEventListener('touchmove', onTM, { passive: false })
    return () => el.removeEventListener('touchmove', onTM)
  }, [])

  // ── Event handlers ────────────────────────────────────────────────────────

  function onBgMouseDown(e: React.MouseEvent) {
    dragging.current  = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setAttribute('data-dragging', '1')
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setOffset(p => ({ x: p.x + dx, y: p.y + dy }))
  }

  function onMouseUp(e: React.MouseEvent) {
    dragging.current = false
    e.currentTarget.removeAttribute('data-dragging')
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const f = e.deltaY > 0 ? 0.92 : 1.08
    setScale(s => Math.max(0.2, Math.min(3, s * f)))
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      touchPos.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      touchDist.current = null
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      touchDist.current = Math.sqrt(dx * dx + dy * dy)
      touchPos.current  = null
    }
  }

  function onTouchEnd() {
    touchPos.current  = null
    touchDist.current = null
  }

  // Transient tooltip shown when a locked bubble is tapped
  const [lockedTip, setLockedTip] = useState<{ stepId: string; text: string } | null>(null)
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Pop animations ────────────────────────────────────────────────────────
  // Per-step pop tick — incrementing the tick remounts the burst so it replays
  const [popTicks, setPopTicks] = useState<Record<string, number>>({})
  // Set of step IDs currently playing the "wake up" glow (cascade unlock)
  const [wakingIds, setWakingIds] = useState<Set<string>>(new Set())
  const wakeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  function triggerPop(stepId: string) {
    setPopTicks(p => ({ ...p, [stepId]: (p[stepId] ?? 0) + 1 }))
  }

  function triggerWake(ids: string[]) {
    if (ids.length === 0) return
    setWakingIds(prev => {
      const next = new Set(prev)
      for (const id of ids) next.add(id)
      return next
    })
    for (const id of ids) {
      const prior = wakeTimers.current.get(id)
      if (prior) clearTimeout(prior)
      const t = setTimeout(() => {
        setWakingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        wakeTimers.current.delete(id)
      }, 1000)
      wakeTimers.current.set(id, t)
    }
  }

  // Listen for unlock events from StepItem (cross-view cascade wake-up)
  useEffect(() => {
    function onUnlock(e: Event) {
      const detail = (e as CustomEvent<{ stepIds: string[] }>).detail
      if (detail?.stepIds?.length) triggerWake(detail.stepIds)
    }
    window.addEventListener(UNLOCK_EVENT, onUnlock)
    return () => window.removeEventListener(UNLOCK_EVENT, onUnlock)
  }, [])

  // Toast shown after a toggle when steps were unblocked or cascade-reverted
  const [toast, setToast] = useState<{ kind: 'unblock' | 'revert'; text: string } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(kind: 'unblock' | 'revert', text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ kind, text })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  const nodes = useMemo(() => layoutNodes(steps), [steps])

  // Merge optimistic done state into nodes
  const renderedNodes = useMemo(
    () => nodes.map(n => ({ ...n, step: { ...n.step, done: doneMap[n.step.id] ?? n.step.done } })),
    [nodes, doneMap]
  )

  // Index positions by step id for drawing dependency edges
  const nodeById = useMemo(() => {
    const m = new Map<string, typeof renderedNodes[number]>()
    for (const n of renderedNodes) m.set(n.step.id, n)
    return m
  }, [renderedNodes])

  // Compute which steps are locked (have an incomplete blocker)
  const lockedSet = useMemo(() => {
    const set = new Set<string>()
    for (const s of steps) {
      const done = doneMap[s.id] ?? s.done
      if (done) continue
      const blockers = allDependencies.filter(d => d.step_id === s.id)
      for (const d of blockers) {
        const bDone = doneMap[d.blocked_by_step_id]
          ?? steps.find(ss => ss.id === d.blocked_by_step_id)?.done
          ?? false
        if (!bDone) { set.add(s.id); break }
      }
    }
    return set
  }, [steps, allDependencies, doneMap])

  function handleBubbleTap(stepId: string) {
    if (readOnly) return
    if (lockedSet.has(stepId)) {
      const names = allDependencies
        .filter(d => d.step_id === stepId)
        .map(d => steps.find(s => s.id === d.blocked_by_step_id))
        .filter((s): s is JobStep => !!s && !(doneMap[s.id] ?? s.done))
        .map(s => `"${s.text}"`)
      const text = names.length > 0
        ? `Complete ${names.join(', ')} first`
        : 'Blocked'
      if (tipTimer.current) clearTimeout(tipTimer.current)
      setLockedTip({ stepId, text })
      tipTimer.current = setTimeout(() => setLockedTip(null), 2500)
      return
    }
    const next = !(doneMap[stepId] ?? false)
    setDoneMap(p => ({ ...p, [stepId]: next }))
    // Only completion gets the pop + SFX — uncheck is a silent reverse fade
    if (next) {
      triggerPop(stepId)
      playPop()
    }
    startTransition(async () => {
      const res = await toggleStep(stepId, next)
      if (res?.error) {
        setDoneMap(p => ({ ...p, [stepId]: !next }))
        return
      }
      if (next && res.unlockedStepNames.length > 0) {
        const names = res.unlockedStepNames
        // Resolve names → IDs and broadcast so newly-unlocked bubbles wake up
        const ids = names
          .map(n => steps.find(s => s.text === n)?.id)
          .filter((id): id is string => !!id)
        triggerWake(ids)
        if (ids.length > 0) {
          window.dispatchEvent(
            new CustomEvent(UNLOCK_EVENT, { detail: { stepIds: ids } }),
          )
        }
        showToast(
          'unblock',
          names.length === 1
            ? `Unblocked "${names[0]}"`
            : `Unblocked ${names.length} steps`,
        )
      } else if (!next && res.revertedStepNames.length > 0) {
        const names = res.revertedStepNames
        // Optimistically clear done state for the reverted steps so the flow
        // updates immediately before the server revalidation lands
        setDoneMap(p => {
          const updated = { ...p }
          for (const s of steps) if (names.includes(s.text)) updated[s.id] = false
          return updated
        })
        showToast(
          'revert',
          names.length === 1
            ? `Reverted "${names[0]}" — blocker was unchecked`
            : `Reverted ${names.length} dependent steps — blocker was unchecked`,
        )
      }
    })
  }

  const centerLines = wrapText(jobTitle, 14, 3)
  const COLOR       = jobColor || '#C8A44E'

  // SVG group origin = center of container + pan offset
  const tx = cw / 2 + offset.x
  const ty = ch / 2 + offset.y

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl select-none touch-none"
      style={{
        height:          420,
        overflow:        'hidden',
        backgroundColor: 'rgba(255,255,255,0.015)',
        border:          '1px solid rgba(255,255,255,0.06)',
        cursor:          dragging.current ? 'grabbing' : 'grab',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      // wheel on container so it always fires even over nodes
      onWheel={onWheel}
    >
      <svg
        width="100%"
        height="100%"
        style={{ display: 'block', overflow: 'visible' }}
        onMouseDown={onBgMouseDown}
      >
        <defs>
          <filter id="fv-glow-gold" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="fv-glow-green" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="fv-glow-center" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Arrowhead for dependency edges (blocker → blocked) */}
          <marker
            id="fv-dep-arrow"
            viewBox="0 0 10 10"
            refX="9" refY="5"
            markerWidth="6" markerHeight="6"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#F87171" />
          </marker>
        </defs>

        {/* ── All content in a transformed group for pan + zoom ── */}
        <g transform={`translate(${tx}, ${ty}) scale(${scale})`}>

          {/* ── Edge: center → top-level nodes ── */}
          {renderedNodes.filter(n => n.level === 1).map(n => (
            <line
              key={`e0-${n.step.id}`}
              x1={0} y1={0} x2={n.x} y2={n.y}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          ))}

          {/* ── Edge: top-level → child nodes ── */}
          {renderedNodes.filter(n => n.level === 2).map(n => (
            <line
              key={`e1-${n.step.id}`}
              x1={n.parentX ?? 0} y1={n.parentY ?? 0}
              x2={n.x}            y2={n.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          ))}

          {/* ── Dependency edges (blocker → blocked, red dotted + arrow) ── */}
          {allDependencies.map(dep => {
            const src = nodeById.get(dep.blocked_by_step_id)
            const tgt = nodeById.get(dep.step_id)
            if (!src || !tgt) return null
            // Shorten the line so the arrowhead terminates on the target bubble's edge
            const dx = tgt.x - src.x
            const dy = tgt.y - src.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const ux = dx / dist
            const uy = dy / dist
            const x1 = src.x + ux * src.r
            const y1 = src.y + uy * src.r
            const x2 = tgt.x - ux * (tgt.r + 4)
            const y2 = tgt.y - uy * (tgt.r + 4)
            return (
              <line
                key={`dep-${dep.id}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#F87171"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeLinecap="round"
                opacity={0.75}
                markerEnd="url(#fv-dep-arrow)"
                style={{ pointerEvents: 'none' }}
              />
            )
          })}

          {/* ── Step nodes ── */}
          {renderedNodes.map(n => {
            const s       = nodeStyle(n.step)
            const lns     = wrapText(n.step.text, n.level === 1 ? 12 : 9, 2)
            const lineH   = n.level === 1 ? 11 : 10
            const fSize   = n.level === 1 ? 9.5 : 8.5
            const locked  = lockedSet.has(n.step.id)
            const groupOp = locked ? 0.5 : 1
            const popTick = popTicks[n.step.id] ?? 0
            const popping = popTick > 0 && n.step.done
            const waking  = wakingIds.has(n.step.id)

            return (
              <g
                key={n.step.id}
                transform={`translate(${n.x},${n.y})`}
                onClick={e => { e.stopPropagation(); handleBubbleTap(n.step.id) }}
                onMouseDown={e => e.stopPropagation()}  // prevent pan start on node click
                style={{ cursor: readOnly ? 'default' : 'pointer', opacity: groupOp, transition: 'opacity 300ms ease' }}
              >
                {/* Cascade wake-up ring — gentle gold pulse for newly-unlocked bubbles */}
                {waking && !n.step.done && (
                  <circle
                    key={`wake-${n.step.id}`}
                    r={n.r + 4} fill="none"
                    stroke="#C8A44E" strokeWidth={1.5}
                    className="geaux-pop-wake-svg"
                  />
                )}

                {/* Pulse glow ring for high-impact steps (suppressed while locked) */}
                {s.glow && !locked && (
                  <circle
                    r={n.r + 10} fill="none"
                    stroke={s.glowColor} strokeWidth={1} opacity={0.2}
                    className="animate-pulse"
                  />
                )}

                {/* Inner group animates scale-burst on pop (around bubble centre) */}
                <g
                  key={popping ? `pop-${popTick}` : 'idle'}
                  className={popping ? 'geaux-pop-scale-svg' : ''}
                >
                  {/* Bubble */}
                  <circle
                    r={n.r}
                    fill={s.fill}
                    stroke={locked ? '#EAB308' : s.stroke}
                    strokeWidth={s.strokeW}
                    strokeDasharray={locked ? '3 2' : undefined}
                    style={{ transition: 'fill 280ms ease, stroke 280ms ease' }}
                    filter={
                      n.step.done
                        ? 'url(#fv-glow-green)'
                        : (s.glow && !locked)
                          ? 'url(#fv-glow-gold)'
                          : undefined
                    }
                  />

                  {/* Checkmark for completed — draws in when newly popped */}
                  {n.step.done && (
                    <path
                      key={`check-${popTick}`}
                      d={`M${-n.r*0.3},${-n.r*0.04} L${-n.r*0.08},${n.r*0.24} L${n.r*0.32},${-n.r*0.27}`}
                      stroke="#4ADE80" strokeWidth={2.2}
                      strokeLinecap="round" strokeLinejoin="round" fill="none"
                      className={popping ? 'geaux-check-draw' : ''}
                    />
                  )}
                </g>

                {/* Particle burst + flash — rendered on top when popping */}
                {popping && (
                  <g key={`burst-${popTick}`}>
                    <BubblePopBurst radius={n.r} seed={popTick} />
                  </g>
                )}

                {/* Label */}
                {!n.step.done && (
                  <text
                    textAnchor="middle"
                    fill={locked ? '#EAB308' : s.textColor}
                    fontSize={fSize}
                    fontWeight="500"
                    style={{ fontFamily: 'inherit', pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {lns.map((l, li) => (
                      <tspan
                        key={li}
                        x={0}
                        dy={li === 0 ? `${-((lns.length - 1) * lineH) / 2}px` : `${lineH}px`}
                      >
                        {l}
                      </tspan>
                    ))}
                  </text>
                )}

                {/* Lock icon overlay */}
                {locked && !n.step.done && (
                  <g transform={`translate(${n.r - 6}, ${-n.r + 2})`} style={{ pointerEvents: 'none' }}>
                    <circle r={7} fill="#0F1117" stroke="#EAB308" strokeWidth={1.2} />
                    <path
                      d="M-2.5,-0.5 h5 v3.2 h-5 z M-1.7,-0.5 v-1.6 a1.7,1.7 0 0 1 3.4,0 v1.6"
                      fill="none" stroke="#EAB308" strokeWidth={1.1}
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                  </g>
                )}
              </g>
            )
          })}

          {/* ── Center bubble (job title) ── */}
          <g style={{ cursor: 'default' }} onMouseDown={e => e.stopPropagation()}>
            {/* Outer pulse ring */}
            <circle
              r={64} fill="none"
              stroke={COLOR} strokeWidth={1} opacity={0.12}
              className="animate-pulse"
            />
            {/* Main bubble */}
            <circle
              r={52}
              fill={`${COLOR}1A`}    /* hex + 10% alpha */
              stroke={COLOR}
              strokeWidth={2.5}
              filter="url(#fv-glow-center)"
            />
            {/* Title text */}
            <text
              textAnchor="middle"
              fill={COLOR}
              fontSize={11}
              fontWeight="700"
              style={{ fontFamily: 'inherit', pointerEvents: 'none', userSelect: 'none' }}
            >
              {centerLines.map((l, li) => (
                <tspan
                  key={li}
                  x={0}
                  dy={li === 0 ? `${-((centerLines.length - 1) * 13) / 2}px` : '13px'}
                >
                  {l}
                </tspan>
              ))}
            </text>
          </g>

        </g>
      </svg>

      {/* ── Controls overlay ── */}
      <div
        className="absolute bottom-3 right-3 flex gap-1.5"
        onMouseDown={e => e.stopPropagation()}
      >
        <button
          onClick={() => { setOffset({ x: 0, y: 0 }); setScale(1) }}
          title="Reset view"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button
          onClick={() => setScale(s => Math.min(3, s * 1.3))}
          title="Zoom in"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.2, s * 0.77))}
          title="Zoom out"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M8 11h6" />
          </svg>
        </button>
      </div>

      {/* ── Legend ── */}
      <div
        className="absolute top-3 left-3 flex flex-col gap-1"
        onMouseDown={e => e.stopPropagation()}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
          <span className="text-[9px] font-medium" style={{ color: '#8B8F9E' }}>Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: 'rgba(200,164,78,0.14)', borderColor: '#C8A44E' }} />
          <span className="text-[9px] font-medium" style={{ color: '#8B8F9E' }}>Focus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <span className="text-[9px] font-medium" style={{ color: '#8B8F9E' }}>Pending</span>
        </div>
        {allDependencies.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(234,179,8,0.18)', border: '1px dashed #EAB308' }} />
            <span className="text-[9px] font-medium" style={{ color: '#8B8F9E' }}>Blocked</span>
          </div>
        )}
      </div>

      {/* ── Toast (unblock / cascade-revert) ── */}
      {toast && (
        <div
          className="absolute top-3 left-1/2 text-[11px] font-medium px-3 py-1.5 rounded-lg pointer-events-none"
          style={{
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            maxWidth: 'calc(100% - 24px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ...(toast.kind === 'unblock'
              ? {
                  backgroundColor: 'rgba(74,222,128,0.12)',
                  border: '1px solid rgba(74,222,128,0.3)',
                  color: '#4ADE80',
                }
              : {
                  backgroundColor: 'rgba(234,179,8,0.12)',
                  border: '1px solid rgba(234,179,8,0.35)',
                  color: '#EAB308',
                }),
          }}
        >
          {toast.text}
        </div>
      )}

      {/* ── Locked-bubble tooltip ── */}
      {lockedTip && (() => {
        const n = nodeById.get(lockedTip.stepId)
        if (!n) return null
        const left = tx + n.x * scale
        const top  = ty + n.y * scale - n.r * scale - 14
        return (
          <div
            className="absolute pointer-events-none text-[10px] font-medium px-2 py-1 rounded-md"
            style={{
              left, top, transform: 'translate(-50%, -100%)',
              backgroundColor: 'rgba(234,179,8,0.15)',
              border:          '1px solid rgba(234,179,8,0.4)',
              color:           '#EAB308',
              whiteSpace:      'nowrap',
              maxWidth:        '220px',
              overflow:        'hidden',
              textOverflow:    'ellipsis',
            }}
          >
            🔒 {lockedTip.text}
          </div>
        )
      })()}

      {/* ── Empty state ── */}
      {steps.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(200,164,78,0.08)', border: '1px solid rgba(200,164,78,0.2)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="text-xs font-medium" style={{ color: '#8B8F9E' }}>Add steps to see the flow</p>
        </div>
      )}
    </div>
  )
}
