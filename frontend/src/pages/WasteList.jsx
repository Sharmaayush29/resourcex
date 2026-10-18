import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Filter, Package, ShieldCheck, FileText,
  MapPin, Edit3, ArrowRight, Eye, RefreshCw
} from 'lucide-react'
import api from '../api'
import { useToast } from '../components/Toast'
import WasteForm from '../components/WasteForm'

export default function WasteList() {
  const { addToast } = useToast()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const res = await api.get('/waste/my')
      setBatches(res.data)
    } catch (err) {
      addToast('Failed to load waste listings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingBatch(null)
    setModalOpen(true)
  }

  const handleEdit = (batch) => {
    setEditingBatch(batch)
    setModalOpen(true)
  }

  const filteredBatches = batches.filter((b) => {
    const matchCategory = selectedCategory === 'all' || b.category === selectedCategory
    const matchSearch =
      b.material_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.waste_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  const renderVerificationBadge = (level) => {
    switch (level) {
      case 'evidence_verified':
        return <span className="verification-badge verification-evidence">Evidence Verified</span>
      case 'third_party_verified':
        return <span className="verification-badge verification-third-party">3rd-Party Audited</span>
      default:
        return <span className="verification-badge verification-self">Self Reported</span>
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Waste Passport Registry</h1>
          <p className="page-subtitle">
            Manage your factory's recyclable byproduct listings and digital passports
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          <Plus size={18} />
          Register Waste Batch
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'textile', 'plastic', 'metal', 'packaging', 'other'].map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(cat)}
              style={{ textTransform: 'capitalize' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search material, ID, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary btn-icon" onClick={fetchBatches} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Batches Grid */}
      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading your waste passports...</span>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="card empty-state">
          <Package size={52} color="var(--primary-400)" style={{ margin: '0 auto 16px' }} />
          <h3 className="empty-state-title">No Waste Passports Found</h3>
          <p className="empty-state-text">
            {batches.length === 0
              ? 'Start by creating your first waste passport to make your byproduct available on the marketplace.'
              : 'No waste batches match your filter criteria.'}
          </p>
          {batches.length === 0 && (
            <button className="btn btn-primary" onClick={handleCreateNew}>
              <Plus size={18} />
              Register Waste Batch
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {filteredBatches.map((batch) => (
            <div key={batch.id} className="passport-card animate-fade-in">
              <div className="passport-header">
                <span className="passport-id">{batch.waste_id}</span>
                {renderVerificationBadge(batch.verification_level)}
              </div>

              <div className="passport-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 className="passport-material">{batch.material_type}</h3>
                  <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                    {batch.category}
                  </span>
                </div>

                {batch.sub_type && (
                  <p className="text-muted text-xs" style={{ marginBottom: '12px' }}>
                    Type: {batch.sub_type}
                  </p>
                )}

                <div className="passport-detail">
                  <span className="passport-detail-label">Available Qty:</span>
                  <span className="passport-detail-value">
                    {batch.available_quantity?.toLocaleString()} {batch.unit}
                  </span>
                </div>

                <div className="passport-detail">
                  <span className="passport-detail-label">Purity:</span>
                  <span className="passport-detail-value">
                    {batch.purity_percentage ? `${batch.purity_percentage}%` : 'N/A'} ({batch.quality_grade || 'Standard'})
                  </span>
                </div>

                <div className="passport-detail">
                  <span className="passport-detail-label">Price:</span>
                  <span className="passport-detail-value" style={{ color: 'var(--primary-700)', fontWeight: 700 }}>
                    ₹{batch.price_per_unit} / {batch.unit}
                  </span>
                </div>

                <div className="passport-detail">
                  <span className="passport-detail-label">Location:</span>
                  <span className="passport-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="var(--gray-400)" />
                    {batch.location}
                  </span>
                </div>

                <div className="passport-detail">
                  <span className="passport-detail-label">Evidence Files:</span>
                  <span className="passport-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={13} color="var(--gray-400)" />
                    {batch.evidence_count || 0} document(s)
                  </span>
                </div>
              </div>

              <div className="passport-footer">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleEdit(batch)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit3 size={15} /> Edit
                </button>
                <Link
                  to={`/waste/${batch.id}`}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  View Passport <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <WasteForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchBatches}
        initialData={editingBatch}
      />
    </div>
  )
}
