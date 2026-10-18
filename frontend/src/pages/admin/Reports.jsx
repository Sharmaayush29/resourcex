import { useState, useEffect } from 'react'
import {
  AlertTriangle, ShieldAlert, CheckCircle2, Clock,
  FileText, X, RefreshCw, MessageSquare
} from 'lucide-react'
import api from '../../api'
import { useToast } from '../../components/Toast'

export default function Reports() {
  const { addToast } = useToast()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')

  // Action modal
  const [selectedReport, setSelectedReport] = useState(null)
  const [actionType, setActionType] = useState('investigate')
  const [actionNotes, setActionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [statusFilter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/admin/reports', { params })
      setReports(res.data)
    } catch (err) {
      addToast('Failed to load dispute reports', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAction = (report) => {
    setSelectedReport(report)
    setActionType('investigate')
    setActionNotes(report.admin_notes || '')
  }

  const handleActionSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.put(`/admin/reports/${selectedReport.id}`, {
        action: actionType,
        notes: actionNotes,
      })
      addToast(`Action '${actionType}' recorded for report`, 'success')
      setSelectedReport(null)
      fetchReports()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update report'
      addToast(typeof msg === 'string' ? msg : 'Error resolving report', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <span className="badge badge-green"><CheckCircle2 size={13} /> {status}</span>
      case 'investigating':
        return <span className="badge badge-blue"><Clock size={13} /> Investigating</span>
      case 'warned':
        return <span className="badge badge-yellow"><AlertTriangle size={13} /> Warning Issued</span>
      default:
        return <span className="badge badge-red"><AlertTriangle size={13} /> Open</span>
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Dispute Resolution & Grievance Moderation</h1>
          <p className="page-subtitle">
            Investigate complaints regarding material quality discrepancies, misleading listings, and delivery defaults
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchReports}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { label: 'Open Reports', value: 'open' },
          { label: 'Under Investigation', value: 'investigating' },
          { label: 'Warning Issued', value: 'warned' },
          { label: 'Resolved / Closed', value: 'resolved' },
          { label: 'All Reports', value: '' },
        ].map((tab) => (
          <button
            key={tab.value}
            className={`btn btn-sm ${statusFilter === tab.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading incident reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="card empty-state">
          <CheckCircle2 size={48} color="var(--primary-400)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Incident Reports</h3>
          <p className="empty-state-text">No active disputes or grievances found in this queue.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((report) => (
            <div key={report.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-red" style={{ textTransform: 'capitalize' }}>
                      {report.reason?.replace('_', ' ')}
                    </span>
                    {renderStatusBadge(report.status)}
                  </div>
                  <span className="text-muted text-xs">
                    Target: {report.target_type} ({report.target_id}) • Filed on {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenAction(report)}
                >
                  <MessageSquare size={14} /> Moderate Report
                </button>
              </div>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '14px',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  color: 'var(--gray-800)',
                }}
              >
                <strong>Complaint Details: </strong>
                {report.description}
              </div>

              {report.admin_notes && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                  <span className="text-muted">Moderator Notes: </span>
                  <em>"{report.admin_notes}"</em>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Moderate Dispute Incident</h3>
              <button className="btn-ghost btn-icon" onClick={() => setSelectedReport(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleActionSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Moderation Action *</label>
                  <select
                    className="form-select"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    required
                  >
                    <option value="investigate">Mark Under Investigation</option>
                    <option value="warn">Issue Official Warning to Target Party</option>
                    <option value="resolve">Resolve Dispute (Action Completed)</option>
                    <option value="close">Close / Dismiss Report as Unsubstantiated</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Investigation Findings & Resolution Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter evidence reviewed, user contact history, and disciplinary decisions..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedReport(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Applying...' : 'Apply Moderation Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
