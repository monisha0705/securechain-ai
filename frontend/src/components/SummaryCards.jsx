/**
 * components/SummaryCards.jsx
 * KPI summary cards: packages, vulnerabilities, anomalies, risk score
 */

import { Package, Bug, Brain, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'

const getRiskColor = (label) => {
  if (label === 'High')     return { text: 'text-red-alert',   glow: 'glow-red',   bg: 'bg-red-alert/10',   border: 'border-red-alert/30' }
  if (label === 'Moderate') return { text: 'text-amber-alert', glow: 'glow-amber', bg: 'bg-amber-alert/10', border: 'border-amber-alert/30' }
  return                           { text: 'text-green-safe',  glow: 'glow-green', bg: 'bg-green-safe/10',  border: 'border-green-safe/30' }
}

export default function SummaryCards({ data }) {
  const { summary } = data
  const risk = getRiskColor(summary.risk_label)

  const cards = [
    {
      label: 'Total Packages',
      value: summary.total_packages,
      sub: 'dependencies parsed',
      icon: Package,
      color: 'text-cyan-DEFAULT',
      glow: 'glow-cyan',
      bg: 'bg-cyan-DEFAULT/10',
      border: 'border-cyan-DEFAULT/20',
    },
    {
      label: 'Vulnerabilities',
      value: summary.total_vulnerabilities,
      sub: `${summary.vulnerable_packages} packages affected`,
      icon: Bug,
      color: summary.total_vulnerabilities > 0 ? 'text-red-alert' : 'text-green-safe',
      glow: summary.total_vulnerabilities > 0 ? 'glow-red' : 'glow-green',
      bg: summary.total_vulnerabilities > 0 ? 'bg-red-alert/10' : 'bg-green-safe/10',
      border: summary.total_vulnerabilities > 0 ? 'border-red-alert/20' : 'border-green-safe/20',
    },
    {
      label: 'Anomalous Packages',
      value: summary.anomalous_packages,
      sub: 'flagged by Isolation Forest',
      icon: Brain,
      color: summary.anomalous_packages > 0 ? 'text-amber-alert' : 'text-green-safe',
      glow: summary.anomalous_packages > 0 ? 'glow-amber' : 'glow-green',
      bg: summary.anomalous_packages > 0 ? 'bg-amber-alert/10' : 'bg-green-safe/10',
      border: summary.anomalous_packages > 0 ? 'border-amber-alert/20' : 'border-green-safe/20',
    },
    {
      label: 'Risk Score',
      value: `${summary.risk_score.toFixed(1)}`,
      sub: `${summary.risk_label} threat level`,
      icon: ShieldAlert,
      color: risk.text,
      glow: risk.glow,
      bg: risk.bg,
      border: risk.border,
      suffix: '/100',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label}
            className={clsx('card border', card.border, card.glow, 'transition-all duration-300')}>
            <div className="flex items-start justify-between mb-4">
              <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', card.bg)}>
                <Icon size={18} className={card.color} />
              </div>
              <span className={clsx('font-mono text-[10px] uppercase tracking-widest', card.color, 'opacity-60')}>
                live
              </span>
            </div>
            <div>
              <div className="flex items-end gap-1">
                <span className={clsx('font-display font-bold text-3xl leading-none', card.color)}>
                  {card.value}
                </span>
                {card.suffix && (
                  <span className="font-mono text-xs text-ink-500 mb-0.5">{card.suffix}</span>
                )}
              </div>
              <p className="font-display font-semibold text-sm text-ink-100 mt-2">{card.label}</p>
              <p className="font-body text-xs text-ink-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
