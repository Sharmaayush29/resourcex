import { useState } from 'react'
import { X, Plus, AlertCircle } from 'lucide-react'
import api from '../api'
import { useToast } from './Toast'

export default function WasteForm({ isOpen, onClose, onSuccess, initialData = null }) {
  const { addToast } = useToast()
  const isEdit = Boolean(initialData?.id)

  const [formData, setFormData] = useState({
    category: initialData?.category || 'textile',
    material_type: initialData?.material_type || '',
    sub_type: initialData?.sub_type || '',
    description: initialData?.description || '',
    quantity: initialData?.quantity || '',
    unit: initialData?.unit || 'kg',
    purity_percentage: initialData?.purity_percentage ?? 95,
    quality_grade: initialData?.quality_grade || 'Grade A',
    quality_notes: initialData?.quality_notes || '',
    location: initialData?.location || '',
    available_from: initialData?.available_from?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    frequency: initialData?.frequency || 'regular',
    price_per_unit: initialData?.price_per_unit || '',
    currency: initialData?.currency || 'INR',
    negotiable: initialData?.negotiable ?? true,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        purity_percentage: parseFloat(formData.purity_percentage) || 0,
        price_per_unit: parseFloat(formData.price_per_unit) || 0,
        available_from: formData.available_from ? new Date(formData.available_from).toISOString() : new Date().toISOString(),
      }

      if (isEdit) {
        await api.put(`/waste/${initialData.id}`, payload)
        addToast('Waste passport updated successfully', 'success')
      } else {
        await api.post('/waste/', payload)
        addToast('Waste batch registered with Waste Passport ID!', 'success')
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save waste batch. Please check all fields.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      addToast(typeof msg === 'string' ? msg : 'Error saving batch', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {isEdit ? 'Edit Waste Passport' : 'Register New Waste Batch'}
            </h3>
            <p className="text-muted text-xs">
              Generate a verifiable Digital Waste Passport for raw material circularity
            </p>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: '#fef2f2',
                  color: 'var(--error)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.875rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
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
                <label className="form-label">Material Type *</label>
                <input
                  type="text"
                  name="material_type"
                  className="form-input"
                  placeholder="e.g. Cotton 100%, HDPE, Copper"
                  value={formData.material_type}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sub-Type / Variant</label>
                <input
                  type="text"
                  name="sub_type"
                  className="form-input"
                  placeholder="e.g. Combed clips, Pellets, Shavings"
                  value={formData.sub_type}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location (City / State) *</label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="e.g. Surat, Gujarat"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Material Description</label>
              <textarea
                name="description"
                className="form-textarea"
                placeholder="Describe material condition, origin process, contamination level, packaging..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  step="any"
                  name="quantity"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit of Measure *</label>
                <select
                  name="unit"
                  className="form-select"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                >
                  <option value="kg">kg (Kilograms)</option>
                  <option value="tons">tons (Metric Tons)</option>
                  <option value="meters">meters</option>
                  <option value="units">units</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Purity Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  name="purity_percentage"
                  className="form-input"
                  value={formData.purity_percentage}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quality Grade</label>
                <select
                  name="quality_grade"
                  className="form-select"
                  value={formData.quality_grade}
                  onChange={handleChange}
                >
                  <option value="Grade A">Grade A (High Purity / Clean)</option>
                  <option value="Grade B">Grade B (Medium Purity / Slight Mix)</option>
                  <option value="Grade C">Grade C (Mixed / Post-consumer)</option>
                  <option value="Raw Unsorted">Raw Unsorted</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quality Notes</label>
              <input
                type="text"
                name="quality_notes"
                className="form-input"
                placeholder="e.g. Free from moisture, single dye color"
                value={formData.quality_notes}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price per Unit ({formData.currency}) *</label>
                <input
                  type="number"
                  step="any"
                  name="price_per_unit"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.price_per_unit}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  name="currency"
                  className="form-select"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Available From</label>
                <input
                  type="date"
                  name="available_from"
                  className="form-input"
                  value={formData.available_from}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Generation Frequency</label>
                <select
                  name="frequency"
                  className="form-select"
                  value={formData.frequency}
                  onChange={handleChange}
                >
                  <option value="one_time">One-time Batch</option>
                  <option value="weekly">Weekly Recurring</option>
                  <option value="monthly">Monthly Recurring</option>
                  <option value="regular">Continuous / Regular Stream</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="negotiable"
                  checked={formData.negotiable}
                  onChange={handleChange}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)' }}>
                  Price is negotiable for bulk orders
                </span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Passport' : 'Create Waste Passport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
