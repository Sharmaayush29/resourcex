import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, ShieldCheck, CheckCircle2, XCircle,
  Eye, RefreshCw, X, AlertCircle
} from 'lucide-react'
import api from '../../api'
import { useToast } from '../../components/Toast'

export default function ListingVerification() {
  const { addToast } = useToast()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterState, setFilterState] = useState('unverified')

  // Modal
  const [selectedListing, setSelectedListing] = useState(null)
  const [verifyDecision, setVerifyDecision] = useState(true)
  const [decisionNotes, setDecisionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchListings()
  }, [filterState])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterState === 'unverified') params.verified = false
      if (filterState === 'verified') params.verified = true

      const res = await api.get('/admin/listings', { params })
      setListings(res.data)
    } catch (err) {
      addToast('Failed to load waste listings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDecision = (item, isVerify) => {
    setSelectedListing(item)
    setVerifyDecision(isVerify)
    setDecisionNotes('')
  }

  const handleDecisionSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.put(`/admin/listings/${selectedListing.id}/verify`, {
        verified: verifyDecision,
        notes: decisionNotes,
      })
      addToast(`Listing ${verifyDecision ? 'verified' : 'rejected / unverified'}`, 'success')
      setSelectedListing(null)
      fetchListings()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update listing verification'
      addToast(typeof msg === 'string' ? msg : 'Error verifying listing', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Waste Passport Verification Audit</h1>
          <p className="page-subtitle">
            Validate technical material parameters, purity assertions, and physical weighbridge proofs
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchListings}>
          <RefreshCw size={16} /> Refresh Listings
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { label: 'Unverified Queued Listings', value: 'unverified' },
          { label: 'Verified Passports', value: 'verified' },
          { label: 'All Listings', value: 'all' },
        ].map((tab) => (
          <button
            key={tab.value}
            className={`btn btn-sm ${filterState === tab.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterState(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading byproduct records...</span>
        </div>
      ) : listings.length === 0 ? (
        <div className="card empty-state">
          <Package size={48} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Listings in this Queue</h3>
          <p className="empty-state-text">All waste batches matching this filter have been audited.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Waste Passport ID</th>
                <th>Material Specification</th>
                <th>Supplier Company</th>
                <th>Available Qty</th>
                <th>Price / Unit</th>
                <th>Verification State</th>
                <th style={{ textAlign: 'right' }}>Audit Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-800)' }}>
                      {item.waste_id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.material_type}</div>
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                      {item.category}
                    </span>
                  </td>
                  <td>{item.organization_name || 'Registered Factory'}</td>
                  <td>
                    {item.available_quantity?.toLocaleString()} {item.unit}
                  </td>
                  <td>₹{item.price_per_unit}/{item.unit}</td>
                  <td>
                    {item.listing_verified ? (
                      <span className="badge badge-green">Verified</span>
                    ) : (
                      <span className="badge badge-yellow">Unverified</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Link to={`/waste/${item.id}`} className="btn btn-secondary btn-sm" title="View Details">
                        <Eye size={14} /> View
                      </Link>
                      {!item.listing_verified ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenDecision(item, true)}
                        >
                          <CheckCircle2 size={14} /> Verify
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenDecision(item, false)}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision Modal */}
      {selectedListing && (
        <div className="modal-overlay" onClick={() => setSelectedListing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {verifyDecision ? 'Verify Waste Passport' : 'Revoke Verification'}
                </h3>
                <span className="text-muted text-xs">{selectedListing.waste_id} — {selectedListing.material_type}</span>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setSelectedListing(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDecisionSubmit}>
              <div className="modal-body">
                <p className="text-sm" style={{ marginBottom: '14px', color: 'var(--gray-700)' }}>
                  {verifyDecision
                    ? 'Confirming verification will display the official "Verified by ReSourceX" badge on this listing in the marketplace.'
                    : 'Revoking verification will remove the platform trust badge from this listing.'}
                </p>

                <div className="form-group">
                  <label className="form-label">Audit Notes & Justification</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter observations regarding purity documents, composition tests, or reason for revocation..."
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedListing(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${verifyDecision ? 'btn-primary' : 'btn-danger'}`}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : verifyDecision ? 'Approve Verification' : 'Confirm Revoke'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
