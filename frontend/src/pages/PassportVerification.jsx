import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ShieldCheck, Search, CheckCircle2, AlertTriangle, ArrowRight,
  Package, MapPin, Building2, FileText, Scale, ArrowLeft, RefreshCw,
  Truck, UserCheck, Clock, Award, ShieldAlert, Check, Copy
} from 'lucide-react'
import api from '../api'

export default function PassportVerification() {
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') || 'factory'
  const initialId = searchParams.get('id') || ''

  const [activeTab, setActiveTab] = useState(initialType) // 'factory' | 'order' | 'lot'
  const [searchQuery, setSearchQuery] = useState(initialId)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (initialId) {
      setSearchQuery(initialId)
      if (initialType) setActiveTab(initialType)
      runVerification(initialId, initialType)
    }
  }, [initialId, initialType])

  const runVerification = async (queryId, tabType) => {
    const cleanId = (queryId || searchQuery).trim()
    if (!cleanId) return

    setLoading(true)
    setSearched(true)
    setResult(null)

    // Determine target endpoint based on tab or smart detection
    let endpoint = ''
    const currentTab = tabType || activeTab

    if (currentTab === 'order' || cleanId.toUpperCase().startsWith('ORD-')) {
      endpoint = `/orders/verify/${encodeURIComponent(cleanId)}`
    } else if (currentTab === 'lot' || (cleanId.toUpperCase().startsWith('RSX-') && !cleanId.toUpperCase().startsWith('RSX-FAC-'))) {
      endpoint = `/waste/verify/${encodeURIComponent(cleanId)}`
    } else {
      // Default: Factory Passport
      endpoint = `/organizations/verify/${encodeURIComponent(cleanId)}`
    }

    try {
      const res = await api.get(endpoint)
      setResult(res.data)
    } catch (err) {
      const errDetail = err.response?.data?.detail
      setResult({
        verified: false,
        status: 'NOT_FOUND',
        message: errDetail || `No records found in ReSourceX official registry for '${cleanId}'.`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    runVerification(searchQuery, activeTab)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setResult(null)
    setSearched(false)
    setSearchQuery('')
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Back button */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: 'var(--primary-500)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back to ReSourceX
        </Link>
      </div>

      {/* Main Registry Header Card */}
      <div
        className="card"
        style={{
          padding: '36px 32px 30px',
          marginBottom: '28px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--blue-subtle)',
            color: 'var(--blue-accent)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <ShieldCheck size={28} />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-500)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ReSourceX Statutory Registry
        </span>
        <h1 style={{ margin: '6px 0 10px', fontSize: '1.9rem', fontWeight: 700, color: 'var(--gray-950)' }}>
          Digital Passport & Consignment Verification
        </h1>
        <p style={{ margin: '0 auto 24px', maxWidth: '640px', fontSize: '0.9375rem', color: 'var(--gray-600)', lineHeight: '1.6' }}>
          Instant public authentication of industrial trading entities and transactions. Verify if a <strong>factory is accredited & how much material they delivered</strong>, or check if an <strong>order is officially verified by ReSourceX admin</strong>.
        </p>

        {/* Verification Category Tabs */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-secondary)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '24px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => handleTabChange('factory')}
            style={{
              background: activeTab === 'factory' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'factory' ? 'var(--gray-950)' : 'var(--gray-500)',
              boxShadow: activeTab === 'factory' ? 'var(--shadow-sm)' : 'none',
              fontWeight: activeTab === 'factory' ? 600 : 500,
              border: activeTab === 'factory' ? '1px solid var(--border-subtle)' : 'none',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 size={15} color={activeTab === 'factory' ? 'var(--primary-500)' : 'currentColor'} />
            <span>1. Factory / Person Passport</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => handleTabChange('order')}
            style={{
              background: activeTab === 'order' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'order' ? 'var(--gray-950)' : 'var(--gray-500)',
              boxShadow: activeTab === 'order' ? 'var(--shadow-sm)' : 'none',
              fontWeight: activeTab === 'order' ? 600 : 500,
              border: activeTab === 'order' ? '1px solid var(--border-subtle)' : 'none',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Truck size={15} color={activeTab === 'order' ? 'var(--primary-500)' : 'currentColor'} />
            <span>2. Order Admin Verification</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => handleTabChange('lot')}
            style={{
              background: activeTab === 'lot' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'lot' ? 'var(--gray-950)' : 'var(--gray-500)',
              boxShadow: activeTab === 'lot' ? 'var(--shadow-sm)' : 'none',
              fontWeight: activeTab === 'lot' ? 600 : 500,
              border: activeTab === 'lot' ? '1px solid var(--border-subtle)' : 'none',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Package size={15} color={activeTab === 'lot' ? 'var(--primary-500)' : 'currentColor'} />
            <span>3. Material Lot Passport</span>
          </button>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '44px', fontSize: '0.95rem', height: '46px', fontFamily: 'monospace' }}
                placeholder={
                  activeTab === 'factory'
                    ? 'Enter Factory Passport ID (e.g. RSX-FAC-2026-00001) or GSTIN'
                    : activeTab === 'order'
                    ? 'Enter Order ID (e.g. ORD-2026-000001)'
                    : 'Enter Material Passport ID (e.g. RSX-TX-2026-00001)'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !searchQuery.trim()}
              style={{ height: '46px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <ShieldCheck size={16} />}
              <span>{loading ? 'Verifying...' : 'Verify ID'}</span>
            </button>
          </div>
        </form>

        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
          {activeTab === 'factory' && (
            <span>Checks factory accreditation, authorized person standing, and cumulative delivered product tonnage.</span>
          )}
          {activeTab === 'order' && (
            <span>Checks whether an order has been audited & certified by ReSourceX governance with verified net tare slips.</span>
          )}
          {activeTab === 'lot' && (
            <span>Validates chemical assay, laboratory test certificate, and CPCB origin records.</span>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          VERIFICATION RESULTS
         ═══════════════════════════════════════════════════════════════ */}
      {searched && (
        <div>
          {/* 1. FACTORY PASSPORT RESULT */}
          {result?.passport_type === 'FACTORY_PASSPORT' && (
            <div
              className="card animate-slide-up"
              style={{
                padding: '32px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-xl)',
                border: `1px solid ${result.is_verified ? 'rgba(16, 185, 129, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-md)',
                      background: result.is_verified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                      color: result.is_verified ? '#10b981' : '#eab308',
                      border: `1px solid ${result.is_verified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Building2 size={26} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span className={`badge ${result.is_verified ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                        {result.is_verified ? 'OFFICIALLY VERIFIED FACTORY' : 'ACCREDITATION PENDING'}
                      </span>
                      {result.integrity_agreement_signed && (
                        <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                          ANTI-FRAUD COVENANT EXECUTED
                        </span>
                      )}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--gray-950)' }}>
                      {result.company_name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{result.passport_id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(result.passport_id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-500)', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                      >
                        {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="text-muted text-xs">Trust Integrity Rating</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                    {result.delivery_metrics?.trust_score}/100
                  </div>
                </div>
              </div>

              {/* Hand-to-Hand Delivery Metrics Cards ("how much item he deliver") */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)', margin: '0 0 12px' }}>
                  Verified Physical Delivery Performance
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px',
                  }}
                >
                  <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-muted text-xs">Consignments Delivered</span>
                    <strong style={{ display: 'block', fontSize: '1.6rem', color: 'var(--gray-950)', marginTop: '4px' }}>
                      {result.delivery_metrics?.total_items_delivered_count || 0}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Hand-to-hand fulfilled shipments</span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-muted text-xs">Total Secondary Material Delivered</span>
                    <strong style={{ display: 'block', fontSize: '1.6rem', color: 'var(--primary-600)', marginTop: '4px' }}>
                      {(result.delivery_metrics?.total_quantity_delivered || 0).toLocaleString()} <span style={{ fontSize: '0.95rem' }}>{result.delivery_metrics?.primary_unit || 'kg'}</span>
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Physically verified volume settled</span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-muted text-xs">Active Output Lots</span>
                    <strong style={{ display: 'block', fontSize: '1.6rem', color: 'var(--gray-950)', marginTop: '4px' }}>
                      {result.delivery_metrics?.active_available_listings || 0}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{(result.delivery_metrics?.total_active_volume || 0).toLocaleString()} kg currently available</span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-muted text-xs">Fulfillment Standing</span>
                    <strong style={{ display: 'block', fontSize: '1.2rem', color: '#10b981', marginTop: '8px' }}>
                      {result.delivery_metrics?.fulfillment_rate || 'Active'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>0 Fraudulent disputes recorded</span>
                  </div>
                </div>
              </div>

              {/* Authorized Person & Verification Details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                  padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span className="text-muted text-xs">Authorized Person / Contact</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <UserCheck size={16} color="var(--primary-600)" />
                    <strong style={{ color: 'var(--gray-950)', fontSize: '0.95rem' }}>
                      {result.contact_person || result.owner_name}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Corporate Representative</span>
                </div>

                <div>
                  <span className="text-muted text-xs">Industry & Classification</span>
                  <strong style={{ display: 'block', color: 'var(--gray-950)', fontSize: '0.95rem', marginTop: '4px', textTransform: 'capitalize' }}>
                    {result.business_type || 'Industrial Manufacturing'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>GSTIN / Tax: {result.tax_id || 'Registered Entity'}</span>
                </div>

                <div>
                  <span className="text-muted text-xs">Facility Location</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <MapPin size={16} color="var(--primary-600)" />
                    <strong style={{ color: 'var(--gray-950)', fontSize: '0.95rem' }}>
                      {result.city}, {result.state}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{result.country} {result.pincode ? `(${result.pincode})` : ''}</span>
                </div>

                <div>
                  <span className="text-muted text-xs">Verification Governance</span>
                  <strong style={{ display: 'block', color: result.is_verified ? '#10b981' : '#eab308', fontSize: '0.95rem', marginTop: '4px' }}>
                    {result.is_verified ? 'ReSourceX Executive Verified' : 'Under Documentation Review'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    {result.verified_at ? `Audited on ${new Date(result.verified_at).toLocaleDateString()}` : 'Initial Verification Phase'}
                  </span>
                </div>
              </div>

              {/* Recent Deliveries List */}
              {result.recent_deliveries && result.recent_deliveries.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)', margin: '0 0 12px' }}>
                    Recent Verified Shipments & Consignments
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.recent_deliveries.map((del, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle2 size={16} color="#10b981" />
                          <div>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--gray-900)' }}>
                              {del.order_number}
                            </span>
                            <span style={{ color: 'var(--gray-500)', margin: '0 8px' }}>•</span>
                            <span style={{ fontWeight: 600 }}>{del.material_type}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <strong style={{ color: 'var(--primary-600)' }}>
                            {del.quantity} {del.unit}
                          </strong>
                          <span style={{ color: 'var(--gray-500)' }}>
                            {del.completed_at ? new Date(del.completed_at).toLocaleDateString() : 'Settled'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. ORDER PASSPORT RESULT */}
          {result?.passport_type === 'ORDER_PASSPORT' && (
            <div
              className="card animate-slide-up"
              style={{
                padding: '32px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-xl)',
                border: `1px solid ${result.is_admin_verified ? 'rgba(16, 185, 129, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-md)',
                      background: result.is_admin_verified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                      color: result.is_admin_verified ? '#10b981' : '#eab308',
                      border: `1px solid ${result.is_admin_verified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Truck size={26} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span className={`badge ${result.is_admin_verified ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                        {result.is_admin_verified ? 'OFFICIALLY VERIFIED BY ADMIN' : 'PENDING ADMIN AUDIT'}
                      </span>
                      <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '3px 10px', textTransform: 'uppercase' }}>
                        {result.order_status}
                      </span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'monospace', color: 'var(--gray-950)' }}>
                      {result.order_number}
                    </h2>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="text-muted text-xs">Total Order Value</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-950)' }}>
                    ₹{result.total_cost?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Admin Verification Notice Callout */}
              <div
                style={{
                  background: result.is_admin_verified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                  border: `1px solid ${result.is_admin_verified ? 'rgba(16, 185, 129, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}
              >
                {result.is_admin_verified ? (
                  <CheckCircle2 color="#10b981" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <Clock color="#eab308" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <div>
                  <strong style={{ fontSize: '0.9rem', color: result.is_admin_verified ? '#10b981' : '#ca8a04', display: 'block', marginBottom: '4px' }}>
                    {result.is_admin_verified ? 'Admin Physical Assay & Weighbridge Audit Clearance Granted' : 'Pending Administrative Verification'}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-700)', lineHeight: '1.5' }}>
                    {result.admin_verification_notes}
                  </p>
                  {result.admin_verified_at && (
                    <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      Certified by <strong>{result.admin_verified_by}</strong> on {new Date(result.admin_verified_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Specifications */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-muted text-xs">Delivered Material Stream</span>
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--gray-950)', marginTop: '2px' }}>
                    {result.material_type}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'capitalize' }}>Category: {result.material_category}</span>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-muted text-xs">Verified Quantity Delivered</span>
                  <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--primary-600)', marginTop: '2px' }}>
                    {result.quantity} {result.unit}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>@ ₹{result.price_per_unit}/{result.unit}</span>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-muted text-xs">Supplying Manufacturer</span>
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--gray-950)', marginTop: '2px' }}>
                    {result.seller?.company_name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontFamily: 'monospace' }}>
                    {result.seller?.passport_id}
                  </span>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-muted text-xs">Receiving Buyer Enterprise</span>
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--gray-950)', marginTop: '2px' }}>
                    {result.buyer?.company_name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    Destination: {result.delivery_location || `${result.buyer?.city}, ${result.buyer?.state}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. MATERIAL BATCH LOT RESULT */}
          {(result?.passport_type === 'BATCH_PASSPORT' || result?.batch_id) && (
            <div
              className="card animate-slide-up"
              style={{
                padding: '32px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={26} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                        AUTHENTIC & VERIFIED
                      </span>
                      {result.listing_verified && (
                        <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                          ADMIN AUDITED
                        </span>
                      )}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'monospace', color: 'var(--gray-950)' }}>
                      {result.passport_id}
                    </h2>
                  </div>
                </div>

                <Link
                  to={`/waste/${result.batch_id}`}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>View Full Passport</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Specs Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ background: 'var(--bg-secondary)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-muted text-xs">Material Classification</span>
                  <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--gray-950)', marginTop: '2px' }}>
                    {result.material_type}
                  </strong>
                  {result.sub_type && <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{result.sub_type}</span>}
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-muted text-xs">Assay Chemical Purity</span>
                  <strong style={{ display: 'block', fontSize: '1.15rem', color: '#10b981', marginTop: '2px' }}>
                    {result.purity_percentage}% Purity
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Grade: {result.quality_grade || 'Standard'}</span>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-muted text-xs">Available Lot Volume</span>
                  <strong style={{ display: 'block', fontSize: '1.15rem', color: 'var(--gray-950)', marginTop: '2px' }}>
                    {result.available_quantity?.toLocaleString()} {result.unit}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Total Generated: {result.total_quantity?.toLocaleString()} {result.unit}</span>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-muted text-xs">Generating Enterprise</span>
                  <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--gray-950)', marginTop: '2px' }}>
                    {result.organization_name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{result.location}</span>
                </div>
              </div>
            </div>
          )}

          {/* NOT FOUND ERROR STATE */}
          {!result?.passport_type && !result?.batch_id && (
            <div
              className="card animate-slide-up"
              style={{
                padding: '32px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: 'var(--gray-950)' }}>
                Identifier Not Found in ReSourceX Registry
              </h2>
              <p style={{ margin: '0 auto 20px', maxWidth: '520px', fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.5' }}>
                {result?.message || 'No registered factory passport or order consignment matches this identifier.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register Your Factory
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
