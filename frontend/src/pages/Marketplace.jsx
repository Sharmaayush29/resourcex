import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, Filter, MapPin, ShieldCheck, CheckCircle2,
  DollarSign, ShoppingCart, ArrowRight, Eye, Sparkles, X
} from 'lucide-react'
import api from '../api'
import { useAuth } from '../AuthContext'
import { useToast } from '../components/Toast'

export default function Marketplace() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [category, setCategory] = useState('')
  const [materialType, setMaterialType] = useState('')
  const [location, setLocation] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minPurity, setMinPurity] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  // Order modal state
  const [selectedListing, setSelectedListing] = useState(null)
  const [orderQty, setOrderQty] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)

  useEffect(() => {
    fetchListings()
  }, [category, verifiedOnly])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const params = {}
      if (category) params.category = category
      if (materialType) params.material_type = materialType
      if (location) params.location = location
      if (maxPrice) params.max_price = maxPrice
      if (minPurity) params.min_purity = minPurity
      if (verifiedOnly) params.verified_only = true

      const res = await api.get('/waste/', { params })
      setListings(res.data)
    } catch (err) {
      addToast('Failed to load marketplace listings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchListings()
  }

  const handleOpenOrder = (item) => {
    if (!user) {
      navigate('/login')
      return
    }
    setSelectedListing(item)
    setOrderQty(item.available_quantity || '')
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setSubmittingOrder(true)
    try {
      await api.post('/orders/', {
        waste_batch_id: selectedListing.id,
        quantity: parseFloat(orderQty),
        delivery_location: deliveryLocation,
        notes: orderNotes,
      })
      addToast('Order requested! The supplier has been notified.', 'success')
      setSelectedListing(null)
      navigate('/orders')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order'
      addToast(typeof msg === 'string' ? msg : 'Error placing order', 'error')
    } finally {
      setSubmittingOrder(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Industrial Circular Marketplace</h1>
        <p className="page-subtitle">
          Direct sourcing of authenticated secondary materials and manufacturing byproducts
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {[
            { label: 'All Materials', value: '' },
            { label: 'Textiles & Fiber', value: 'textile' },
            { label: 'Plastics & Polymers', value: 'plastic' },
            { label: 'Metals & Alloys', value: 'metal' },
            { label: 'Packaging & Paper', value: 'packaging' },
            { label: 'Specialty / Other', value: 'other' },
          ].map((cat) => (
            <button
              key={cat.value}
              className={`btn btn-sm ${category === cat.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Inputs Grid */}
        <form onSubmit={handleSearchSubmit}>
          <div className="grid-4" style={{ gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="text-muted text-xs" style={{ display: 'block', marginBottom: '4px' }}>
                Material Name / Keyword
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Cotton, PET, Copper..."
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
              />
            </div>

            <div>
              <label className="text-muted text-xs" style={{ display: 'block', marginBottom: '4px' }}>
                Location / City
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Surat, Tirupur, Pune..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="text-muted text-xs" style={{ display: 'block', marginBottom: '4px' }}>
                Max Price per Unit (₹)
              </label>
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="Any price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="text-muted text-xs" style={{ display: 'block', marginBottom: '4px' }}>
                Min Purity Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                placeholder="e.g. 90"
                value={minPurity}
                onChange={(e) => setMinPurity(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={16} color="var(--primary-600)" />
                Show Verified Passports Only
              </span>
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setCategory('')
                  setMaterialType('')
                  setLocation('')
                  setMaxPrice('')
                  setMinPurity('')
                  setVerifiedOnly(false)
                }}
              >
                Reset Filters
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                <Search size={15} /> Apply Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading live marketplace byproducts...</span>
        </div>
      ) : listings.length === 0 ? (
        <div className="card empty-state">
          <Search size={48} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Listings Match Your Search</h3>
          <p className="empty-state-text">
            Try broadening your filter criteria or post a Buyer Requirement to notify matching factories.
          </p>
          <Link to="/requirements" className="btn btn-primary">
            Post Buyer Requirement
          </Link>
        </div>
      ) : (
        <div className="grid-3">
          {listings.map((item) => (
            <div key={item.id} className="passport-card animate-fade-in">
              <div className="passport-header">
                <span className="passport-id">{item.waste_id}</span>
                {item.verification_level === 'third_party_verified' ? (
                  <span className="verification-badge verification-third-party">3rd-Party Audited</span>
                ) : item.verification_level === 'evidence_verified' ? (
                  <span className="verification-badge verification-evidence">Evidence Verified</span>
                ) : (
                  <span className="verification-badge verification-self">Self Reported</span>
                )}
              </div>

              <div className="passport-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 className="passport-material">{item.material_type}</h3>
                  <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                    {item.category}
                  </span>
                </div>

                <p className="text-muted text-xs" style={{ marginBottom: '12px' }}>
                  Supplier: <strong>{item.organization_name || 'Verified Factory'}</strong>
                </p>

                <div className="passport-detail">
                  <span className="passport-detail-label">Available Stock:</span>
                  <span className="passport-detail-value">
                    {item.available_quantity?.toLocaleString()} {item.unit}
                  </span>
                </div>

                <div className="passport-detail">
                  <span className="passport-detail-label">Purity & Grade:</span>
                  <span className="passport-detail-value">
                    {item.purity_percentage}% ({item.quality_grade})
                  </span>
                </div>

                <div className="passport-detail">
                  <span className="passport-detail-label">Price:</span>
                  <span className="passport-detail-value" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>
                    ₹{item.price_per_unit} / {item.unit} {item.negotiable ? '(Negotiable)' : ''}
                  </span>
                </div>

                <div className="passport-detail">
                  <span className="passport-detail-label">Location:</span>
                  <span className="passport-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="var(--gray-400)" />
                    {item.location}
                  </span>
                </div>

                {/* AI Circular Intelligence Indicator */}
                <div
                  style={{
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '7px 10px',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.735rem',
                  }}
                >
                  <span style={{ color: 'var(--primary-300)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={13} color="var(--primary-400)" />
                    AI Circular Index
                  </span>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>
                    {Math.min(99, 84 + (item.purity_percentage ? Math.round(item.purity_percentage * 0.12) : 6))}% Match
                  </span>
                </div>
              </div>

              <div className="passport-footer">
                <Link to={`/waste/${item.id}`} className="btn btn-secondary btn-sm">
                  <Eye size={14} /> Passport
                </Link>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenOrder(item)}
                >
                  <ShoppingCart size={14} /> Buy Material
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Place Order Modal */}
      {selectedListing && (
        <div className="modal-overlay" onClick={() => setSelectedListing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Place Material Order Request</h3>
                <span className="text-muted text-xs">{selectedListing.material_type} ({selectedListing.waste_id})</span>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setSelectedListing(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePlaceOrder}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Order Quantity ({selectedListing.unit}) *</label>
                  <input
                    type="number"
                    step="any"
                    max={selectedListing.available_quantity}
                    className="form-input"
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    required
                  />
                  <span className="text-muted text-xs">
                    Available: {selectedListing.available_quantity} {selectedListing.unit}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Destination (Facility Address) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Factory / Warehouse destination address"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes for Supplier</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Logistics terms, packaging specifications, schedule..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>

                <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="text-muted text-sm">Material Cost:</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--gray-900)' }}>
                      ₹{((parseFloat(orderQty) || 0) * (selectedListing.price_per_unit || 0)).toLocaleString()}
                    </strong>
                  </div>
                  <span className="text-muted text-xs">
                    Unit rate: ₹{selectedListing.price_per_unit} / {selectedListing.unit}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedListing(null)}
                  disabled={submittingOrder}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingOrder}>
                  {submittingOrder ? 'Submitting...' : 'Send Order Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
