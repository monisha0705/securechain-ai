/**
 * components/Charts.jsx
 * Severity distribution pie chart + anomaly score bar chart using Recharts.
 */

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from 'recharts'

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#f59e0b',
  LOW:      '#3b82f6',
  UNKNOWN:  '#6b7280',
}

const CustomTooltipPie = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-mono text-ink-100">{d.name}</p>
      <p className="font-display font-bold text-base" style={{ color: d.payload.fill }}>
        {d.value} <span className="text-ink-400 font-normal text-xs">vulns</span>
      </p>
    </div>
  )
}

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const score = payload[0]?.value
  return (
    <div className="bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 shadow-xl text-xs max-w-48">
      <p className="font-mono text-cyan-DEFAULT truncate">{label}</p>
      <p className="font-display font-bold text-base text-ink-100 mt-1">
        {score?.toFixed(3)} <span className="text-ink-400 font-normal text-xs">anomaly</span>
      </p>
      <p className={`text-xs mt-0.5 ${score > 0.5 ? 'text-red-alert' : 'text-green-safe'}`}>
        {score > 0.5 ? '⚠ Anomalous' : '✓ Normal'}
      </p>
    </div>
  )
}

const CustomLegend = ({ payload }) => (
  <div className="flex flex-wrap justify-center gap-3 mt-2">
    {payload.map(entry => (
      <div key={entry.value} className="flex items-center gap-1.5 text-xs font-mono text-ink-300">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
        {entry.value}
      </div>
    ))}
  </div>
)

export function SeverityPieChart({ data }) {
  const dist = data.summary.severity_distribution
  const chartData = Object.entries(dist)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, fill: SEVERITY_COLORS[name] }))

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-green-safe/10 border border-green-safe/30
                          flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">✓</span>
          </div>
          <p className="font-display font-semibold text-green-safe">No Vulnerabilities</p>
          <p className="text-xs text-ink-400 mt-1">All packages are clean</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="46%"
          innerRadius={52}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, idx) => (
            <Cell
              key={idx}
              fill={entry.fill}
              style={{ filter: `drop-shadow(0 0 4px ${entry.fill}60)` }}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltipPie />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function AnomalyBarChart({ data }) {
  const records = data.anomalies.records
    .slice()
    .sort((a, b) => b.anomaly_score - a.anomaly_score)
    .slice(0, 20) // top 20 for readability

  const chartData = records.map(r => ({
    name: r.package_name,
    score: r.anomaly_score,
    anomaly: r.is_anomaly,
  }))

  const getBarColor = (entry) => entry.anomaly ? '#ef4444' : '#22c55e'

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1c214d" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#5f679a', fontSize: 9, fontFamily: 'JetBrains Mono' }}
          angle={-45}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          domain={[0, 1]}
          tick={{ fill: '#5f679a', fontSize: 9, fontFamily: 'JetBrains Mono' }}
          tickFormatter={v => v.toFixed(1)}
        />
        <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
        <ReferenceLine
          y={0.5}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          strokeOpacity={0.6}
          label={{ value: 'threshold', fill: '#f59e0b', fontSize: 8, fontFamily: 'JetBrains Mono' }}
        />
        <Bar
          dataKey="score"
          radius={[3, 3, 0, 0]}
          maxBarSize={28}
        >
          {chartData.map((entry, idx) => (
            <Cell
              key={idx}
              fill={getBarColor(entry)}
              style={{ filter: `drop-shadow(0 0 3px ${getBarColor(entry)}60)` }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
