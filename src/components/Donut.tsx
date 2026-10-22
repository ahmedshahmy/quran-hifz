import { useMemo } from 'react'

export interface DonutSegment {
  /** Relative weight of the slice. */
  value: number
  color: string
  label?: string
}

interface DonutProps {
  segments: DonutSegment[]
  /** Thickness of the ring as a fraction of the radius (0–1). */
  thickness?: number
  /** Gap between segments, in SVG units. */
  gap?: number
  size?: number
  children?: React.ReactNode
  className?: string
  ariaLabel?: string
}

/**
 * A donut/pie chart drawn with SVG strokes.
 *
 * Each segment is a full-circle stroke with its own dash pattern, so slices
 * animate smoothly and there is no path-arc maths to get wrong at 100%.
 */
export default function Donut({
  segments,
  thickness = 0.26,
  gap = 0,
  size = 220,
  children,
  className = '',
  ariaLabel,
}: DonutProps) {
  const stroke = size / 2
  const radius = (size / 2 - stroke / 2)
  const width = radius * thickness * 2
  const r = radius - width / 2
  const circumference = 2 * Math.PI * r

  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0)

  // Convert weights into cumulative dash offsets around the ring.
  const placed = useMemo(() => {
    let acc = 0
    return segments.map((seg) => {
      const frac = total > 0 ? Math.max(0, seg.value) / total : 0
      const len = Math.max(0, frac * circumference - (frac > 0 ? gap : 0))
      const offset = -acc * circumference
      acc += frac
      return { ...seg, len, offset }
    })
  }, [segments, total, circumference, gap])

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ maxWidth: size, overflow: 'visible' }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e6ebe9"
        strokeWidth={width}
      />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {placed.map((seg, i) => (
          <circle
            key={i}
            className="donut-seg"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={width}
            strokeDasharray={`${seg.len} ${circumference - seg.len}`}
            strokeDashoffset={seg.offset}
            strokeLinecap={gap > 0 ? 'round' : 'butt'}
          >
            {seg.label ? <title>{seg.label}</title> : null}
          </circle>
        ))}
      </g>
      {children ? (
        <foreignObject x={0} y={0} width={size} height={size}>
          <div
            // @ts-expect-error xmlns is valid in foreignObject
            xmlns="http://www.w3.org/1999/xhtml"
            className="flex h-full w-full flex-col items-center justify-center text-center"
          >
            {children}
          </div>
        </foreignObject>
      ) : null}
    </svg>
  )
}
