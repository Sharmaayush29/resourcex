import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Boxes, Package, TrendingUp, AlertCircle, Plus,
  Layers, CheckCircle, RefreshCw
} from 'lucide-react'
import api from '../api'
import { useToast } from '../components/Toast'

export default function Inventory() {
  const { addToast } = useToast()
  const [inventory, setInventory] = useState({ items: [], total_quantity: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const res = await api.get('/waste/inventory')
      setInventory(res.data)
    } catch (err) {
      addToast('Failed to load inventory data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const categoryTotals = inventory.items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.available_quantity
    return acc
  }, {})

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Factory Waste Inventory</h1>
          <p className="page-subtitle">
            Real-time tracking of byproduct stock levels, batch aggregations, and marketplace availability
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={fetchInventory}>
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/waste" className="btn btn-primary">
            <Plus size={16} /> Add Batch
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Calculating real-time inventory balances...</span>
        </div>
      ) : (
        <>
          {/* Top Level Metric Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa' }}>
                <Boxes size={24} />
              </div>
              <div className="stat-value">{inventory.total_quantity?.toLocaleString()}</div>
              <div className="stat-label">Total Active Inventory Units</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.18)', color: '#a78bfa' }}>
                <Layers size={24} />
              </div>
              <div className="stat-value">{inventory.items.length}</div>
              <div className="stat-label">Unique Material Streams</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8' }}>
                <Package size={24} />
              </div>
              <div className="stat-value">
                {inventory.items.reduce((acc, curr) => acc + curr.batch_count, 0)}
              </div>
              <div className="stat-label">Total Active Batches</div>
            </div>
          </div>

          {/* Category Breakdown Chips */}
          <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px', color: 'var(--gray-800)' }}>
              Category Distribution
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {Object.entries(categoryTotals).length === 0 ? (
                <span className="text-muted text-sm">No items in inventory.</span>
              ) : (
                Object.entries(categoryTotals).map(([cat, qty]) => (
                  <div
                    key={cat}
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--gray-200)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                      {cat}
                    </span>
                    <strong style={{ fontSize: '0.9375rem', color: 'var(--gray-900)' }}>
                      {qty.toLocaleString()} units
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Material Stream Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1.125rem' }}>Stock Details by Material Stream</h3>
            </div>
            <div className="card-body">
              {inventory.items.length === 0 ? (
                <div className="empty-state">
                  <Package size={48} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Inventory is Empty</h4>
                  <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
                    Generate waste batches with verifiable passports to track and monetize byproducts.
                  </p>
                  <Link to="/waste" className="btn btn-primary">
                    <Plus size={16} /> Register First Batch
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {inventory.items.map((item, idx) => {
                    const percentAvailable = item.total_quantity > 0
                      ? Math.round((item.available_quantity / item.total_quantity) * 100)
                      : 0

                    return (
                      <div key={idx} className="inventory-bar">
                        <div style={{ flex: '1 1 240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
                              {item.category}
                            </span>
                            <strong style={{ fontSize: '1rem', color: 'var(--gray-900)' }}>
                              {item.material_type}
                            </strong>
                          </div>
                          <span className="text-muted text-xs">
                            Across {item.batch_count} active batch passport(s)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ flex: '2 1 300px', minWidth: '200px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                            <span className="text-muted">Availability</span>
                            <strong>
                              {percentAvailable}% ({item.available_quantity?.toLocaleString()} / {item.total_quantity?.toLocaleString()} {item.unit})
                            </strong>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '8px',
                              background: 'var(--gray-200)',
                              borderRadius: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${percentAvailable}%`,
                                height: '100%',
                                background: percentAvailable > 30 ? 'var(--primary-500)' : 'var(--warning)',
                                borderRadius: '4px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flex: '0 0 120px' }}>
                          <Link to="/waste" className="btn btn-ghost btn-sm">
                            Manage Batches
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
