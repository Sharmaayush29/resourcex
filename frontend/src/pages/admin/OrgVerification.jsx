import { useState, useEffect } from 'react'
import {
  Building2, CheckCircle2, XCircle, Clock, FileText,
  ExternalLink, AlertCircle, X, RefreshCw, ShieldCheck
} from 'lucide-react'
import api from '../../api'
import { useToast } from '../../components/Toast'

export default function OrgVerification() {
  const { addToast } = useToast()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')

  // Verification modal state
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [newStatus, setNewStatus] = useState('verified')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [statusFilter])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/admin/organizations', { params })
      setOrganizations(res.data)
    } catch (err) {
      addToast('Failed to load organizations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenVerifyModal = (org) => {
    setSelectedOrg(org)
    setNewStatus('verified')
    setNotes(org.verification_notes || '')
  }

  const handleVerifySubmit = async (e) => {
    e.preventDefault()
    if (newStatus === 'rejected' && !notes.trim()) {
      addToast('Please provide a reason when rejecting verification', 'error')
      return
    }

    setSubmitting(true)
    try {
      await api.put(`/admin/organizations/${selectedOrg.id}/verify`, {
        status: newStatus,
        notes: notes,
      })
      addToast(`Organization marked as '${newStatus}'`, 'success')
      setSelectedOrg(null)
      fetchOrganizations()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Verification decision failed'
      addToast(typeof msg === 'string' ? msg : 'Error verifying org', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Enterprise Identity Verification</h1>
          <p className="page-subtitle">
            Validate enterprise legitimacy, CIN / GST tax registration, and environmental certifications
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchOrganizations}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { label: 'Pending Verification', value: 'pending' },
          { label: 'Under Review', value: 'under_review' },
          { label: 'Verified Enterprises', value: 'verified' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'All Organizations', value: '' },
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
          <span className="text-muted">Loading enterprise documentation...</span>
        </div>
      ) : organizations.length === 0 ? (
        <div className="card empty-state">
          <Building2 size={48} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Organizations in this Queue</h3>
          <p className="empty-state-text">All company submissions for this filter state are processed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {organizations.map((org) => (
            <div key={org.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>
                      {org.company_name}
                    </h3>
                    <span
                      className={`badge ${
                        org.verification_status === 'verified'
                          ? 'badge-green'
                          : org.verification_status === 'rejected'
                          ? 'badge-red'
                          : 'badge-yellow'
                      }`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {org.verification_status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-muted text-xs">
                    {org.business_type} • Registered on {new Date(org.created_at).toLocaleDateString()}
                  </span>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenVerifyModal(org)}
                >
                  <ShieldCheck size={16} /> Audit & Decide
                </button>
              </div>

              {/* Org Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  padding: '14px 18px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <span className="text-muted text-xs" style={{ display: 'block' }}>Location</span>
                  <strong>{org.city}, {org.state} ({org.country})</strong>
                </div>

                <div>
                  <span className="text-muted text-xs" style={{ display: 'block' }}>Registration / CIN</span>
                  <strong>{org.registration_number || 'Not Submitted'}</strong>
                </div>

                <div>
                  <span className="text-muted text-xs" style={{ display: 'block' }}>Tax ID / GSTIN</span>
                  <strong>{org.tax_id || 'Not Submitted'}</strong>
                </div>

                <div>
                  <span className="text-muted text-xs" style={{ display: 'block' }}>Contact Person</span>
                  <strong>{org.contact_person}</strong>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <span className="text-muted text-xs" style={{ display: 'block', marginBottom: '8px' }}>
                  Compliance Files Attached ({org.documents?.length || 0}):
                </span>
                {org.documents && org.documents.length > 0 ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {org.documents.map((docPath, i) => (
                      <a
                        key={i}
                        href={docPath}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FileText size={13} /> Document #{i + 1} <ExternalLink size={11} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted text-xs">No documents uploaded.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Decision Modal */}
      {selectedOrg && (
        <div className="modal-overlay" onClick={() => setSelectedOrg(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Audit Organization Verification</h3>
                <span className="text-muted text-xs">{selectedOrg.company_name}</span>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setSelectedOrg(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleVerifySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Verification Outcome *</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="verified">Approve & Grant Verified Status</option>
                    <option value="under_review">Mark Under Review (Request More Info)</option>
                    <option value="rejected">Reject Verification Application</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Auditor Feedback & Notes {newStatus === 'rejected' && '* (Required)'}
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter compliance justification or list documents required for re-submission..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required={newStatus === 'rejected'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedOrg(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${newStatus === 'rejected' ? 'btn-danger' : 'btn-primary'}`}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Commit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
