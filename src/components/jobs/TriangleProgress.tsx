import { useId } from 'react'

interface Props {
  /** 0 – 1 */
  progress: number
  /** hex color from template */
  color:    string
  size?:    'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { w: 40,  h: 36  },
  md: { w: 56,  h: 50  },
  lg: { w: 100, h: 88  },
}

// SVG coordinates for an equilateral-ish triangle
// top vertex (50,4), bottom-right (96,84), bottom-left (4,84)
// Triangle height in SVG units = 80

export function TriangleProgress({ progress, color, size = 'md' }: Props) {
  const id       = useId()
  const pct      = Math.max(0, Math.min(1, progress))
  const { w, h } = SIZES[size]

  // Fill from bottom up
  const triH     = 80          // SVG units from y=4 to y=84
  const fillH    = triH * pct
  const clipY    = 84 - fillH  // top of the fill rect

  const fillColor   = pct >= 1 ? '#4ADE80' : color
  const fillOpacity = pct === 0 ? 0 : 0.25 + pct * 0.75
  const showGlow    = pct > 0.6

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 90"
      fill="none"
      aria-label={`${Math.round(pct * 100)}% complete`}
      role="img"
    >
      <defs>
        <clipPath id={`tri-clip-${id}`}>
          <rect x="0" y={clipY} width="100" height={fillH + 2} />
        </clipPath>
        {showGlow && (
          <filter id={`tri-glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Background triangle — dim outline */}
      <polygon
        points="50,4 96,84 4,84"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Progress fill — clips from bottom up */}
      {pct > 0 && (
        <polygon
          points="50,4 96,84 4,84"
          fill={fillColor}
          fillOpacity={fillOpacity}
          clipPath={`url(#tri-clip-${id})`}
          filter={showGlow ? `url(#tri-glow-${id})` : undefined}
        />
      )}

      {/* Bright outline at 100% */}
      {pct >= 1 && (
        <polygon
          points="50,4 96,84 4,84"
          fill="none"
          stroke="#4ADE80"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity="0.7"
          filter={`url(#tri-glow-${id})`}
        />
      )}
    </svg>
  )
}
