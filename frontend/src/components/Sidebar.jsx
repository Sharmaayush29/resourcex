import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import {
  LayoutDashboard, Factory, Package, ShoppingCart, FileText,
  ClipboardList, Bell, Building2, Settings, LogOut, Recycle,
  Users, Shield, AlertTriangle, ScrollText, Search, X, Truck,
  FileSpreadsheet, ShieldCheck
} from 'lucide-react'

const factoryLinks = [
  { section: 'Overview', items: [
    { to: '/dashboard/factory', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'Waste Management', items: [
    { to: '/waste', icon: Package, label: 'My Waste' },
    { to: '/inventory', icon: ClipboardList, label: 'Inventory' },
    { to: '/verify-passport', icon: ShieldCheck, label: 'Verify Passport' },
  ]},
  { section: 'Trade & Logistics', items: [
    { to: '/marketplace', icon: Search, label: 'Marketplace' },
    { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/logistics', icon: Truck, label: 'Logistics & Fleet' },
  ]},
  { section: 'Account', items: [
    { to: '/organization', icon: Building2, label: 'Organization' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ]},
]

const buyerLinks = [
  { section: 'Overview', items: [
    { to: '/dashboard/buyer', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'Sourcing', items: [
    { to: '/marketplace', icon: Search, label: 'Marketplace' },
    { to: '/requirements', icon: FileText, label: 'Requirements' },
    { to: '/verify-passport', icon: ShieldCheck, label: 'Verify Passport' },
  ]},
  { section: 'Trade & Transport', items: [
    { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/logistics', icon: Truck, label: 'Logistics Tracking' },
  ]},
  { section: 'Account', items: [
    { to: '/organization', icon: Building2, label: 'Organization' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ]},
]

const logisticsLinks = [
  { section: 'Logistics Console', items: [
    { to: '/logistics', icon: Truck, label: 'Dispatch Manifests' },
    { to: '/orders', icon: ShoppingCart, label: 'Shipment Orders' },
    { to: '/verify-passport', icon: ShieldCheck, label: 'Verify Passport' },
  ]},
  { section: 'Network', items: [
    { to: '/marketplace', icon: Search, label: 'Marketplace' },
    { to: '/organization', icon: Building2, label: 'Carrier Company' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ]},
]

const adminLinks = [
  { section: 'Admin', items: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/exports', icon: FileSpreadsheet, label: 'Sales & Google Sheets' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/organizations', icon: Shield, label: 'Org Verification' },
    { to: '/admin/listings', icon: Package, label: 'Listings' },
    { to: '/verify-passport', icon: ShieldCheck, label: 'Verify Passport' },
    { to: '/admin/reports', icon: AlertTriangle, label: 'Reports' },
    { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
    { to: '/logistics', icon: Truck, label: 'Logistics Network' },
  ]},
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const adminRoles = ['admin', 'super_admin', 'verification_admin', 'moderation_admin', 'support_admin']
  const isAdmin = adminRoles.includes(user?.role)

  let navSections = factoryLinks
  if (isAdmin) navSections = adminLinks
  else if (user?.role === 'buyer') navSections = buyerLinks
  else if (user?.role === 'logistics') navSections = logisticsLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 99,
        display: 'none',
      }} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Recycle size={20} color="white" />
            </div>
            <div>
              <div className="sidebar-brand-text">ReSourceX</div>
              <div className="sidebar-brand-sub">Circular Material Exchange</div>
            </div>
          </div>
          <button className="btn-icon sidebar-close-btn" onClick={onClose} style={{
            display: 'none', color: 'var(--gray-900)', background: 'none', border: 'none', cursor: 'pointer'
          }}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div className="sidebar-section" key={section.section}>
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/admin' || link.to === '/dashboard/factory' || link.to === '/dashboard/buyer'}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="sidebar-link-icon">
                    <link.icon size={18} />
                  </span>
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
            padding: '8px 10px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.8rem',
              flexShrink: 0,
            }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--gray-900)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.full_name || 'User'}
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '6px' }}>
            <button
              className="btn btn-ghost"
              onClick={handleLogout}
              style={{
                width: '100%',
                color: 'var(--gray-600)',
                fontSize: '0.8rem',
                padding: '7px 10px',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px', fontSize: '0.675rem', color: 'var(--gray-500)' }}>
            <Link to="/privacy" style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" style={{ color: 'var(--gray-500)', textDecoration: 'none' }}>Terms & Anti-Fraud</Link>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 640px) {
          .sidebar-overlay { display: block !important; }
          .sidebar-close-btn { display: block !important; }
        }
      `}</style>
    </>
  )
}
