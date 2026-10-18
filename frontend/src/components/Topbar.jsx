import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu, ShieldCheck } from 'lucide-react'
import { useAuth } from '../AuthContext'
import api from '../api'

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count')
        setUnreadCount(res.data.count)
      } catch {
        // ignore
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="btn btn-icon btn-ghost mobile-menu-btn"
          onClick={onMenuClick}
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="page-title" style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700 }}>
            {getGreeting()}, <span style={{ color: 'var(--primary-600)' }}>{user?.full_name?.split(' ')[0] || 'User'}</span>
          </h1>
          {user?.role && (
            <span
              className="badge badge-blue"
              style={{ fontSize: '0.675rem', padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}
            >
              {user.role.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
      <div className="topbar-right">
        {/* Verify Passport Quick Action */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/verify-passport')}
          style={{
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
            color: 'var(--gray-800)',
            fontSize: '0.78rem',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title="Verify any Resource Passport ID"
        >
          <ShieldCheck size={15} color="var(--primary-600)" />
          <span>Verify ID</span>
        </button>

        {/* Notifications */}
        <button
          className="btn btn-icon btn-ghost"
          onClick={() => navigate('/notifications')}
          style={{
            position: 'relative',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
            color: 'var(--gray-700)',
          }}
          title="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 17, height: 17, borderRadius: '50%',
              background: 'var(--primary-500)', color: 'white',
              fontSize: '0.625rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
