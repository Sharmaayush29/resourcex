import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useToast } from '../components/Toast'
import { Recycle, Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      addToast('Welcome back!', 'success')
      navigate('/')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail)
    setPassword(demoPass)
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Recycle size={30} color="white" />
          </div>
          <h1 className="auth-title">Welcome to ReSourceX</h1>
          <p className="auth-subtitle">Sign in to your enterprise account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                id="login-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: 44 }}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                id="login-password"
                type="password"
                className="form-input"
                style={{ paddingLeft: 44 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one</Link>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray-500)', lineHeight: '1.5' }}>
          By signing in, you agree to ReSourceX's{' '}
          <Link to="/terms" style={{ color: 'var(--primary-500)', textDecoration: 'underline' }}>Terms of Service</Link>{' '}
          and{' '}
          <Link to="/privacy" style={{ color: 'var(--primary-500)', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </div>
      </div>
    </div>
  )
}
