import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Sparkles, MapPin, DollarSign,
  Package, CheckCircle2, ChevronRight, X, AlertCircle, Eye, ShoppingCart
} from 'lucide-react'
import api from '../api'
import { useToast } from '../components/Toast'

export default function BuyerRequirements() {
  const { addToast } = useToast()
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)

  // Direct Order from Match Modal
  const [selectedMatchBatch, setSelectedMatchBatch] = useState(null)
  const [orderQty, setOrderQty] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // Create Requirement Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newReq, setNewReq] = useState({
    category: 'textile',
    material_type: '',
    quantity: '',
    unit: 'kg',
    min_purity: 90,
    max_price_per_unit: '',
    max_distance_km: 250,
    frequency: 'regular',
    location: '',
    notes: '',
  })

  // Match Modal
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [activeReq, setActiveReq] = useState(null)
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(false)

  useEffect(() => {
    fetchRequirements()
  }, [])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const res = await api.get('/requirements/my')
      setRequirements(res.data)
    } catch (err) {
      addToast('Failed to load buyer requirements', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequirement = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/requirements', {
        ...newReq,
        quantity: parseFloat(newReq.quantity) || 0,
        min_purity: parseFloat(newReq.min_purity) || 0,
        max_price_per_unit: parseFloat(newReq.max_price_per_unit) || 0,
        max_distance_km: parseFloat(newReq.max_distance_km) || 0,
      })
      addToast('Buyer requirement created! Matching engine activated.', 'success')
      setModalOpen(false)
      setNewReq({
        category: 'textile',
        material_type: '',
        quantity: '',
        unit: 'kg',
        min_purity: 90,
        max_price_per_unit: '',
        max_distance_km: 250,
        frequency: 'regular',
        location: '',
        notes: '',
      })
      fetchRequirements()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create requirement'
      addToast(typeof msg === 'string' ? msg : 'Error creating requirement', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleFindMatches = async (req) => {
    setActiveReq(req)
    setMatchModalOpen(true)
    setLoadingMatches(true)
    try {
      const res = await api.get(`/match/${req.id}`)
      setMatches(res.data)
    } catch (err) {
      addToast('Error running matching algorithm', 'error')
    } finally {
      setLoadingMatches(false)
    }
  }

  const handleOpenMatchOrder = (batch) => {
    setSelectedMatchBatch(batch)
    setOrderQty(batch.available_quantity || '')
    setDeliveryLocation(activeReq?.location || '')
    setOrderNotes(`Procured via AI Match for requirement: ${activeReq?.material_type || ''}`)
  }

  const handlePlaceMatchOrder = async (e) => {
    e.preventDefault()
    setSubmittingOrder(true)
    try {
      await api.post('/orders/', {
        waste_batch_id: selectedMatchBatch.id,
        quantity: parseFloat(orderQty),
        delivery_location: deliveryLocation,
        notes: orderNotes,
      })
      addToast('Purchase order request sent to supplier factory!', 'success')
      setSelectedMatchBatch(null)
      setMatchModalOpen(false)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order'
      addToast(typeof msg === 'string' ? msg : 'Error requesting order', 'error')
    } finally {
      setSubmittingOrder(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Buyer Material Requirements</h1>
          <p className="page-subtitle">
            Declare feedstock criteria to trigger automated supplier matching and AI scorecards
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Post New Requirement
        </button>
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading procurement requirements...</span>
        </div>
      ) : requirements.length === 0 ? (
        <div className="card empty-state">
          <Sparkles size={48} color="var(--primary-400)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Active Requirements</h3>
          <p className="empty-state-text">
            Post your raw material specifications (quantity, purity, budget) and our algorithm will rank matching factory byproducts.
          </p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Post First Requirement
          </button>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '20px' }}>
          {requirements.map((req) => (
            <div key={req.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span className="badge badge-purple" style={{ textTransform: 'capitalize', marginBottom: '4px' }}>
                    {req.category}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                    {req.material_type}
                  </h3>
                </div>
                <span className="badge badge-green">Active Need</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0', fontSize: '0.875rem' }}>
                <div>
                  <span className="text-muted">Target Quantity:</span>
                  <div><strong>{req.quantity?.toLocaleString()} {req.unit}</strong></div>
                </div>
                <div>
                  <span className="text-muted">Min Purity:</span>
                  <div><strong>{req.min_purity}%</strong></div>
                </div>
                <div>
                  <span className="text-muted">Max Budget:</span>
                  <div><strong>₹{req.max_price_per_unit || 'Negotiable'} / {req.unit}</strong></div>
                </div>
                <div>
                  <span className="text-muted">Max Distance:</span>
                  <div><strong>{req.max_distance_km ? `${req.max_distance_km} km` : 'Anywhere'}</strong></div>
                </div>
              </div>

              {req.location && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="var(--primary-600)" /> Delivery to {req.location}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleFindMatches(req)}
              >
                <Sparkles size={16} /> Run Automated Matching
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Post Requirement Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Post Buyer Raw Material Need</h3>
              <button className="btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRequirement}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Material Category *</label>
                    <select
                      className="form-select"
                      value={newReq.category}
                      onChange={(e) => setNewReq({ ...newReq, category: e.target.value })}
                      required
                    >
                      <option value="textile">Textile</option>
                      <option value="plastic">Plastic</option>
                      <option value="metal">Metal</option>
                      <option value="packaging">Packaging</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Material Name / Specification *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 100% Cotton Waste, rPET Flakes"
                      value={newReq.material_type}
                      onChange={(e) => setNewReq({ ...newReq, material_type: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Needed Quantity *</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={newReq.quantity}
                      onChange={(e) => setNewReq({ ...newReq, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit of Measure *</label>
                    <select
                      className="form-select"
                      value={newReq.unit}
                      onChange={(e) => setNewReq({ ...newReq, unit: e.target.value })}
                      required
                    >
                      <option value="kg">kg</option>
                      <option value="tons">tons</option>
                      <option value="meters">meters</option>
                      <option value="units">units</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Minimum Purity (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-input"
                      value={newReq.min_purity}
                      onChange={(e) => setNewReq({ ...newReq, min_purity: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Price per Unit (₹)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="e.g. 45"
                      value={newReq.max_price_per_unit}
                      onChange={(e) => setNewReq({ ...newReq, max_price_per_unit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Delivery Location</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="City, State"
                      value={newReq.location}
                      onChange={(e) => setNewReq({ ...newReq, location: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Sourcing Radius (km)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newReq.max_distance_km}
                      onChange={(e) => setNewReq({ ...newReq, max_distance_km: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Quality Requirements & Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Contamination tolerance, continuous procurement schedule, packaging..."
                    value={newReq.notes}
                    onChange={(e) => setNewReq({ ...newReq, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Saving...' : 'Post Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Results Modal */}
      {matchModalOpen && (
        <div className="modal-overlay" onClick={() => setMatchModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles color="var(--primary-600)" size={20} />
                  Matching Waste Streams
                </h3>
                <p className="text-muted text-xs">
                  Ranking for {activeReq?.material_type} ({activeReq?.quantity} {activeReq?.unit})
                </p>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setMatchModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {loadingMatches ? (
                <div className="loading-screen" style={{ minHeight: '200px' }}>
                  <div className="loader"></div>
                  <span className="text-muted">Computing semantic & property similarity vectors...</span>
                </div>
              ) : matches.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <AlertCircle size={40} color="var(--gray-400)" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>No Close Matches Found</h4>
                  <p className="text-muted text-xs">
                    No active supplier batches currently meet the score threshold for this requirement.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {matches.map((item, idx) => {
                    const batch = item.waste_batch
                    const score = item.match_score

                    return (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--gray-200)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '16px 20px',
                          background: 'var(--bg-primary)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span className="text-muted text-xs" style={{ fontFamily: 'monospace' }}>
                              {batch.waste_id}
                            </span>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '2px 0' }}>
                              {batch.material_type}
                            </h4>
                            <span className="text-muted text-xs">
                              Supplier: <strong>{batch.organization_name || 'Verified Supplier'}</strong>
                            </span>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-full)',
                                fontWeight: 800,
                                fontSize: '0.875rem',
                                background: score >= 75 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: score >= 75 ? '#93c5fd' : '#fde68a',
                                border: score >= 75 ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                                boxShadow: score >= 75 ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none',
                              }}
                            >
                              {score}% Match
                            </span>
                          </div>
                        </div>

                        {/* Breakdown pills */}
                        {item.score_breakdown && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' }}>
                            {Object.entries(item.score_breakdown).map(([k, v]) => (
                              <span
                                key={k}
                                style={{
                                  fontSize: '0.6875rem',
                                  padding: '2px 8px',
                                  background: 'var(--bg-secondary)',
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--gray-600)',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {k.replace('_', ' ')}: {v}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--gray-100)', fontSize: '0.875rem' }}>
                          <div>
                            <span className="text-muted">Stock: </span>
                            <strong>{batch.available_quantity} {batch.unit}</strong> •{' '}
                            <span className="text-muted">Price: </span>
                            <strong>₹{batch.price_per_unit}/{batch.unit}</strong>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link
                              to={`/waste/${batch.id}`}
                              className="btn btn-secondary btn-sm"
                              onClick={() => setMatchModalOpen(false)}
                            >
                              <Eye size={14} /> View Passport
                            </Link>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenMatchOrder(batch)}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <ShoppingCart size={14} /> Procure Material
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMatchModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Order from Match Modal */}
      {selectedMatchBatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatchBatch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Procure Matched Raw Material</h3>
                <span className="text-muted text-xs">{selectedMatchBatch.material_type} ({selectedMatchBatch.waste_id})</span>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setSelectedMatchBatch(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePlaceMatchOrder}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Order Quantity ({selectedMatchBatch.unit}) *</label>
                  <input
                    type="number"
                    step="any"
                    max={selectedMatchBatch.available_quantity}
                    className="form-input"
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    required
                  />
                  <span className="text-muted text-xs">
                    Available: {selectedMatchBatch.available_quantity} {selectedMatchBatch.unit}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Destination (Receiving Plant Address) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter destination factory address"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Procurement & Packaging Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Provide special logistics, palletizing or testing instructions..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>

                <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="text-muted text-sm">Estimated Material Total:</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--gray-900)' }}>
                      ₹{((parseFloat(orderQty) || 0) * (selectedMatchBatch.price_per_unit || 0)).toLocaleString()}
                    </strong>
                  </div>
                  <span className="text-muted text-xs">
                    Unit rate: ₹{selectedMatchBatch.price_per_unit} / {selectedMatchBatch.unit}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedMatchBatch(null)}
                  disabled={submittingOrder}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingOrder}>
                  {submittingOrder ? 'Submitting...' : 'Send Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
