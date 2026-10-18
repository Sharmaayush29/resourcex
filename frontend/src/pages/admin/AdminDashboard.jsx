import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert, Users, Building2, Package, CheckCircle2,
  Clock, AlertTriangle, FileText, DollarSign, Activity,
  ArrowRight, ShieldCheck, RefreshCw, FileSpreadsheet
} from 'lucide-react'
import api from '../../api'
import { useToast } from '../../components/Toast'

export default function AdminDashboard() {
  const { addToast } = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/dashboard')
      setStats(res.data)
    } catch (err) {
      addToast('Failed to load admin statistics', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <span className="text-muted">Loading administrative platform analytics...</span>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Executive Trust & Operations Console</h1>
          <p className="page-subtitle">
            Platform governance, company compliance verifications, and marketplace dispute moderation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link
            to="/admin/exports"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FileSpreadsheet size={16} /> Sales & Google Sheets
          </Link>
          <button className="btn btn-secondary" onClick={fetchStats}>
            <RefreshCw size={16} /> Refresh Metrics
          </button>
        </div>
      </div>

      {/* Critical Action Items Banner */}
      {((stats?.pending_verification || 0) > 0 || (stats?.open_reports || 0) > 0 || (stats?.pending_listings || 0) > 0) && (
        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px', color: 'var(--gray-950)' }}>
              Pending Moderation Queues
            </h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              You have {stats?.pending_verification || 0} organizations awaiting verification, {stats?.pending_listings || 0} waste listings pending audit, and {stats?.open_reports || 0} active dispute reports.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/admin/organizations" className="btn btn-primary btn-sm">
              Review Organizations
            </Link>
            <Link to="/admin/listings" className="btn btn-secondary btn-sm">
              Audit Listings
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={20} />
          </div>
          <div className="stat-value">{stats?.total_users?.toLocaleString()}</div>
          <div className="stat-label">Registered Users</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={20} />
          </div>
          <div className="stat-value">{stats?.verified_companies?.toLocaleString()}</div>
          <div className="stat-label">Verified Enterprises</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={20} />
          </div>
          <div className="stat-value">{stats?.pending_verification?.toLocaleString()}</div>
          <div className="stat-label">Pending Verification</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Package size={20} />
          </div>
          <div className="stat-value">{stats?.active_listings?.toLocaleString()}</div>
          <div className="stat-label">Active Waste Passports</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-value">{stats?.completed_orders?.toLocaleString()}</div>
          <div className="stat-label">Settled Transactions</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-value">{stats?.open_reports?.toLocaleString()}</div>
          <div className="stat-label">Open Dispute Reports</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ShieldAlert size={20} />
          </div>
          <div className="stat-value">{(stats?.blocked_users || 0) + (stats?.suspended_users || 0)}</div>
          <div className="stat-label">Restricted / Blocked</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={20} />
          </div>
          <div className="stat-value">₹{(stats?.total_transaction_value || 0).toLocaleString()}</div>
          <div className="stat-label">Total Material GMV</div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid-3" style={{ gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--primary-600)" />
            Enterprise Verifications
          </h3>
          <p className="text-muted text-xs" style={{ marginBottom: '16px' }}>
            Inspect legal documents (GST, factory licenses) and issue official verification marks.
          </p>
          <Link to="/admin/organizations" className="btn btn-secondary btn-sm" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <span>Manage Verification Queue</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="var(--primary-600)" />
            Waste Passport Audits
          </h3>
          <p className="text-muted text-xs" style={{ marginBottom: '16px' }}>
            Review byproduct listings for accurate composition data, purity, and weighbridge evidence.
          </p>
          <Link to="/admin/listings" className="btn btn-secondary btn-sm" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <span>Audit Waste Listings</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--primary-600)" />
            Audit Trail Logs
          </h3>
          <p className="text-muted text-xs" style={{ marginBottom: '16px' }}>
            Access immutable compliance logs recording every administrative approval, warning, and block.
          </p>
          <Link to="/admin/audit-logs" className="btn btn-secondary btn-sm" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <span>View Security Logs</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  )
}
