import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart, Truck, CheckCircle2, Clock, XCircle,
  AlertCircle, ChevronRight, FileText, ArrowRight, RefreshCw, X,
  Sparkles, ShieldCheck, MapPin, Building2, ExternalLink
} from 'lucide-react'
import api from '../api'
import { useAuth } from '../AuthContext'
import { useToast } from '../components/Toast'

export default function Orders() {
  const { user, isAdmin } = useAuth()
  const { addToast } = useToast()

  const [orders, setOrders] = useState([])
  const [currentOrg, setCurrentOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  // Status Update Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [targetStatus, setTargetStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  // AI Feasibility Check Modal
  const [aiCheckOrder, setAiCheckOrder] = useState(null)
  const [aiReport, setAiReport] = useState(null)
  const [loadingAi, setLoadingAi] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ordersRes, orgRes] = await Promise.allSettled([
        api.get('/orders/my'),
        api.get('/organizations/me'),
      ])

      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value.data)
      }
      if (orgRes.status === 'fulfilled') {
        setCurrentOrg(orgRes.value.data)
      }
    } catch (err) {
      addToast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenStatusModal = (order, nextStatus) => {
    setSelectedOrder(order)
    setTargetStatus(nextStatus)
    setStatusNotes('')
  }

  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await api.put(`/orders/${selectedOrder.id}/status`, {
        status: targetStatus,
        notes: statusNotes,
      })
      addToast(`Order transitioned to '${targetStatus.replace('_', ' ')}'`, 'success')
      setSelectedOrder(null)
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update order status'
      addToast(typeof msg === 'string' ? msg : 'Error updating status', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleAdminVerifyOrder = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/admin-verify`, {
        verified: true,
        notes: 'Quality assay, net tare weighbridge slip, and verified delivery manifest certified by ReSourceX administrator.'
      })
      addToast('Order consignment officially verified by admin!', 'success')
      fetchData()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to verify order', 'error')
    }
  }

  const handleRunAiCheck = async (order) => {
    setAiCheckOrder(order)
    setLoadingAi(true)
    setAiReport(null)
    try {
      const res = await api.post('/ai/order-feasibility', { order_id: order.id })
      setAiReport(res.data)
    } catch (err) {
      addToast('Failed to run AI Feasibility Check', 'error')
    } finally {
      setLoadingAi(false)
    }
  }

  const handleAiAutoAccept = async () => {
    if (!aiCheckOrder) return
    setUpdating(true)
    try {
      await api.put(`/orders/${aiCheckOrder.id}/status`, {
        status: 'accepted',
        notes: '[AI Smart Auto-Accept] Order passed feasibility audit and was confirmed by seller.',
      })
      addToast(`Order ${aiCheckOrder.order_number} confirmed with AI!`, 'success')
      setAiCheckOrder(null)
      fetchData()
    } catch (err) {
      addToast('Error during auto-confirmation', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'buying') return currentOrg && o.buyer_org_id === currentOrg.id
    if (filterStatus === 'selling') return currentOrg && o.supplier_org_id === currentOrg.id
    if (filterStatus === 'active') return !['completed', 'cancelled'].includes(o.status)
    if (filterStatus === 'completed') return o.status === 'completed'
    return true
  })

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-green"><CheckCircle2 size={13} /> Completed & Settled</span>
      case 'shipped':
        return <span className="badge badge-blue"><Truck size={13} /> In Transit (Shipped)</span>
      case 'delivered':
        return <span className="badge badge-purple"><CheckCircle2 size={13} /> Delivered to Plant</span>
      case 'accepted':
      case 'confirmed':
        return <span className="badge badge-green"><Clock size={13} /> Confirmed by Factory</span>
      case 'cancelled':
        return <span className="badge badge-red"><XCircle size={13} /> Cancelled</span>
      case 'disputed':
        return <span className="badge badge-red"><AlertCircle size={13} /> Disputed</span>
      default:
        return <span className="badge badge-yellow"><Clock size={13} /> Pending Supplier Acceptance</span>
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Commercial Purchase Orders</h1>
          <p className="page-subtitle">
            Role-aware material contracts, AI feasibility audits, and logistics status tracking
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>
          <RefreshCw size={16} /> Refresh Orders
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'All Orders', value: 'all' },
          { label: '🛍️ My Purchases (Buyer)', value: 'buying' },
          { label: '🏭 Incoming Factory Orders (Supplier)', value: 'selling' },
          { label: 'In Transit / Active', value: 'active' },
          { label: 'Completed', value: 'completed' },
        ].map((tab) => (
          <button
            key={tab.value}
            className={`btn btn-sm ${filterStatus === tab.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading commercial transactions...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card empty-state">
          <ShoppingCart size={48} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Orders Found</h3>
          <p className="empty-state-text">
            {orders.length === 0
              ? 'No commercial transactions initiated yet. Browse the marketplace to place material requests.'
              : 'No orders match this status tab.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map((order) => {
            const isBuyer = currentOrg && order.buyer_org_id === currentOrg.id
            const isSupplier = currentOrg && order.supplier_org_id === currentOrg.id

            return (
              <div key={order.id} className="card" style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: 'var(--gray-900)' }}>
                        {order.order_number}
                      </span>

                      {/* Admin Verification Badge */}
                      {order.admin_verified ? (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} /> Admin Verified
                        </span>
                      ) : (
                        <span className="badge badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Pending Admin Audit
                        </span>
                      )}

                      {/* Explicit Role Badge */}
                      {isBuyer ? (
                        <span className="badge badge-blue">
                          🛍️ Purchase Request (Buyer)
                        </span>
                      ) : isSupplier ? (
                        <span className="badge badge-purple">
                          🏭 Sales Order (Supplier)
                        </span>
                      ) : (
                        <span className="badge badge-gray">Transporter / Admin View</span>
                      )}

                      {renderStatusBadge(order.status)}

                      <Link
                        to={`/verify-passport?id=${encodeURIComponent(order.order_number)}&type=order`}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.725rem', padding: '2px 8px', border: '1px solid var(--border-subtle)', height: '24px' }}
                        title="Verify this order consignment on ReSourceX official registry"
                      >
                        <ShieldCheck size={12} color="var(--primary-600)" /> Verify Passport
                      </Link>
                    </div>
                    <span className="text-muted text-xs">
                      Initiated on {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                      ₹{order.total_cost?.toLocaleString()}
                    </div>
                    <span className="text-muted text-xs">
                      {order.quantity} {order.unit} @ ₹{order.price_per_unit}/{order.unit}
                    </span>
                  </div>
                </div>

                {/* Parties and Material Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    padding: '16px 20px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '16px',
                    fontSize: '0.875rem',
                  }}
                >
                  <div>
                    <span className="text-muted text-xs" style={{ display: 'block' }}>Material Stream</span>
                    <strong style={{ fontSize: '0.9375rem' }}>{order.material_type || 'Industrial Byproduct'}</strong>
                  </div>

                  <div>
                    <span className="text-muted text-xs" style={{ display: 'block' }}>Supplier (Factory)</span>
                    <strong>{order.supplier_org_name || 'Supplying Facility'}</strong>
                  </div>

                  <div>
                    <span className="text-muted text-xs" style={{ display: 'block' }}>Buyer (Procurement)</span>
                    <strong>{order.buyer_org_name || 'Buyer Enterprise'}</strong>
                  </div>

                  <div>
                    <span className="text-muted text-xs" style={{ display: 'block' }}>Delivery Destination</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="var(--primary-600)" />
                      {order.delivery_location || 'Not Specified'}
                    </strong>
                  </div>
                </div>

                {order.buyer_notes && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-700)', marginBottom: '14px', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-muted font-semibold">Buyer Instructions: </span>
                    <em>"{order.buyer_notes}"</em>
                  </div>
                )}

                {order.supplier_notes && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-700)', marginBottom: '14px', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-muted font-semibold">Supplier / Logistics Notes: </span>
                    <em>"{order.supplier_notes}"</em>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    ROLE-AWARE ACTION BAR
                   ═══════════════════════════════════════════════════════════════ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  {/* Status explanation */}
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                    {order.status === 'requested' && isBuyer && (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>
                        ⏳ Your request is awaiting supplier review. The seller factory will accept or decline.
                      </span>
                    )}
                    {order.status === 'requested' && isSupplier && (
                      <span style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
                        📩 You received this order. Review terms and click 'Accept & Confirm' or run the AI check.
                      </span>
                    )}
                    {['accepted', 'confirmed'].includes(order.status) && (
                      <span style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
                        ✅ Order confirmed! Ready for carrier pickup & dispatch.
                      </span>
                    )}
                    {order.status === 'shipped' && (
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>
                        🚚 Shipment is in transit with the logistics carrier.
                      </span>
                    )}
                    {order.status === 'delivered' && isBuyer && (
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                        📦 Consignment delivered! Please inspect material and confirm completion.
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* BUYER ACTIONS */}
                    {isBuyer && (
                      <>
                        {order.status === 'requested' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenStatusModal(order, 'cancelled')}
                          >
                            Cancel Request
                          </button>
                        )}

                        {order.status === 'shipped' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenStatusModal(order, 'delivered')}
                          >
                            <CheckCircle2 size={14} /> Confirm Delivery Received
                          </button>
                        )}

                        {order.status === 'delivered' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenStatusModal(order, 'completed')}
                          >
                            <CheckCircle2 size={14} /> Accept & Settle Order
                          </button>
                        )}
                      </>
                    )}

                    {/* SUPPLIER ACTIONS */}
                    {isSupplier && (
                      <>
                        {order.status === 'requested' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => handleRunAiCheck(order)}
                            >
                              <Sparkles size={14} color="#7c3aed" /> AI Smart Check
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenStatusModal(order, 'cancelled')}
                            >
                              Decline Request
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenStatusModal(order, 'accepted')}
                            >
                              <CheckCircle2 size={14} /> Accept & Confirm Order
                            </button>
                          </>
                        )}

                        {['accepted', 'confirmed'].includes(order.status) && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenStatusModal(order, 'cancelled')}
                            >
                              Cancel Order
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenStatusModal(order, 'shipped')}
                            >
                              <Truck size={14} /> Dispatch / Mark as Shipped
                            </button>
                          </>
                        )}

                        {order.status === 'shipped' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenStatusModal(order, 'delivered')}
                          >
                            Mark Delivered
                          </button>
                        )}
                      </>
                    )}

                    {/* ADMIN ACTION: CERTIFY & VERIFY ORDER */}
                    {isAdmin && (
                      <button
                        className={`btn ${order.admin_verified ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        onClick={() => handleAdminVerifyOrder(order.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        title="Audit assay, weighbridge net tare slip, and verify consignment"
                      >
                        <ShieldCheck size={14} color={order.admin_verified ? '#10b981' : 'white'} />
                        <span>{order.admin_verified ? 'Audit Passed (Re-Verify)' : 'Admin Verify Order'}</span>
                      </button>
                    )}

                    {/* Admin / General fallback if not party */}
                    {!isBuyer && !isSupplier && !isAdmin && (
                      <span className="text-muted text-xs">Viewing mode</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* AI Smart Feasibility Check Modal */}
      {aiCheckOrder && (
        <div className="modal-overlay" onClick={() => setAiCheckOrder(null)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#7c3aed" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  AI Order Feasibility & Risk Audit
                </h3>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setAiCheckOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {loadingAi ? (
                <div className="loading-screen" style={{ minHeight: '180px' }}>
                  <div className="loader" />
                  <span className="text-muted">Analyzing supplier capacity, distance, and buyer trust score...</span>
                </div>
              ) : aiReport ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--gray-950)',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Feasibility Index
                      </span>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-950)' }}>
                        {aiReport.feasibility_score}%
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        className="badge"
                        style={{
                          background: aiReport.recommendation === 'AUTO_ACCEPT' ? 'var(--primary-500)' : '#f59e0b',
                          color: 'white',
                          padding: '6px 12px',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {aiReport.recommendation === 'AUTO_ACCEPT' ? '✨ Recommended: Auto Accept' : '⚠️ Manual Review'}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-800)', lineHeight: '1.5', marginBottom: '16px' }}>
                    {aiReport.summary_explanation}
                  </p>

                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                      Verified Positive Factors:
                    </span>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.8125rem', color: 'var(--primary-300)', marginTop: '4px' }}>
                      {aiReport.positive_factors.map((p, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div>
                      <span className="text-muted">Estimated Transit Distance:</span>
                      <div><strong>{aiReport.estimated_distance_km} km</strong> (~{aiReport.estimated_transit_hours} hrs)</div>
                    </div>
                    <div>
                      <span className="text-muted">Carbon Abatement:</span>
                      <div><strong>{aiReport.carbon_saved_kg} kg CO2e</strong></div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAiCheckOrder(null)}>
                Close
              </button>
              {aiReport?.recommendation === 'AUTO_ACCEPT' && (
                <button
                  className="btn btn-primary"
                  onClick={handleAiAutoAccept}
                  disabled={updating}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={15} /> 🤖 1-Click AI Smart Accept
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Regular Status Update Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                Update Order: {targetStatus.replace('_', ' ').toUpperCase()}
              </h3>
              <button className="btn-ghost btn-icon" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleStatusSubmit}>
              <div className="modal-body">
                <p className="text-sm" style={{ marginBottom: '14px', color: 'var(--gray-400)' }}>
                  Are you sure you want to transition order <strong>{selectedOrder.order_number}</strong> to{' '}
                  <span style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--primary-400)' }}>
                    {targetStatus.replace('_', ' ')}
                  </span>
                  ?
                </p>

                {targetStatus === 'completed' && (
                  <div
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      fontSize: '0.8125rem',
                      color: 'var(--primary-200)',
                      marginBottom: '14px',
                    }}
                  >
                    Completing this order will deduct {selectedOrder.quantity} {selectedOrder.unit} from available factory inventory.
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Notes / Logistics Carrier Reference</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Provide tracking reference, invoice number, or delivery notes..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>
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
                  {updating ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
