/**
 * components/RiskGauge.jsx
 * Animated arc gauge showing composite risk score with color coding.
 */

import clsx from 'clsx'

const getRiskConfig = (label, score) => {
  if (label === 'High')     return { color: '#ef4444', glow: '#ef444440', track: '#ef444415', emoji: '🔴', desc: 'Critical supply chain risk detected. Immediate action required.' }
  if (label === 'Moderate') return { color: '#f59e0b', glow: '#f59e0b40', track: '#f59e0b15', emoji: '🟡', desc: 'Elevated risk detected. Review flagged packages.' }
  return                           { color: '#22c55e', glow: '#22c55e40', track: '#22c55e15', emoji: '🟢', desc: 'No critical threats detected. Maintain vigilance.' }
}

export default function RiskGauge({ risk, summary }) {
  const { score, label, breakdown } = risk
  const cfg = getRiskConfig(label, score)

  // SVG arc parameters
  const R = 70
  const CX = 100
  const CY = 100
  const startAngle = -210
  const sweep = 240
  const pct = score / 100
  const fillAngle = startAngle + sweep * pct

  const toRad = d => (d * Math.PI) / 180
  const arcX = (angle) => CX + R * Math.cos(toRad(angle))
  const arcY = (angle) => CY + R * Math.sin(toRad(angle))

  const buildArc = (endAngle) => {
    const sx = arcX(startAngle), sy = arcY(startAngle)
    const ex = arcX(endAngle), ey = arcY(endAngle)
    const large = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
    return `M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey}`
  }

  const breakdownItems = [
    { label: 'Vulnerability', value: breakdown.vulnerability_score, max: 55 },
    { label: 'Anomaly', value: breakdown.anomaly_score, max: 30 },
    { label: 'Hygiene', value: breakdown.hygiene_score, max: 15 },
  ]

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">Risk Assessment</h2>
        <span className={clsx(
          'badge text-xs font-display font-semibold px-3 py-1',
          label === 'High' ? 'badge-critical' : label === 'Moderate' ? 'badge-medium' : 'badge-safe'
        )}>
          {cfg.emoji} {label}
        </span>
      </div>

      {/* Gauge SVG */}
      <div className="flex flex-col items-center my-2">
        <svg width="200" height="140" viewBox="0 0 200 170">
          {/* Track */}
          <path
            d={buildArc(startAngle + sweep)}
            fill="none"
            stroke={cfg.track}
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={buildArc(fillAngle)}
            fill="none"
            stroke={cfg.color}
            strokeWidth="12"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${cfg.glow})`,
              transition: 'all 1s ease',
            }}
          />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map(tick => {
            const a = startAngle + sweep * (tick / 100)
            const ix = CX + (R - 18) * Math.cos(toRad(a))
            const iy = CY + (R - 18) * Math.sin(toRad(a))
            return (
              <text key={tick} x={ix} y={iy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="7" fill="#5f679a" fontFamily="JetBrains Mono">
                {tick}
              </text>
            )
          })}
          {/* Center score */}
          <text x={CX} y={CY - 8} textAnchor="middle" fontSize="32"
            fontWeight="700" fill={cfg.color} fontFamily="Space Grotesk">
            {score.toFixed(0)}
          </text>
          <text x={CX} y={CY + 18} textAnchor="middle" fontSize="9"
            fill="#878db3" fontFamily="JetBrains Mono" letterSpacing="2">
            / 100
          </text>
        </svg>
      </div>

      {/* Description */}
      <p className="text-center text-xs text-ink-400 font-body px-4 mb-5 leading-relaxed">
        {cfg.desc}
      </p>

      {/* Breakdown bars */}
      <div className="space-y-3 mt-auto">
        {breakdownItems.map(item => {
          const pct = Math.min((item.value / item.max) * 100, 100)
          return (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-mono text-ink-400">{item.label}</span>
                <span className="text-xs font-mono text-ink-200">
                  {item.value.toFixed(1)}<span className="text-ink-600">/{item.max}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${pct}%`,
                    background: pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e',
                    boxShadow: `0 0 6px ${pct > 70 ? '#ef444460' : pct > 40 ? '#f59e0b60' : '#22c55e60'}`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Scan metadata */}
      <div className="mt-5 pt-4 border-t border-ink-700/40 grid grid-cols-2 gap-2 text-xs font-mono text-ink-500">
        <span>Model: <span className="text-ink-300">IsolationForest</span></span>
        <span>API: <span className="text-ink-300">OSV v1</span></span>
      </div>
    </div>
  )
}
