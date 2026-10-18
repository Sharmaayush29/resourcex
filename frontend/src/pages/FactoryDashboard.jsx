import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import {
  Package, TrendingUp, DollarSign, ShoppingCart,
  ClipboardList, Users, Clock, CheckCircle, Plus, Scale, Lock,
  ShieldCheck, Copy, Check, ExternalLink
} from 'lucide-react'
import ManufacturerAgreementModal from '../components/ManufacturerAgreementModal'

export default function FactoryDashboard() {
  const [stats, setStats] = useState(null)
  const [org, setOrg] = useState(null)
  const [orgLoading, setOrgLoading] = useState(true)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copiedPassport, setCopiedPassport] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dashRes, orgRes] = await Promise.allSettled([
          api.get('/dashboard/factory'),
          api.get('/organizations/me')
        ])
        if (dashRes.status === 'fulfilled') setStats(dashRes.value.data)
        if (orgRes.status === 'fulfilled') setOrg(orgRes.value.data)
      } catch {
        setStats(null)
      } finally {
        setLoading(false)
        setOrgLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return <div className="loading-screen"><div className="loader"></div></div>
  }

  const cards = [
    {
      icon: Package, label: 'Waste Generated',
      value: formatWeight(stats?.total_waste_generated),
    },
    {
      icon: ClipboardList, label: 'Available Stock',
      value: formatWeight(stats?.total_waste_available),
    },
    {
      icon: TrendingUp, label: 'Waste Sold',
      value: formatWeight(stats?.total_waste_sold),
    },
    {
      icon: DollarSign, label: 'Total Revenue',
      value: `₹${(stats?.total_revenue || 0).toLocaleString('en-IN')}`,
    },
    {
      icon: Package, label: 'Active Listings',
      value: stats?.active_listings || 0,
    },
    {
      icon: Users, label: 'Buyer Requests',
      value: stats?.buyer_requests || 0,
    },
    {
      icon: Clock, label: 'Pending Orders',
      value: stats?.pending_orders || 0,
    },
    {
      icon: CheckCircle, label: 'Completed Orders',
      value: stats?.completed_orders || 0,
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Factory Dashboard</h1>
            {org?.integrity_agreement_signed && (
              <span className="badge badge-green" style={{ fontSize: '0.725rem', padding: '3px 8px' }}>
                <CheckCircle size={12} /> Integrity Certified
              </span>
            )}
          </div>
          <p className="page-subtitle">Monitor your industrial waste output, verification standing, and revenue streams</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setIsAgreementModalOpen(true)}>
            <Scale size={16} /> Manufacturer Accord
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/waste')}>
            <Plus size={18} /> New Listing
          </button>
        </div>
      </div>

      {/* Official Factory Passport Standing Banner */}
      {!orgLoading && org && (
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
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--blue-subtle)',
                color: 'var(--blue-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="text-muted text-xs">OFFICIAL FACTORY PASSPORT:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-950)' }}>
                  {org.passport_id || 'RSX-FAC-GENUINE'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(org.passport_id || '')
                    setCopiedPassport(true)
                    setTimeout(() => setCopiedPassport(false), 2000)
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-600)', padding: '0 4px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                >
                  {copiedPassport ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copiedPassport ? 'Copied' : 'Copy ID'}</span>
                </button>
                <span className={`badge ${org.verification_status === 'verified' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.7rem' }}>
                  {org.verification_status === 'verified' ? 'VERIFIED FACTORY' : 'ACCREDITATION PENDING'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                Delivered Consignments: <strong>{stats?.completed_orders || 0}</strong> • Delivered Volume: <strong>{formatWeight(stats?.total_waste_sold)}</strong>
              </div>
            </div>
          </div>

          <Link
            to={`/verify-passport?id=${encodeURIComponent(org.passport_id || org.company_name)}&type=factory`}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={13} />
            <span>Public Passport View</span>
          </Link>
        </div>
      )}

      {/* Manufacturer Integrity Agreement Banner */}
      {!orgLoading && (!org || !org.integrity_agreement_signed) && (
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <Scale size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-950)' }}>
                Action Required: Sign Manufacturer Integrity & Verified Product Accord
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                Legally certify your byproduct quality, unlock verified buyer matchmaking, and activate anti-fraud guarantees.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsAgreementModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Lock size={14} /> Review & Sign Accord
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/organization')}
            >
              Company Profile
            </button>
          </div>
        </div>
      )}

      <div className="stats-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-icon">
              <card.icon size={18} />
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/waste')}>
          <div className="card-body" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <div className="stat-icon" style={{ margin: 0 }}>
                <Package size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Manage Waste Listings</h3>
                <p className="text-muted text-sm" style={{ marginTop: 2 }}>Create, edit, and track authenticated waste batches</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/orders')}>
          <div className="card-body" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <div className="stat-icon" style={{ margin: 0 }}>
                <ShoppingCart size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>View Orders</h3>
                <p className="text-muted text-sm" style={{ marginTop: 2 }}>Track buyer requests, manifests, and dispatches</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manufacturer Integrity Agreement Modal */}
      <ManufacturerAgreementModal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        org={org}
        onAgreementSigned={(updatedOrg) => setOrg(updatedOrg)}
      />
    </div>
  )
}

function formatWeight(val) {
  if (!val) return '0 kg'
  if (val >= 1000) return `${(val / 1000).toFixed(1)} T`
  return `${val.toLocaleString()} kg`
}
