import { useState, useEffect } from 'react'
import {
  Bell, Check, CheckCheck, Clock, ShieldAlert,
  FileCheck, ShoppingBag, Info, AlertTriangle
} from 'lucide-react'
import api from '../api'
import { useToast } from '../components/Toast'

export default function Notifications() {
  const { addToast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await api.get('/notifications/')
      setNotifications(res.data)
    } catch (err) {
      addToast('Failed to load notifications', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      addToast('Error marking notification as read', 'error')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      addToast('All notifications marked as read', 'success')
    } catch (err) {
      addToast('Error marking all as read', 'error')
    }
  }

  const renderIcon = (type) => {
    switch (type) {
      case 'verification_result':
        return <FileCheck size={20} color="var(--primary-600)" />
      case 'new_buyer_request':
        return <ShoppingBag size={20} color="var(--accent-600)" />
      case 'account_blocked':
      case 'account_suspended':
        return <ShieldAlert size={20} color="var(--error)" />
      default:
        return <Bell size={20} color="var(--info)" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="page-content" style={{ maxWidth: '900px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Notifications & System Alerts</h1>
          <p className="page-subtitle">
            Stay informed on verification updates, incoming order requests, and security alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading alerts...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card empty-state">
          <Bell size={48} color="var(--gray-300)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Notifications</h3>
          <p className="empty-state-text">You're all caught up with your latest platform events.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="card animate-fade-in"
              style={{
                padding: '16px 20px',
                borderLeft: notif.is_read ? '4px solid rgba(255, 255, 255, 0.1)' : '4px solid var(--primary-400)',
                background: notif.is_read ? 'var(--bg-primary)' : 'rgba(59, 130, 246, 0.12)',
                boxShadow: notif.is_read ? 'none' : '0 0 15px rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '2px' }}>{renderIcon(notif.type)}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: notif.is_read ? 600 : 700, color: 'var(--gray-900)' }}>
                      {notif.title}
                    </h4>
                    {!notif.is_read && (
                      <span className="badge badge-green" style={{ fontSize: '0.6875rem' }}>
                        New
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.5' }}>
                    {notif.message}
                  </p>
                  <span className="text-muted text-xs" style={{ display: 'inline-block', marginTop: '6px' }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleMarkAsRead(notif.id)}
                  title="Mark as read"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
