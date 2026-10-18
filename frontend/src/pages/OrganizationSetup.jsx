import { useState, useEffect } from 'react'
import {
  Building2, CheckCircle2, Clock, AlertTriangle, XCircle,
  Upload, FileText, Globe, MapPin, Phone, ShieldCheck, Save, Lock, Scale
} from 'lucide-react'
import api from '../api'
import { useAuth } from '../AuthContext'
import { useToast } from '../components/Toast'
import ManufacturerAgreementModal from '../components/ManufacturerAgreementModal'

export default function OrganizationSetup() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)
  const [org, setOrg] = useState(null)

  const [formData, setFormData] = useState({
    company_name: '',
    business_type: 'Manufacturer / Factory',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    contact_person: user?.full_name || '',
    website: '',
    registration_number: '',
    tax_id: '',
    description: '',
  })

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      const res = await api.get('/organizations/me')
      setOrg(res.data)
      setFormData({
        company_name: res.data.company_name || '',
        business_type: res.data.business_type || 'Manufacturer / Factory',
        address: res.data.address || '',
        city: res.data.city || '',
        state: res.data.state || '',
        pincode: res.data.pincode || '',
        country: res.data.country || 'India',
        contact_person: res.data.contact_person || '',
        website: res.data.website || '',
        registration_number: res.data.registration_number || '',
        tax_id: res.data.tax_id || '',
        description: res.data.description || '',
      })
    } catch (err) {
      // 404 means no organization registered yet
      if (err.response?.status !== 404) {
        addToast('Failed to load organization profile', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (org) {
        const res = await api.put('/organizations/me', formData)
        setOrg(res.data)
        addToast('Organization details updated!', 'success')
      } else {
        const res = await api.post('/organizations/', formData)
        setOrg(res.data)
        addToast('Organization registered successfully!', 'success')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save organization'
      addToast(typeof msg === 'string' ? msg : 'Error saving profile', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingDocs(true)
    const data = new FormData()
    for (let i = 0; i < files.length; i++) {
      data.append('files', files[i])
    }

    try {
      const res = await api.post('/organizations/me/documents', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      addToast(res.data.message || 'Documents uploaded successfully!', 'success')
      fetchOrganization()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to upload documents'
      addToast(typeof msg === 'string' ? msg : 'Upload failed', 'error')
    } finally {
      setUploadingDocs(false)
      e.target.value = ''
    }
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="badge badge-green" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
            <CheckCircle2 size={15} /> Verified Company
          </span>
        )
      case 'under_review':
        return (
          <span className="badge badge-blue" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
            <Clock size={15} /> Under Review
          </span>
        )
      case 'rejected':
        return (
          <span className="badge badge-red" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
            <XCircle size={15} /> Verification Rejected
          </span>
        )
      default:
        return (
          <span className="badge badge-yellow" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
            <Clock size={15} /> Pending Verification
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <span className="text-muted">Loading organization details...</span>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Organization Profile & Verification</h1>
          <p className="page-subtitle">
            Manage your company identity, legal business details, and verify compliance
          </p>
        </div>
        {org && <div>{renderStatusBadge(org.verification_status)}</div>}
      </div>

      {org && (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--blue-subtle)',
                color: 'var(--blue-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-muted text-xs">OFFICIAL FACTORY PASSPORT ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--gray-950)' }}>
                  {org.passport_id || 'RSX-FAC-GENUINE'}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Authorized Person: <strong>{org.contact_person}</strong> • Status: <strong style={{ textTransform: 'capitalize' }}>{org.verification_status}</strong>
              </span>
            </div>
          </div>

          <a
            href={`/verify-passport?id=${encodeURIComponent(org.passport_id || org.company_name)}&type=factory`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            Verify Passport Record ↗
          </a>
        </div>
      )}

      {org && org.verification_status === 'pending' && (
        <div
          style={{
            background: 'var(--accent-50)',
            border: '1px solid var(--accent-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertTriangle color="var(--accent-700)" size={24} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent-700)', fontSize: '0.9375rem' }}>
              Verification in Progress
            </div>
            <div style={{ color: 'var(--gray-600)', fontSize: '0.8125rem' }}>
              Upload your business registration, tax IDs, or environmental clearances below to expedite trust verification.
            </div>
          </div>
        </div>
      )}

      {org && org.verification_status === 'rejected' && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <XCircle color="var(--error)" size={24} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--error)', fontSize: '0.9375rem' }}>
              Verification Action Required
            </div>
            <div style={{ color: 'var(--gray-700)', fontSize: '0.8125rem' }}>
              {org.verification_notes || 'Please update your details and re-upload valid enterprise documents.'}
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Left column: Organization Details Form */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="var(--primary-600)" />
              {org ? 'Company Details' : 'Register Your Organization'}
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Company Legal Name *</label>
                <input
                  type="text"
                  name="company_name"
                  className="form-input"
                  placeholder="e.g. Apex Textiles Pvt Ltd"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Business Type *</label>
                  <select
                    name="business_type"
                    className="form-select"
                    value={formData.business_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="Manufacturer / Factory">Manufacturer / Factory</option>
                    <option value="Recycler / Reprocessor">Recycler / Reprocessor</option>
                    <option value="Raw Material Buyer">Raw Material Buyer</option>
                    <option value="Aggregator / Trader">Aggregator / Trader</option>
                    <option value="Logistics Provider">Logistics Provider</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person *</label>
                  <input
                    type="text"
                    name="contact_person"
                    className="form-input"
                    value={formData.contact_person}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Registration / CIN Number</label>
                  <input
                    type="text"
                    name="registration_number"
                    className="form-input"
                    placeholder="e.g. U17111GJ2015PTC083421"
                    value={formData.registration_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tax ID / GSTIN</label>
                  <input
                    type="text"
                    name="tax_id"
                    className="form-input"
                    placeholder="e.g. 24AAACA1234A1Z5"
                    value={formData.tax_id}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Registered Office / Factory Address *</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  placeholder="Plot No., Industrial Area, Street"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    name="city"
                    className="form-input"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    name="state"
                    className="form-input"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Postal / PIN Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    className="form-input"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    name="country"
                    className="form-input"
                    value={formData.country}
                    onChange={handleChange}
                    disabled
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company Website</label>
                <input
                  type="url"
                  name="website"
                  className="form-input"
                  placeholder="https://company.com"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company & Operations Description</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Overview of manufacturing operations, waste output streams, recycling capabilities..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={submitting}
              >
                <Save size={18} />
                {submitting ? 'Saving...' : org ? 'Update Organization' : 'Register Organization'}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Verification Documents & Trust Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Statutory Manufacturer Integrity & Anti-Fraud Accord Card */}
          <div className="card" style={{ border: org?.integrity_agreement_signed ? '1px solid var(--border-subtle)' : '1px solid rgba(245, 158, 11, 0.4)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Scale size={18} color={org?.integrity_agreement_signed ? '#10b981' : 'var(--primary-500)'} />
                Manufacturer Integrity & Anti-Fraud Accord
              </h3>
              {org?.integrity_agreement_signed ? (
                <span className="badge badge-green" style={{ fontSize: '0.725rem' }}>
                  <CheckCircle2 size={12} /> Executed & Binding
                </span>
              ) : (
                <span className="badge badge-yellow" style={{ fontSize: '0.725rem' }}>
                  <AlertTriangle size={12} /> Execution Required
                </span>
              )}
            </div>
            <div className="card-body">
              <p className="text-muted text-sm" style={{ marginBottom: '14px', lineHeight: '1.5' }}>
                Legal obligation ensuring all listed byproduct compositions, weights, and lab tests are 100% verified. Provides buyer guarantees and statutory anti-fraud enforcement.
              </p>

              {org?.integrity_agreement_signed ? (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '14px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="text-muted">Signatory:</span>
                    <strong style={{ color: 'var(--gray-950)' }}>{org?.integrity_agreement_data?.signatory_name || org?.contact_person}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="text-muted">Designation:</span>
                    <strong style={{ color: 'var(--gray-950)' }}>{org?.integrity_agreement_data?.signatory_designation || 'Authorized Officer'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Anti-Fraud Protocol:</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Active & Enforceable</span>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '14px', fontSize: '0.8125rem', color: 'var(--gray-700)' }}>
                  <strong>Mandatory for Factory Listing:</strong> You must execute this agreement to warrant verified product quality and acknowledge fraud penalties.
                </div>
              )}

              <button
                type="button"
                className={org?.integrity_agreement_signed ? "btn btn-secondary" : "btn btn-primary"}
                onClick={() => setIsAgreementModalOpen(true)}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                disabled={!org}
              >
                <Lock size={15} />
                {org?.integrity_agreement_signed ? 'View Executed Agreement' : 'Review & Sign Manufacturer Accord'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--primary-600)" />
                Compliance & Documents
              </h3>
            </div>
            <div className="card-body">
              <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
                Upload official credentials to establish platform credibility. Accepted formats: PDF, JPG, PNG (Max 10MB per file).
              </p>

              {org ? (
                <div>
                  <label
                    style={{
                      border: '2px dashed var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: uploadingDocs ? 'not-allowed' : 'pointer',
                      background: 'var(--gray-50)',
                      transition: 'all var(--transition-fast)',
                      marginBottom: '20px',
                    }}
                  >
                    <Upload size={32} color="var(--primary-600)" />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>
                      {uploadingDocs ? 'Uploading documents...' : 'Click to upload files'}
                    </span>
                    <span className="text-muted text-xs">
                      GST certificate, factory license, PCB authorization, lab certifications
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadingDocs}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '8px' }}>
                      Uploaded Documents ({org.documents?.length || 0})
                    </h4>
                    {org.documents && org.documents.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {org.documents.map((docPath, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: 'var(--bg-secondary)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--gray-200)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <FileText size={18} color="var(--primary-600)" />
                              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gray-800)' }}>
                                Document #{idx + 1}
                              </span>
                            </div>
                            <a
                              href={docPath}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '0.75rem' }}
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-xs">No documents uploaded yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <Building2 size={36} color="var(--gray-400)" style={{ margin: '0 auto 8px' }} />
                  <p className="text-muted text-sm">
                    Please submit your organization details on the left first to unlock document verification.
                  </p>
                </div>
              )}
            </div>
          </div>

          {org && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: '1.125rem' }}>Verification Summary</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span className="text-muted">Status:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{org.verification_status.replace('_', ' ')}</strong>
                  </div>
                  {org.verified_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span className="text-muted">Verified Date:</span>
                      <strong>{new Date(org.verified_at).toLocaleDateString()}</strong>
                    </div>
                  )}
                  {org.verification_notes && (
                    <div style={{ fontSize: '0.875rem' }}>
                      <span className="text-muted">Reviewer Notes:</span>
                      <p style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--gray-700)' }}>
                        "{org.verification_notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manufacturer Integrity & Anti-Fraud Legal Modal */}
      <ManufacturerAgreementModal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        org={org}
        onAgreementSigned={(updatedOrg) => setOrg(updatedOrg)}
      />
    </div>
  )
}
