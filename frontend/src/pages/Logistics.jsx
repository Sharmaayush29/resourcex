import { useState, useEffect } from 'react'
import {
  Truck, MapPin, CheckCircle2, Clock, Navigation,
  ShieldCheck, Package, RefreshCw, X, AlertCircle, Sparkles, Phone, User
} from 'lucide-react'
import api from '../api'
import { useAuth } from '../AuthContext'
import { useToast } from '../components/Toast'

export default function Logistics() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState('all')

  // Logistics Update Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [targetStatus, setTargetStatus] = useState('shipped')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchDispatches()
  }, [])

  const fetchDispatches = async () => {
    try {
      setLoading(true)
      const res = await api.get('/orders/dispatch')
      setDispatches(res.data)
    } catch (err) {
      addToast('Failed to load logistics dispatches', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenLogisticsModal = (order, status) => {
    setSelectedOrder(order)
    setTargetStatus(status)
    setVehicleNumber('')
    setDriverName('')
    setDriverPhone('')
  }

  const handleLogisticsSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const logisticsInfo = `[Carrier Dispatch] Vehicle: ${vehicleNumber || 'Standard Fleet'} | Driver: ${driverName || 'Designated Driver'} (${driverPhone || 'N/A'})`

      await api.put(`/orders/${selectedOrder.id}/status`, {
        status: targetStatus,
        notes: logisticsInfo,
      })

      addToast(`Consignment ${selectedOrder.order_number} marked as ${targetStatus.toUpperCase()}!`, 'success')
      setSelectedOrder(null)
      fetchDispatches()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update consignment'
      addToast(typeof msg === 'string' ? msg : 'Logistics update error', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const filtered = dispatches.filter((d) => {
    if (filterTab === 'pickup') return ['accepted', 'confirmed'].includes(d.status)
    if (filterTab === 'transit') return d.status === 'shipped'
    if (filterTab === 'delivered') return d.status === 'delivered'
    return true
  })

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">Logistics & Freight Dispatch Portal</h1>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Truck size={13} /> Active Fleet Network
            </span>
          </div>
          <p className="page-subtitle">
            Manage circular consignment pickups, assign commercial vehicles, and coordinate chain of custody
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDispatches}>
          <RefreshCw size={16} /> Refresh Dispatches
        </button>
      </div>

      {/* AI Logistics Route Efficiency Banner */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          color: 'var(--gray-950)',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--blue-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color="var(--primary-500)" />
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'var(--gray-950)', fontSize: '1rem', fontWeight: 600 }}>
              AI Smart Logistics & Route Optimization
            </h3>
            <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
              Consolidating byproduct shipments within 75km zones reduces deadhead mileage by ~28% and cuts freight costs.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>Active Loads</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--gray-950)' }}>{dispatches.length} consignments</strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { label: 'All Consignments', value: 'all' },
          { label: 'Ready for Pickup', value: 'pickup' },
          { label: 'In Transit', value: 'transit' },
          { label: 'Delivered to Plant', value: 'delivered' },
        ].map((tab) => (
          <button
            key={tab.value}
            className={`btn btn-sm ${filterTab === tab.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading freight manifests...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <Truck size={48} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Consignments in this View</h3>
          <p className="empty-state-text">
            Confirmed orders ready for vehicle dispatch will appear here automatically.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filtered.map((order) => (
            <div key={order.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: 'var(--gray-900)' }}>
                      {order.order_number}
                    </span>
                    <span
                      className={`badge ${
                        order.status === 'shipped'
                          ? 'badge-blue'
                          : order.status === 'delivered'
                          ? 'badge-green'
                          : 'badge-yellow'
                      }`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {order.status === 'shipped' ? '🚚 In Transit' : order.status === 'delivered' ? '✅ Delivered' : '📦 Ready for Dispatch'}
                    </span>
                  </div>
                  <span className="text-muted text-xs">
                    Material: <strong>{order.material_type}</strong> • Volume: <strong>{order.quantity} {order.unit}</strong>
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="text-muted text-xs" style={{ display: 'block' }}>Order Value</span>
                  <strong style={{ fontSize: '1.125rem', color: 'var(--gray-900)' }}>
                    ₹{order.total_cost?.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Transit Route Visualization */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--gray-200)',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <MapPin size={12} color="var(--primary-600)" /> Origin Factory Pickup
                  </span>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--gray-900)' }}>
                    {order.supplier_org_name || 'Supplying Facility'}
                  </strong>
                  <div className="text-muted text-xs">{order.pickup_location || 'Factory Address'}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
                  <Navigation size={18} color="var(--primary-600)" />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                    Direct Freight
                  </span>
                </div>

                <div>
                  <span className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <MapPin size={12} color="var(--error)" /> Destination Plant Drop
                  </span>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--gray-900)' }}>
                    {order.buyer_org_name || 'Receiving Buyer'}
                  </strong>
                  <div className="text-muted text-xs">{order.delivery_location || 'Destination Address'}</div>
                </div>
              </div>

              {/* Logistics Notes / Assigned Truck info */}
              {order.supplier_notes && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--gray-300)',
                    fontSize: '0.8125rem',
                    color: 'var(--gray-700)',
                    marginBottom: '16px',
                  }}
                >
                  <strong>Manifest Details:</strong> {order.supplier_notes}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                {['accepted', 'confirmed'].includes(order.status) && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenLogisticsModal(order, 'shipped')}
                  >
                    <Truck size={14} /> Assign Vehicle & Dispatch Load
                  </button>
                )}

                {order.status === 'shipped' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenLogisticsModal(order, 'delivered')}
                  >
                    <CheckCircle2 size={14} /> Mark Consignment Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {targetStatus === 'shipped' ? 'Dispatch Consignment Vehicle' : 'Confirm Delivery Completion'}
                </h3>
                <span className="text-muted text-xs">{selectedOrder.order_number} • {selectedOrder.material_type}</span>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleLogisticsSubmit}>
              <div className="modal-body">
                {targetStatus === 'shipped' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Vehicle Registration Number *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. GJ-05-BX-4921 or MH-12-DE-1049"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Driver Full Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Ramesh Singh"
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Driver Contact Phone</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="+91 98765 43210"
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8125rem',
                        color: 'var(--primary-200)',
                      }}
                    >
                      Dispatching this shipment will notify both the supplier and buyer plants with real-time in-transit status.
                    </div>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--gray-800)' }}>
                    Confirm that consignment <strong>{selectedOrder.order_number}</strong> ({selectedOrder.quantity} {selectedOrder.unit}) has been safely unloaded at <strong>{selectedOrder.delivery_location || 'the buyer plant'}</strong>.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedOrder(null)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Updating...' : targetStatus === 'shipped' ? 'Confirm Vehicle Dispatch' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
