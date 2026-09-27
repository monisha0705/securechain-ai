f/**
 * components/AnomalyPanel.jsx
 * Shows AI anomaly detection results with feature breakdown for flagged packages.
 */

import { useState } from 'react'
import { Brain, Activity, ChevronDown, ChevronRight, Cpu, Network, HardDrive } from 'lucide-react'
import clsx from 'clsx'

const FEATURE_CONFIG = {
  api_calls_per_min:   { label: 'API Calls/min',     icon: Activity,  unit: '',    warnThreshold: 150 },
  file_access_count:   { label: 'File Accesses',      icon: HardDrive, unit: '',    warnThreshold: 80 },
  network_requests:    { label: 'Network Requests',   icon: Network,   unit: '',    warnThreshold: 40 },
  cpu_usage_pct:       { label: 'CPU Usage',          icon: Cpu,       unit: '%',   warnThreshold: 30 },
  memory_mb:           { label: 'Memory',             icon: Activity,  unit: 'MB',  warnThreshold: 350 },
  outbound_connections:{ label: 'Outbound Conns',     icon: Network,   unit: '',    warnThreshold: 8 },
  subprocess_spawns:   { label: 'Subprocess Spawns',  icon: Activity,  unit: '',    warnThreshold: 4 },
  env_variable_reads:  { label: 'Env Var Reads',      icon: Activity,  unit: '',    warnThreshold: 15 },
}

function FeatureBar({ featureKey, value }) {
  const cfg = FEATURE_CONFIG[featureKey]
  if (!cfg) return null
  const Icon = cfg.icon
  const isWarn = value > cfg.warnThreshold
  const pct = Math.min((value / (cfg.warnThreshold * 2)) * 100, 100)

  return (
    <div className="flex items-center gap-3">
      <div className={clsx(
        'w-6 h-6 rounded flex items-center justify-center flex-shrink-0',
        isWarn ? 'bg-red-alert/15' : 'bg-ink-700/60'
      )}>
        <Icon size={11} className={isWarn ? 'text-red-alert' : 'text-ink-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-mono text-ink-400 truncate">{cfg.label}</span>
          <span className={clsx(
            'text-[10px] font-mono font-medium',
            isWarn ? 'text-red-alert' : 'text-ink-300'
          )}>
            {typeof value === 'number' ? value.toFixed(1) : value}{cfg.unit}
          </span>
        </div>
        <div className="h-1 bg-ink-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: isWarn ? '#ef4444' : '#3d4580',
              boxShadow: isWarn ? '0 0 4px #ef444480' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function AnomalyPanel({ data }) {
  const [expanded, setExpanded] = useState(null)

  const anomalous = data.anomalies.records
    .filter(r => r.is_anomaly)
    .sort((a, b) => b.anomaly_score - a.anomaly_score)

  const normal = data.anomalies.records
    .filter(r => !r.is_anomaly)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <Brain size={16} className="text-cyan-DEFAULT" />
            AI Anomaly Detection
          </h2>
          <p className="text-xs text-ink-400 mt-0.5">
            Isolation Forest · {data.anomalies.model_used.split('(')[0].trim()}
          </p>
        </div>
        <div className="flex gap-3 text-xs font-mono">
          <span className="text-red-alert">{anomalous.length} flagged</span>
          <span className="text-ink-600">|</span>
          <span className="text-green-safe">{normal.length} clean</span>
        </div>
      </div>

      {anomalous.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-12 h-12 rounded-full bg-green-safe/10 border border-green-safe/30
                          flex items-center justify-center">
            <Brain size={20} className="text-green-safe" />
          </div>
          <p className="font-display font-semibold text-green-safe text-sm">No Anomalies Detected</p>
          <p className="text-xs text-ink-400">All packages exhibit normal behavior patterns</p>
        </div>
      ) : (
        <div className="space-y-2">
          {anomalous.map(record => (
            <div key={record.package_name}
              className="border border-red-alert/20 rounded-xl overflow-hidden
                         bg-red-alert/5 hover:bg-red-alert/8 transition-colors">
              <button
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() => setExpanded(e => e === record.package_name ? null : record.package_name)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-alert animate-pulse" />
                  <span className="font-mono text-sm text-ink-100 font-medium">
                    {record.package_name}
                  </span>
                  <span className="mono-tag">{record.version}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-alert"
                        style={{
                          width: `${record.anomaly_score * 100}%`,
                          boxShadow: '0 0 4px #ef444480',
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-red-alert font-bold">
                      {(record.anomaly_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  {expanded === record.package_name
                    ? <ChevronDown size={13} className="text-red-alert" />
                    : <ChevronRight size={13} className="text-ink-500" />
                  }
                </div>
              </button>

              {expanded === record.package_name && (
                <div className="px-4 pb-4 border-t border-red-alert/10 pt-3">
                  <p className="text-xs text-ink-400 mb-3 font-mono">
                    Behavioral risk factors detected:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(record.risk_factors).map(([k, v]) => (
                      <FeatureBar key={k} featureKey={k} value={v} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-ink-700/30 flex items-center justify-between text-xs font-mono text-ink-600">
        <span>Dataset: simulated telemetry (500 samples)</span>
        <span>Contamination: 15%</span>
      </div>
    </div>
  )
}
