import { useParams, Link } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, Clock } from 'lucide-react'
import { useSiteDetail } from '../hooks/useApi'
import { privacyAPI } from '../utils/api'

export default function ResearcherMode() {
  const { domain } = useParams()
  const { site, loading, refetch } = useSiteDetail(domain)
  const [evidence, setEvidence] = useState(null)
  const [auditReport, setAuditReport] = useState(null)
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [snapshot, setSnapshot] = useState(null)
  const [snapshotTime, setSnapshotTime] = useState(null)
  const apiBase = import.meta.env.VITE_API_URL || 'https://tracely-backend-tn5u.onrender.com/api'

  const fetchEvidence = async () => {
    if (!domain) return
    try {
      setEvidenceLoading(true)
      const [evidenceRes, auditRes] = await Promise.all([
        privacyAPI.getSiteEvidence(domain, { limit: 200 }),
        privacyAPI.getSiteAuditReport(domain),
      ])
      setEvidence(evidenceRes.data.data)
      setAuditReport(auditRes.data.data)
    } catch (err) {
      setEvidence(null)
      setAuditReport(null)
    } finally {
      setEvidenceLoading(false)
    }
  }

  useEffect(() => {
    fetchEvidence()
  }, [domain])

  const handleRerun = async () => {
    await refetch()
    await fetchEvidence()
  }

  const handleFreezeSnapshot = () => {
    if (!evidence) return
    setSnapshot(JSON.parse(JSON.stringify(evidence)))
    setSnapshotTime(new Date())
  }

  const snapshotDiff = useMemo(() => {
    if (!snapshot || !evidence) return null
    const currentCount = evidence.observations?.length || 0
    const snapshotCount = snapshot.observations?.length || 0
    return {
      currentCount,
      snapshotCount,
      delta: currentCount - snapshotCount,
    }
  }, [snapshot, evidence])

  const downloadJson = () => {
    if (!evidence) return
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${domain}-evidence.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCsv = () => {
    if (!evidence?.observations) return
    const headers = [
      'trackerDomain',
      'category',
      'trackerType',
      'count',
      'firstSeen',
      'lastSeen',
      'persistenceDays',
      'confidence',
      'samplePath',
    ]
    const rows = evidence.observations.map((o) => [
      o.trackerDomain,
      o.category,
      o.trackerType,
      o.count,
      new Date(o.firstSeen).toISOString(),
      new Date(o.lastSeen).toISOString(),
      o.persistenceDays,
      o.confidence,
      o.samplePath || '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${domain}-evidence.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/site/${domain}`}
          className="flex items-center gap-2 text-privacy-600 hover:text-privacy-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Site Details
        </Link>
      </div>

      {/* Page Title */}
      <div className="glass p-8 rounded-xl border border-gray-200 bg-gradient-to-br from-privacy-50 to-transparent">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Researcher Mode</h1>
        <p className="text-gray-700 text-lg">
          Evidence-based analysis of {site?.domain || domain} with traceable methodology and reproducible results.
        </p>
        <p className="text-sm text-gray-600 mt-3">
          This mode is designed for accountability, not surveillance. All data is structured evidence only, with no personal content.
        </p>
      </div>

      {/* Methodology */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Methodology</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>Data is collected via a local browser extension observing third‑party requests.</li>
          <li>Logged metadata: tracker domain, category, type, timestamp, and request path.</li>
          <li>Explicitly excluded: page content, user identities, credentials, or form data.</li>
          <li>Limitations: detection is limited to observed sessions and known tracker patterns.</li>
        </ul>
      </div>

      {/* Reproducibility Controls */}
      <div className="glass p-6 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reproducibility Controls</h3>
          <p className="text-sm text-gray-600">Rerun analysis, freeze a snapshot, and compare results.</p>
          {snapshotTime && (
            <p className="text-xs text-gray-500 mt-1">Snapshot frozen: {snapshotTime.toLocaleString()}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRerun}
            className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Rerun Analysis
          </button>
          <button
            onClick={handleFreezeSnapshot}
            className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={!evidence}
          >
            Freeze Snapshot
          </button>
        </div>
      </div>

      {/* Evidence Timeline */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Evidence Timeline</h3>
          {evidenceLoading && <span className="text-xs text-gray-500">Loading...</span>}
        </div>

        {!evidenceLoading && evidence?.observations?.length === 0 && (
          <p className="text-sm text-gray-600">No evidence available yet. Collect more observations with the extension.</p>
        )}

        {evidence?.observations?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Tracker</th>
                  <th className="py-2 pr-4">First Seen</th>
                  <th className="py-2 pr-4">Last Seen</th>
                  <th className="py-2 pr-4">Count</th>
                  <th className="py-2 pr-4">Persistence</th>
                  <th className="py-2 pr-4">Confidence</th>
                  <th className="py-2 pr-4">Sample Path</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {evidence.observations.slice(0, 12).map((obs) => (
                  <tr key={obs.trackerDomain} className="border-t hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium">{obs.trackerDomain}</td>
                    <td className="py-2 pr-4">{new Date(obs.firstSeen).toISOString()}</td>
                    <td className="py-2 pr-4">{new Date(obs.lastSeen).toISOString()}</td>
                    <td className="py-2 pr-4">{obs.count}</td>
                    <td className="py-2 pr-4">{obs.persistenceDays} days</td>
                    <td className="py-2 pr-4">{obs.confidence}</td>
                    <td className="py-2 pr-4 text-gray-500">{obs.samplePath || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raw Data Access */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Raw‑but‑Safe Data Access</h3>
        <p className="text-sm text-gray-600 mb-4">Structured evidence only (no content, no identifiers). Export for verification and sharing.</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadJson}
            className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={!evidence}
          >
            Download JSON
          </button>
          <button
            onClick={downloadCsv}
            className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={!evidence?.observations}
          >
            Download CSV
          </button>
          <button
            onClick={() => window.open(`${apiBase}/site/${domain}/audit-report`, '_blank')}
            className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            disabled={!auditReport}
          >
            Download Audit Report
          </button>
        </div>
      </div>

      {/* Snapshot Comparison */}
      {snapshotDiff && (
        <div className="glass p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Snapshot Comparison</h3>
          <p className="text-sm text-gray-600">
            Snapshot observations: <span className="font-semibold">{snapshotDiff.snapshotCount}</span> · Current observations: <span className="font-semibold">{snapshotDiff.currentCount}</span> · Delta: <span className={`font-semibold ${snapshotDiff.delta > 0 ? 'text-red-600' : 'text-green-600'}`}>{snapshotDiff.delta > 0 ? '+' : ''}{snapshotDiff.delta}</span>
          </p>
        </div>
      )}
    </div>
  )
}
