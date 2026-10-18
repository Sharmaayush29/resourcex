import { useState, useEffect } from 'react'
import {
  Users, Search, ShieldAlert, ShieldCheck, UserX,
  UserCheck, AlertTriangle, X, RefreshCw
} from 'lucide-react'
import api from '../../api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../AuthContext'

export default function UserManagement() {
  const { addToast } = useToast()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Block Modal
  const [selectedUser, setSelectedUser] = useState(null)
  const [blockReason, setBlockReason] = useState('fraud')
  const [durationDays, setDurationDays] = useState('')
  const [blockNotes, setBlockNotes] = useState('')
  const [submittingBlock, setSubmittingBlock] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = {}
      if (roleFilter) params.role = roleFilter
      if (statusFilter) params.status = statusFilter
      if (searchTerm) params.search = searchTerm

      const res = await api.get('/admin/users', { params })
      setUsers(res.data)
    } catch (err) {
      addToast('Failed to load user directory', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleBlockSubmit = async (e) => {
    e.preventDefault()
    setSubmittingBlock(true)
    try {
      await api.post(`/admin/users/${selectedUser.id}/block`, {
        reason: blockReason,
        duration_days: durationDays ? parseInt(durationDays, 10) : null,
        notes: blockNotes,
      })
      addToast(`User ${durationDays ? 'suspended' : 'blocked'} successfully`, 'success')
      setSelectedUser(null)
      fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to restrict user'
      addToast(typeof msg === 'string' ? msg : 'Error blocking user', 'error')
    } finally {
      setSubmittingBlock(false)
    }
  }

  const handleUnblock = async (user) => {
    if (!window.confirm(`Are you sure you want to restore access for ${user.full_name}?`)) return
    try {
      await api.post(`/admin/users/${user.id}/unblock`)
      addToast('User access restored successfully', 'success')
      fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to unblock user'
      addToast(typeof msg === 'string' ? msg : 'Error unblocking user', 'error')
    }
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-green">Active</span>
      case 'suspended':
        return <span className="badge badge-yellow">Suspended</span>
      case 'blocked':
        return <span className="badge badge-red">Blocked</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">User Account Governance</h1>
          <p className="page-subtitle">
            Inspect user profiles, manage enterprise roles, and enforce disciplinary suspensions
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchUsers}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ flex: '2 1 240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by full name or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="factory">Factory</option>
              <option value="buyer">Buyer</option>
              <option value="recycler">Recycler</option>
              <option value="logistics">Logistics</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            <Search size={16} /> Filter
          </button>
        </form>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <span className="text-muted">Loading user accounts...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="card empty-state">
          <Users size={48} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No Users Found</h3>
          <p className="empty-state-text">No accounts matched your search criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Account Status</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{u.full_name}</div>
                    <div className="text-muted text-xs">{u.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.phone || '—'}</td>
                  <td>{renderStatusBadge(u.account_status)}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {u.id === currentUser?.id ? (
                      <span className="text-muted text-xs" style={{ fontStyle: 'italic', paddingRight: '8px' }}>
                        Current Account
                      </span>
                    ) : u.role === 'super_admin' ? (
                      <span className="text-muted text-xs" style={{ fontStyle: 'italic', paddingRight: '8px' }}>
                        Protected
                      </span>
                    ) : u.account_status === 'active' ? (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setSelectedUser(u)}
                      >
                        <UserX size={14} /> Restrict
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleUnblock(u)}
                      >
                        <UserCheck size={14} /> Restore Access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Block/Suspend Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Restrict User Access</h3>
                <span className="text-muted text-xs">{selectedUser.full_name} ({selectedUser.email})</span>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setSelectedUser(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBlockSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Violation Category *</label>
                  <select
                    className="form-select"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    required
                  >
                    <option value="fraud">Fraudulent Activity</option>
                    <option value="fake_documents">Forged Compliance Documents</option>
                    <option value="fake_waste">Fictitious Waste Listings</option>
                    <option value="repeated_complaints">Repeated Buyer/Supplier Complaints</option>
                    <option value="payment_issues">Defaulted Payments / Breach</option>
                    <option value="policy_violation">Platform Terms Violation</option>
                    <option value="suspicious_activity">Suspicious Activity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Suspension Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave blank for permanent ban / block"
                    className="form-input"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                  />
                  <span className="text-muted text-xs">
                    If specified, account is temporarily suspended for X days. If left empty, user is blocked indefinitely.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Moderator Audit Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Reference specific transaction IDs, investigation rationale, or dispute links..."
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedUser(null)}
                  disabled={submittingBlock}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={submittingBlock}>
                  {submittingBlock ? 'Applying...' : durationDays ? 'Suspend User' : 'Permanently Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
