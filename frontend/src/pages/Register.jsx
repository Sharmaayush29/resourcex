import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useToast } from '../components/Toast'
import { Recycle, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react'

const ROLES = [
  { value: 'factory', label: 'Factory / Manufacturer', desc: 'I produce industrial waste' },
  { value: 'buyer', label: 'Buyer / Recycler', desc: 'I purchase raw materials' },
  { value: 'recycler', label: 'Recycling Company', desc: 'I process waste into materials' },
  { value: 'logistics', label: 'Logistics Provider', desc: 'I transport waste materials' },
]

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'factory',
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      addToast('Account created! Set up your organization next.', 'success')
      navigate('/organization')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Recycle size={28} color="white" />
          </div>
          <h1 className="auth-title">Create Enterprise Account</h1>
          <p className="auth-subtitle">Join ReSourceX Secondary Material Exchange</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                id="register-name"
                type="text"
                name="full_name"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="John Doe"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  id="register-phone"
                  type="tel"
                  name="phone"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                id="register-password"
                type="password"
                name="password"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">I am a</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    padding: '12px 14px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${form.role === r.value ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.1)'}`,
                    background: form.role === r.value ? 'rgba(59, 130, 246, 0.18)' : '#090e1a',
                    boxShadow: form.role === r.value ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: form.role === r.value ? '#ffffff' : 'var(--gray-600)' }}>
                    {r.label}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: form.role === r.value ? 'var(--primary-300)' : 'var(--gray-400)', marginTop: 2 }}>
                    {r.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray-500)', lineHeight: '1.5' }}>
          By creating an enterprise account, you agree to ReSourceX's{' '}
          <Link to="/terms" style={{ color: 'var(--primary-500)', textDecoration: 'underline' }}>Terms of Service</Link>{' '}
          and{' '}
          <Link to="/privacy" style={{ color: 'var(--primary-500)', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </div>
      </div>
    </div>
  )
}
