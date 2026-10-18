import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import {
  FileText, Search, Clock, ShoppingCart,
  CheckCircle, DollarSign, Plus
} from 'lucide-react'

export default function BuyerDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/dashboard/buyer')
        setStats(res.data)
      } catch {
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return <div className="loading-screen"><div className="loader"></div></div>
  }

  const cards = [
    {
      icon: FileText, label: 'Active Requirements',
      value: stats?.active_requirements || 0,
    },
    {
      icon: Search, label: 'Matching Suppliers',
      value: stats?.matching_suppliers || 0,
    },
    {
      icon: Clock, label: 'Pending Requests',
      value: stats?.pending_requests || 0,
    },
    {
      icon: ShoppingCart, label: 'Active Orders',
      value: stats?.active_orders || 0,
    },
    {
      icon: CheckCircle, label: 'Completed Orders',
      value: stats?.completed_orders || 0,
    },
    {
      icon: DollarSign, label: 'Total Spent',
      value: `₹${(stats?.total_spent || 0).toLocaleString('en-IN')}`,
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Buyer Dashboard</h1>
          <p className="page-subtitle">Find, match, and source circular raw materials</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/requirements')}>
          <Plus size={16} /> New Requirement
        </button>
      </div>

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
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/marketplace')}>
          <div className="card-body" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <div className="stat-icon" style={{ margin: 0 }}>
                <Search size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Browse Marketplace</h3>
                <p className="text-muted text-sm" style={{ marginTop: 2 }}>Search verified industrial waste materials with Passports</p>
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
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>My Orders</h3>
                <p className="text-muted text-sm" style={{ marginTop: 2 }}>Track procurement requests and vehicle dispatches</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
