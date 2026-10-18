import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, ShieldCheck, FileText, Image as ImageIcon,
  MapPin, Calendar, Clock, DollarSign, Upload, CheckCircle2,
  AlertTriangle, ShoppingCart, Share2, Printer, X
} from 'lucide-react'
import api from '../api'
import { useAuth } from '../AuthContext'
import { useToast } from '../components/Toast'

export default function WastePassport() {
  const { batchId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()

  const [batch, setBatch] = useState(null)
  const [evidenceList, setEvidenceList] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)

  // Evidence Form State
  const [evidenceType, setEvidenceType] = useState('photo')
  const [evidenceDesc, setEvidenceDesc] = useState('')
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [uploadingEvidence, setUploadingEvidence] = useState(false)

  // Image Upload State
  const [uploadingImages, setUploadingImages] = useState(false)

  // Order Form State
  const [orderQty, setOrderQty] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)

  useEffect(() => {
    fetchData()
  }, [batchId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [batchRes, evidenceRes] = await Promise.all([
        api.get(`/waste/${batchId}`),
        api.get(`/waste/${batchId}/evidence`),
      ])
      setBatch(batchRes.data)
      setEvidenceList(evidenceRes.data)
      setOrderQty(batchRes.data.available_quantity || '')
    } catch (err) {
      addToast('Failed to load Waste Passport', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadEvidence = async (e) => {
    e.preventDefault()
    if (!evidenceFile) {
      addToast('Please select a file to upload', 'error')
      return
    }

    setUploadingEvidence(true)
    const formData = new FormData()
    formData.append('evidence_type', evidenceType)
    if (evidenceDesc) formData.append('description', evidenceDesc)
    formData.append('file', evidenceFile)

    try {
      await api.post(`/waste/${batch.id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      addToast('Evidence document verified and attached to passport!', 'success')
      setEvidenceModalOpen(false)
      setEvidenceFile(null)
      setEvidenceDesc('')
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Evidence upload failed'
      addToast(typeof msg === 'string' ? msg : 'Error uploading evidence', 'error')
    } finally {
      setUploadingEvidence(false)
    }
  }

  const handleUploadImages = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      await api.post(`/waste/${batch.id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      addToast('Batch photos added to passport!', 'success')
      fetchData()
    } catch (err) {
      addToast('Failed to upload photos', 'error')
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setPlacingOrder(true)
    try {
      await api.post('/orders/', {
        waste_batch_id: batch.id,
        quantity: parseFloat(orderQty),
        delivery_location: deliveryLocation,
        notes: orderNotes,
      })
      addToast('Purchase order requested successfully!', 'success')
      setOrderModalOpen(false)
      navigate('/orders')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order'
      addToast(typeof msg === 'string' ? msg : 'Order failed', 'error')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <span className="text-muted">Fetching digital passport cryptographic records...</span>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="page-content">
        <div className="card empty-state">
          <h3>Waste Passport Not Found</h3>
          <p className="text-muted">The requested passport could not be located or has been archived.</p>
          <Link to="/waste" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Back to Registry
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Navigation & Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={16} /> Print Passport
          </button>
          {user?.role === 'buyer' && (
            <button className="btn btn-primary btn-sm" onClick={() => setOrderModalOpen(true)}>
              <ShoppingCart size={16} /> Request Material / Order
            </button>
          )}
        </div>
      </div>

      {/* Waste Passport Hero Card */}
      <div
        className="card"
        style={{
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)',
          marginBottom: '24px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '24px 32px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            color: 'var(--gray-950)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8125rem', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', color: 'var(--primary-500)' }}>
                Digital Waste Passport
              </span>
              {batch.listing_verified && (
                <span className="badge badge-green">
                  <CheckCircle2 size={13} /> Verified by ReSourceX Admin
                </span>
              )}
            </div>
            <h1 style={{ color: 'var(--gray-950)', fontSize: '1.75rem', margin: 0, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
              {batch.waste_id}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {batch.verification_level === 'third_party_verified' ? (
              <span className="badge badge-blue" style={{ padding: '6px 14px', fontSize: '0.875rem' }}>
                3rd-Party Audited
              </span>
            ) : batch.verification_level === 'evidence_verified' ? (
              <span className="badge badge-green" style={{ padding: '6px 14px', fontSize: '0.875rem' }}>
                Evidence Verified
              </span>
            ) : (
              <span className="badge badge-yellow" style={{ padding: '6px 14px', fontSize: '0.875rem' }}>
                Self Reported
              </span>
            )}
          </div>
        </div>

        <div className="card-body" style={{ padding: '32px' }}>
          <div className="grid-2" style={{ gap: '32px' }}>
            <div>
              <span className="badge badge-purple" style={{ textTransform: 'capitalize', marginBottom: '8px' }}>
                {batch.category} Byproduct
              </span>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{batch.material_type}</h2>
              {batch.sub_type && (
                <p style={{ color: 'var(--gray-600)', fontWeight: 500, marginBottom: '16px' }}>
                  Specification / Variant: {batch.sub_type}
                </p>
              )}
              <p style={{ color: 'var(--gray-700)', lineHeight: '1.6', marginBottom: '20px' }}>
                {batch.description || 'No detailed origin description provided.'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '12px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div className="text-muted text-xs">Origin Supplier</div>
                  <strong style={{ fontSize: '0.9375rem' }}>{batch.organization_name || 'Registered Factory'}</strong>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '12px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div className="text-muted text-xs">Location</div>
                  <strong style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} color="var(--primary-600)" /> {batch.location}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--gray-900)' }}>
                Material Properties & Pricing
              </h3>

              <div className="passport-detail">
                <span className="passport-detail-label">Available Inventory:</span>
                <span className="passport-detail-value" style={{ fontSize: '1.125rem', color: 'var(--primary-700)' }}>
                  {batch.available_quantity?.toLocaleString()} {batch.unit}
                </span>
              </div>
              <div className="passport-detail">
                <span className="passport-detail-label">Original Batch Size:</span>
                <span className="passport-detail-value">{batch.quantity?.toLocaleString()} {batch.unit}</span>
              </div>
              <div className="passport-detail">
                <span className="passport-detail-label">Chemical/Physical Purity:</span>
                <span className="passport-detail-value">{batch.purity_percentage}%</span>
              </div>
              <div className="passport-detail">
                <span className="passport-detail-label">Quality Grade:</span>
                <span className="passport-detail-value">{batch.quality_grade}</span>
              </div>
              <div className="passport-detail">
                <span className="passport-detail-label">Unit Price:</span>
                <span className="passport-detail-value" style={{ fontSize: '1.25rem', color: 'var(--gray-900)' }}>
                  ₹{batch.price_per_unit} / {batch.unit} {batch.negotiable ? '(Negotiable)' : '(Fixed)'}
                </span>
              </div>
              <div className="passport-detail">
                <span className="passport-detail-label">Stream Frequency:</span>
                <span className="passport-detail-value" style={{ textTransform: 'capitalize' }}>
                  {batch.frequency?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Images & Evidence Tabs/Grids */}
      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Evidence Documents Section */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--primary-600)" />
              Verification Evidence Documents ({evidenceList.length})
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setEvidenceModalOpen(true)}>
              <Upload size={15} /> Upload Evidence
            </button>
          </div>
          <div className="card-body">
            {evidenceList.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <FileText size={36} color="var(--gray-400)" style={{ margin: '0 auto 8px' }} />
                <p className="text-muted text-sm">
                  No verified evidence documents attached yet. Upload weighing slips, lab purity tests, or production records to increase trust.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--gray-200)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
                          {ev.evidence_type?.replace('_', ' ')}
                        </span>
                        <strong style={{ fontSize: '0.875rem' }}>{ev.file_name}</strong>
                      </div>
                      {ev.description && <p className="text-muted text-xs">{ev.description}</p>}
                      <span className="text-muted text-xs">
                        Uploaded on {new Date(ev.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>

                    <a
                      href={ev.file_path}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Batch Photos Section */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} color="var(--primary-600)" />
              Material Photos ({batch.images?.length || 0})
            </h3>
            <label className="btn btn-secondary btn-sm" style={{ cursor: uploadingImages ? 'not-allowed' : 'pointer' }}>
              <Upload size={15} /> {uploadingImages ? 'Uploading...' : 'Add Photos'}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUploadImages}
                disabled={uploadingImages}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div className="card-body">
            {(!batch.images || batch.images.length === 0) ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <ImageIcon size={36} color="var(--gray-400)" style={{ margin: '0 auto 8px' }} />
                <p className="text-muted text-sm">
                  No visual photos uploaded for this waste stream. Visual evidence improves buyer engagement.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {batch.images.map((imgUrl, i) => (
                  <a
                    key={i}
                    href={imgUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'block',
                      aspectRatio: '1',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--gray-200)',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Batch photo ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Evidence Modal */}
      {evidenceModalOpen && (
        <div className="modal-overlay" onClick={() => setEvidenceModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Upload Verification Evidence</h3>
              <button className="btn-ghost btn-icon" onClick={() => setEvidenceModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUploadEvidence}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Evidence Category *</label>
                  <select
                    className="form-select"
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    required
                  >
                    <option value="photo">Physical Material Photo</option>
                    <option value="weighing_record">Weighbridge / Scale Slip</option>
                    <option value="production_record">Factory Production / Scrap Log</option>
                    <option value="quality_report">Laboratory Purity / Quality Report</option>
                    <option value="purchase_record">Original Raw Material Invoice</option>
                    <option value="scrap_sale_record">Historical Scrap Sale Manifest</option>
                    <option value="other">Other Official Document</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Document Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Weighbridge certificate from calibrated scale"
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attach File (PDF, PNG, JPG) *</label>
                  <input
                    type="file"
                    className="form-input"
                    onChange={(e) => setEvidenceFile(e.target.files[0])}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEvidenceModalOpen(false)}
                  disabled={uploadingEvidence}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingEvidence}>
                  {uploadingEvidence ? 'Uploading...' : 'Submit Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Place Order Modal */}
      {orderModalOpen && (
        <div className="modal-overlay" onClick={() => setOrderModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Request Material Purchase Order</h3>
              <button className="btn-ghost btn-icon" onClick={() => setOrderModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePlaceOrder}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Requested Quantity ({batch.unit}) *</label>
                  <input
                    type="number"
                    step="any"
                    max={batch.available_quantity}
                    className="form-input"
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    required
                  />
                  <span className="text-muted text-xs">Max available: {batch.available_quantity} {batch.unit}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Location (Destination Facility) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ahmedabad Plant #4, GIDC Vatva"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Special Notes / Packaging Requirements</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Instructions regarding palletizing, delivery time window, logistics preferences..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>

                <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="text-muted text-sm">Estimated Material Cost:</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--gray-900)' }}>
                      ₹{((parseFloat(orderQty) || 0) * (batch.price_per_unit || 0)).toLocaleString()}
                    </strong>
                  </div>
                  <span className="text-muted text-xs">
                    Transportation and applicable tax terms will be confirmed upon supplier acceptance.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setOrderModalOpen(false)}
                  disabled={placingOrder}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={placingOrder}>
                  {placingOrder ? 'Submitting...' : 'Send Purchase Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
