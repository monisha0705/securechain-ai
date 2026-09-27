/**
 * pages/Landing.jsx
 * Welcome screen shown before a scan — upload zone + feature overview.
 */

import UploadZone from '../components/UploadZone'
import { Shield, Zap, Brain, BarChart2, Globe, Lock } from 'lucide-react'

const FEATURES = [
  {
    icon: Globe,
    title: 'OSV Vulnerability Scan',
    desc: 'Real-time CVE lookup via Open Source Vulnerability database covering PyPI, npm, Maven and more.',
    color: 'text-cyan-DEFAULT',
    bg: 'bg-cyan-DEFAULT/10',
  },
  {
    icon: Brain,
    title: 'AI Anomaly Detection',
    desc: 'Isolation Forest ML model trained on behavioral telemetry flags typosquatting and unusual packages.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: BarChart2,
    title: 'Composite Risk Scoring',
    desc: 'Weighted scoring engine combines vulnerability severity, anomaly signals, and package hygiene (0–100).',
    color: 'text-amber-alert',
    bg: 'bg-amber-alert/10',
  },
  {
    icon: Zap,
    title: 'Instant Analysis',
    desc: 'Async parallel scanning with rate-limited API calls ensures fast results even for large dependency trees.',
    color: 'text-green-safe',
    bg: 'bg-green-safe/10',
  },
]

export default function Landing({ onScanComplete, isScanning, setIsScanning }) {
  return (
    <div className="max-w-4xl mx-auto space-y-12">

      {/* Hero */}
      <div className="text-center space-y-5 pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                        bg-cyan-DEFAULT/10 border border-cyan-DEFAULT/25 text-xs font-mono
                        text-cyan-DEFAULT tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-DEFAULT animate-pulse" />
          Research-Grade · Production-Ready
        </div>

        <h1 className="font-display font-bold text-5xl text-ink-50 leading-tight tracking-tight">
          Detect Supply Chain<br />
          <span className="text-cyan-DEFAULT">Attacks Before They Strike</span>
        </h1>

        <p className="font-body text-lg text-ink-400 max-w-xl mx-auto leading-relaxed">
          Upload your <code className="font-mono text-xs bg-ink-700 px-2 py-0.5 rounded">requirements.txt</code> and
          get an instant AI-powered risk assessment combining real CVE data with machine learning anomaly detection.
        </p>
      </div>

      {/* Upload zone */}
      <div className="card border-ink-600/60">
        <h2 className="section-title mb-1">Start Security Scan</h2>
        <p className="text-xs text-ink-400 mb-5">
          Upload your Python requirements file for a full supply chain analysis
        </p>
        <UploadZone
          onScanComplete={onScanComplete}
          isScanning={isScanning}
          setIsScanning={setIsScanning}
        />
      </div>

      {/* Feature grid */}
      <div>
        <h2 className="section-title text-center mb-6">System Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} className="card border-ink-700/50 flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${f.bg}`}>
                  <Icon size={18} className={f.color} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-ink-100">{f.title}</h3>
                  <p className="text-xs text-ink-400 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Architecture note */}
      <div className="border border-ink-700/40 rounded-xl p-5 bg-ink-800/30">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={13} className="text-cyan-DEFAULT" />
          <span className="font-display font-semibold text-sm text-ink-100">Architecture</span>
          <span className="mono-tag ml-2">FastAPI + React + Isolation Forest</span>
        </div>
        <p className="text-xs text-ink-400 leading-relaxed">
          SecureChain AI is a full-stack system built for research and production use.
          The backend uses <strong className="text-ink-200">Python FastAPI</strong> with async OSV API integration
          and a <strong className="text-ink-200">Scikit-learn Isolation Forest</strong> model trained on simulated
          supply chain behavioral telemetry. Results are persisted to SQLite (PostgreSQL-ready) and exposed
          via a versioned REST API consumed by this React dashboard.
        </p>
      </div>

    </div>
  )
}
