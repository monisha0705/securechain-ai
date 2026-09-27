/**
 * pages/Dashboard.jsx
 * Main dashboard view shown after a scan completes.
 */

import SummaryCards from '../components/SummaryCards'
import RiskGauge from '../components/RiskGauge'
import { SeverityPieChart, AnomalyBarChart } from '../components/Charts'
import DependencyTable from '../components/DependencyTable'
import VulnerabilityTable from '../components/VulnerabilityTable'
import AnomalyPanel from '../components/AnomalyPanel'
import { FileText, Clock, Download } from 'lucide-react'

export default function Dashboard({ data }) {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `securechain-${data.scan_id.slice(0,8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Scan metadata bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 py-3 px-5
                      bg-ink-800/60 border border-ink-700/40 rounded-xl">
        <div className="flex items-center gap-4 text-xs font-mono text-ink-400">
          <div className="flex items-center gap-1.5">
            <FileText size={12} className="text-cyan-DEFAULT" />
            <span className="text-ink-200">{data.filename}</span>
          </div>
          <span className="text-ink-700">|</span>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{new Date(data.scanned_at).toLocaleString()}</span>
          </div>
          <span className="text-ink-700">|</span>
          <span>scan_id: <span className="text-cyan-DEFAULT/70">{data.scan_id.slice(0, 12)}…</span></span>
        </div>
        <button onClick={handleExport} className="btn-outline text-xs py-1.5 flex items-center gap-2">
          <Download size={12} />
          Export JSON
        </button>
      </div>

      {/* Summary cards */}
      <SummaryCards data={data} />

      {/* Risk gauge + Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <RiskGauge risk={data.risk} summary={data.summary} />
        </div>
        <div className="lg:col-span-2 grid grid-rows-2 gap-5">
          <div className="card">
            <h2 className="section-title mb-1">Severity Distribution</h2>
            <p className="text-xs text-ink-400 mb-3">CVE severity breakdown by count</p>
            <div style={{ height: 200 }}>
              <SeverityPieChart data={data} />
            </div>
          </div>
          <div className="card">
            <h2 className="section-title mb-1">Anomaly Scores</h2>
            <p className="text-xs text-ink-400 mb-3">Isolation Forest score per package — above 0.5 = anomalous</p>
            <div style={{ height: 180 }}>
              <AnomalyBarChart data={data} />
            </div>
          </div>
        </div>
      </div>

      {/* Dependency table */}
      <DependencyTable data={data} />

      {/* Vulnerability + Anomaly row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <VulnerabilityTable data={data} />
        <AnomalyPanel data={data} />
      </div>

    </div>
  )
}
