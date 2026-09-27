/**
 * components/DependencyTable.jsx
 * Full list of scanned packages with vulnerability counts and anomaly scores.
 */

import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

const SeverityBadge = ({ severity }) => {
  const cls = {
    CRITICAL: 'badge-critical',
    HIGH:     'badge-high',
    MEDIUM:   'badge-medium',
    LOW:      'badge-low',
    UNKNOWN:  'badge-unknown',
  }[severity] || 'badge-unknown'
  return <span className={cls}>{severity}</span>
}

export default function DependencyTable({ data }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('risk')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 12

  // Build merged rows
  const rows = useMemo(() => {
    const vulnMap = {}
    data.vulnerabilities.forEach(v => {
      vulnMap[v.package] = v
    })
    const anomalyMap = {}
    data.anomalies.records.forEach(a => {
      anomalyMap[a.package_name] = a
    })

    return data.dependencies.map(dep => {
      const vuln = vulnMap[dep.name] || { vuln_count: 0, vulnerabilities: [] }
      const anomaly = anomalyMap[dep.name] || { anomaly_score: 0, is_anomaly: false }
      const maxSev = vuln.vulnerabilities[0]?.severity || null
      return {
        name: dep.name,
        version: dep.normalized_version,
        vuln_count: vuln.vuln_count,
        max_severity: maxSev,
        anomaly_score: anomaly.anomaly_score,
        is_anomaly: anomaly.is_anomaly,
        risk: vuln.vuln_count * 10 + anomaly.anomaly_score * 5,
      }
    })
  }, [data])

  const filtered = useMemo(() => {
    let result = rows.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase())
    )
    result.sort((a, b) => {
      const va = a[sortKey] ?? 0
      const vb = b[sortKey] ?? 0
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va - vb)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [rows, search, sortKey, sortDir])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-cyan-DEFAULT" />
      : <ChevronDown size={12} className="text-cyan-DEFAULT" />
  }

  const Th = ({ col, label }) => (
    <th className="cursor-pointer select-none" onClick={() => handleSort(col)}>
      <div className="flex items-center gap-1.5">
        {label} <SortIcon col={col} />
      </div>
    </th>
  )

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h2 className="section-title">Dependency Analysis</h2>
          <p className="text-xs text-ink-400 mt-0.5">{filtered.length} packages</p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            placeholder="Search packages…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="pl-8 pr-4 py-2 rounded-lg bg-ink-700/50 border border-ink-600
                       text-sm font-mono text-ink-200 placeholder-ink-600
                       focus:outline-none focus:border-cyan-DEFAULT/50 w-52
                       transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="table-base">
          <thead>
            <tr>
              <Th col="name"          label="Package" />
              <Th col="version"       label="Version" />
              <Th col="vuln_count"    label="CVEs" />
              <th>Max Severity</th>
              <Th col="anomaly_score" label="Anomaly Score" />
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(row => (
              <tr key={row.name}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-ink-100">{row.name}</span>
                    <a
                      href={`https://pypi.org/project/${row.name}`}
                      target="_blank" rel="noreferrer"
                      className="text-ink-600 hover:text-cyan-DEFAULT transition-colors"
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </td>
                <td>
                  <span className="mono-tag">{row.version}</span>
                </td>
                <td>
                  <span className={clsx(
                    'font-mono font-bold text-sm',
                    row.vuln_count > 0 ? 'text-red-alert' : 'text-green-safe'
                  )}>
                    {row.vuln_count}
                  </span>
                </td>
                <td>
                  {row.max_severity
                    ? <SeverityBadge severity={row.max_severity} />
                    : <span className="text-ink-600 text-xs">—</span>
                  }
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.anomaly_score * 100}%`,
                          background: row.is_anomaly ? '#ef4444' : '#22c55e',
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-ink-400">
                      {row.anomaly_score.toFixed(3)}
                    </span>
                  </div>
                </td>
                <td>
                  {row.is_anomaly || row.vuln_count > 0 ? (
                    <span className={clsx(
                      'badge text-[10px]',
                      row.vuln_count > 0 && row.is_anomaly ? 'badge-critical' :
                      row.vuln_count > 0 ? 'badge-high' : 'badge-medium'
                    )}>
                      {row.vuln_count > 0 && row.is_anomaly ? 'Critical' :
                       row.vuln_count > 0 ? 'Vulnerable' : 'Anomalous'}
                    </span>
                  ) : (
                    <span className="badge-safe badge text-[10px]">Clean</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-700/30">
          <span className="text-xs text-ink-500 font-mono">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-outline text-xs py-1.5 px-3 disabled:opacity-30"
            >← Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="btn-outline text-xs py-1.5 px-3 disabled:opacity-30"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
