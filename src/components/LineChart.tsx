import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export interface ChartSeries {
  id: string
  name: string
  color: string
  values: number[]
  /** false olan noktalarda işaretçi çizilmez (o hafta oynamadı) */
  solid?: boolean[]
}

interface Props {
  labels: string[]
  series: ChartSeries[]
  /** 1 numara üstte olsun diye sıralama grafiğinde true */
  invertY?: boolean
  /** y ekseni için açık tick listesi (sıralama: 1..N) */
  yTicks?: number[]
  yMin?: number
  yMax?: number
  height?: number
  /** seçiliyken diğer seriler soluklaşır */
  activeId?: string | null
  formatValue?: (v: number) => string
  /** 4 ve altı seride uç noktaya doğrudan etiket */
  endLabels?: boolean
}

const GRID = '#e1e0d9'
const AXIS = '#c3c2b7'
const MUTED = '#898781'

export default function LineChart({
  labels,
  series,
  invertY = false,
  yTicks,
  yMin,
  yMax,
  height = 220,
  activeId = null,
  formatValue = v => String(v),
  endLabels = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const padL = 30
  const padR = endLabels ? 52 : 14
  const padT = 12
  const padB = 24
  const plotW = Math.max(0, width - padL - padR)
  const plotH = Math.max(0, height - padT - padB)

  const allValues = series.flatMap(s => s.values)
  const lo = yMin ?? (allValues.length ? Math.min(...allValues) : 0)
  const hi = yMax ?? (allValues.length ? Math.max(...allValues) : 1)
  const span = hi - lo || 1

  const x = (i: number) =>
    padL + (labels.length === 1 ? plotW / 2 : (i / (labels.length - 1)) * plotW)
  const y = (v: number) => {
    const t = (v - lo) / span
    return padT + (invertY ? t : 1 - t) * plotH
  }

  const ticks = yTicks ?? niceTicks(lo, hi, 4)

  // Uzun sezonlarda x etiketlerini seyrelt. İlk ve son hafta her zaman görünür;
  // sona zorla eklenen etiketin komşusu kaldırılır, yoksa üst üste biner.
  const maxLabels = Math.max(2, Math.floor(plotW / 42))
  const labelStep = Math.max(1, Math.ceil(labels.length / maxLabels))
  const lastIndex = labels.length - 1
  const shownLabels = new Set<number>()
  for (let i = 0; i < labels.length; i += labelStep) shownLabels.add(i)
  for (let i = Math.max(0, lastIndex - labelStep + 1); i < lastIndex; i++) shownLabels.delete(i)
  shownLabels.add(lastIndex)

  const pointerIndex = useCallback(
    (clientX: number) => {
      const el = wrapRef.current
      if (!el || labels.length === 0) return null
      const rect = el.getBoundingClientRect()
      const rel = clientX - rect.left - padL
      if (labels.length === 1) return 0
      const i = Math.round((rel / plotW) * (labels.length - 1))
      return Math.min(labels.length - 1, Math.max(0, i))
    },
    [labels.length, plotW, padL],
  )

  if (width === 0) return <div ref={wrapRef} style={{ height }} />

  const dimmed = (id: string) => activeId !== null && activeId !== id
  // Seçili seri en üstte çizilsin
  const drawOrder = [...series].sort(
    (a, b) => Number(a.id === activeId) - Number(b.id === activeId),
  )

  return (
    <div className="relative" ref={wrapRef} style={{ touchAction: 'pan-y' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
        role="img"
        aria-label={`${series.map(s => s.name).join(', ')} — ${labels.length} haftalık değişim`}
        onPointerDown={e => setHover(pointerIndex(e.clientX))}
        onPointerMove={e => { if (e.pointerType !== 'touch' || e.buttons) setHover(pointerIndex(e.clientX)) }}
        onPointerLeave={() => setHover(null)}
        onPointerUp={() => setHover(null)}
        onPointerCancel={() => setHover(null)}
      >
        {/* Yatay kılavuz çizgileri + y etiketleri */}
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={padL + plotW} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text
              x={padL - 7}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill={MUTED}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {t}
            </text>
          </g>
        ))}

        {/* Crosshair */}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke={AXIS} strokeWidth={1} />
        )}

        {/* x etiketleri */}
        {labels.map((label, i) =>
          shownLabels.has(i) ? (
            <text
              key={label + i}
              x={x(i)}
              y={height - 7}
              textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}
              fontSize={10}
              fill={MUTED}
            >
              {label}
            </text>
          ) : null,
        )}

        {/* Seriler */}
        {drawOrder.map(s => {
          const faded = dimmed(s.id)
          const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
          return (
            <g key={s.id} opacity={faded ? 0.18 : 1}>
              <path
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth={activeId === s.id ? 3 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.values.map((v, i) =>
                (s.solid ? s.solid[i] : true) ? (
                  <circle
                    key={i}
                    cx={x(i)}
                    cy={y(v)}
                    r={hover === i ? 5 : 4}
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ) : null,
              )}
            </g>
          )
        })}

        {/* Uç nokta etiketleri (<=4 seri) */}
        {endLabels &&
          deCollide(
            series.map(s => ({
              id: s.id,
              color: s.color,
              text: s.name.split(' ')[0],
              yPos: y(s.values[s.values.length - 1]),
            })),
            12,
            padT,
            padT + plotH,
          ).map(l => (
            <text
              key={l.id}
              x={padL + plotW + 6}
              y={l.yPos}
              dominantBaseline="middle"
              fontSize={10}
              fontWeight={700}
              fill={dimmed(l.id) ? MUTED : l.color}
              opacity={dimmed(l.id) ? 0.35 : 1}
            >
              {l.text}
            </text>
          ))}
      </svg>

      {/* İpucu */}
      {hover !== null && (
        <div
          className="absolute z-10 pointer-events-none bg-white rounded-xl shadow-lg border border-navy-100 px-3 py-2 text-[11px]"
          style={{
            left: Math.min(Math.max(x(hover) - 60, 2), Math.max(2, width - 122)),
            top: 2,
            width: 120,
          }}
        >
          <div className="font-bold text-navy-800 mb-1">{labels[hover]}</div>
          {[...series]
            .sort((a, b) => (invertY ? a.values[hover] - b.values[hover] : b.values[hover] - a.values[hover]))
            .map(s => (
              <div key={s.id} className="flex items-center gap-1.5 leading-5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="flex-1 truncate text-navy-600">{s.name.split(' ')[0]}</span>
                <span className="font-bold text-navy-800 tabular-nums">{formatValue(s.values[hover])}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

/** Üst üste binen uç etiketlerini minimum aralığa iter. */
function deCollide<T extends { yPos: number }>(items: T[], gap: number, min: number, max: number): T[] {
  const sorted = [...items].sort((a, b) => a.yPos - b.yPos)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].yPos - sorted[i - 1].yPos < gap) sorted[i].yPos = sorted[i - 1].yPos + gap
  }
  const overflow = sorted.length ? sorted[sorted.length - 1].yPos - max : 0
  if (overflow > 0) for (const s of sorted) s.yPos -= overflow
  if (sorted.length && sorted[0].yPos < min) {
    const shift = min - sorted[0].yPos
    for (const s of sorted) s.yPos += shift
  }
  return sorted
}

function niceTicks(lo: number, hi: number, count: number): number[] {
  if (hi === lo) return [lo]
  const raw = (hi - lo) / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) ?? 10 * mag
  const start = Math.ceil(lo / step) * step
  const out: number[] = []
  for (let v = start; v <= hi + 1e-9; v += step) out.push(Math.round(v * 100) / 100)
  return out
}
