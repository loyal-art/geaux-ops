import { useId } from 'react'

interface Props {
  /** 0 – 1 */
  progress: number
  /** hex color from template (kept for API compatibility, fill uses range-based colors) */
  color:    string
  size?:    'sm' | 'md' | 'lg'
}

// Rendered pixel dimensions — wide + low to match ramp shape (3:1 aspect)
const SIZES = {
  sm: { w: 64,  h: 22 },
  md: { w: 96,  h: 32 },
  lg: { w: 136, h: 46 },
}

// SVG viewBox: 0 0 120 40
// Ramp (right-triangle): low-left → tall-right
//   bottom-left (0,40) · bottom-right (120,40) · top-right (120,0)

function getFillColor(pct: number): string {
  if (pct >= 1)     return '#4ADE80'   // green     — complete
  if (pct >= 0.76)  return '#9ACD32'   // lime      — 76–99%
  if (pct >= 0.51)  return '#C8A44E'   // gold      — 51–75%
  if (pct >= 0.26)  return '#FB923C'   // orange    — 26–50%
  if (pct >= 0.01)  return '#8B4513'   // rust      — 1–25%
  return '#2A2D37'                      // dim bg    — 0%
}

export function TriangleProgress({ progress, size = 'md' }: Props) {
  const id      = useId()
  const pct     = Math.max(0, Math.min(1, progress))
  const { w, h} = SIZES[size]

  const fillColor = getFillColor(pct)
  const clipW     = 120 * pct          // left-to-right fill across viewBox width
  const fillOpacity = pct === 0 ? 0 : 0.28 + pct * 0.52

  const isComplete    = pct >= 1
  const hasGlow       = pct >= 0.1
  const glowClass     = isComplete ? 'ramp-complete-anim' : 'ramp-glow-anim'
  const glowOpacity   = Math.min(0.55, pct * 0.65)

  // Embedded percentage text — skip for sm (too tiny)
  const showLabel = size !== 'sm' && pct > 0
  const fontSize  = size === 'lg' ? 10 : 8.5

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 120 40"
      fill="none"
      aria-label={`${Math.round(pct * 100)}% complete`}
      role="img"
    >
      <defs>
        {/* Clip rect: left-to-right fill */}
        <clipPath id={`ramp-clip-${id}`}>
          <rect x="0" y="0" width={clipW} height="40" />
        </clipPath>

        {/* Glow blur filter */}
        {hasGlow && (
          <filter id={`ramp-glow-${id}`} x="-8%" y="-20%" width="116%" height="140%">
            <feGaussianBlur stdDeviation={isComplete ? '3.5' : '2.5'} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Background ramp — dim outline */}
      <polygon
        points="0,40 120,40 120,0"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Progress fill — clipped left to right */}
      {pct > 0 && (
        <polygon
          points="0,40 120,40 120,0"
          fill={fillColor}
          fillOpacity={fillOpacity}
          clipPath={`url(#ramp-clip-${id})`}
        />
      )}

      {/* Pulsating glow overlay */}
      {hasGlow && (
        <polygon
          points="0,40 120,40 120,0"
          fill={fillColor}
          fillOpacity={glowOpacity}
          clipPath={`url(#ramp-clip-${id})`}
          filter={`url(#ramp-glow-${id})`}
          className={glowClass}
        />
      )}

      {/* Embedded percentage label — top-right of ramp */}
      {showLabel && (
        <text
          x="116"
          y={fontSize + 2}
          textAnchor="end"
          fontSize={fontSize}
          fontWeight="700"
          fill={fillColor}
          opacity="0.92"
          style={{ fontFamily: 'inherit' }}
        >
          {Math.round(pct * 100)}%
        </text>
      )}
    </svg>
  )
}
