import { useState, useEffect } from 'react'
import {
  FileText, Shield, Search, RefreshCw, Filter,
  Calendar, UserCheck, Lock
} from 'lucide-react'
import api from '../../api'
import { useToast } from '../../components/Toast'

export default function AuditLogs() {
  const { addToast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [actionFilter, setActionFilter] = useState('')
  const [targetTypeFilter, setTargetTypeFilter] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [targetTypeFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = {}
      if (actionFilter) params.action = actionFilter
      if (targetTypeFilter) params.target_type = targetTypeFilter

      const res = await api.get('/admin/audit-logs', { params })
      setLogs(res.data)
    } catch (err) {
      addToast('Failed to load audit trail', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchLogs()
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title">Immutable Platform Audit Trail</h1>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> Cryptographically Chained
            </span>
          </div>
          <p className="page-subtitle">
            Tamper-proof record of all executive decisions, compliance audits, and sanction events
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs}>
          <RefreshCw size={16} /> Refresh Log
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ flex: '2 1 240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by action keyword (e.g. verify, blocked, listing)..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <select
              className="form-select"
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
            >
              <option value="">All Target Types</option>
              <option value="organization">Organization</option>
              <option value="user">User Account</option>
              <option value="waste_batch">Waste Batch</option>
              <option value="report">Report / Dispute</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            <Search size={16} /> Filter Logs
          </button>
        </form>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading audit entries...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="card empty-state">
          <Shield size={48} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Audit Records Found</h3>
          <p className="empty-state-text">No recorded events matching your current filter.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action Performed</th>
                <th>Target Resource</th>
                <th>Justification / Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                    <div style={{ fontWeight: 600 }}>{new Date(log.created_at).toLocaleDateString()}</div>
                    <div className="text-muted text-xs">{new Date(log.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.admin_name || 'System Admin'}</div>
                    <span className="text-muted text-xs" style={{ fontFamily: 'monospace' }}>
                      {log.admin_id?.slice(0, 8)}...
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        log.action.includes('block') || log.action.includes('reject')
                          ? 'badge-red'
                          : log.action.includes('verify')
                          ? 'badge-green'
                          : 'badge-blue'
                      }`}
                      style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                      {log.target_type}
                    </span>
                    <div className="text-muted text-xs" style={{ fontFamily: 'monospace', marginTop: '2px' }}>
                      {log.target_id?.slice(0, 12)}...
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-800)' }}>
                      {log.reason || 'Routine compliance execution'}
                    </div>
                    {log.details && (
                      <div className="text-muted text-xs" style={{ fontFamily: 'monospace', marginTop: '2px' }}>
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
