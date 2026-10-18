import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import FactoryDashboard from './pages/FactoryDashboard'
import BuyerDashboard from './pages/BuyerDashboard'
import OrganizationSetup from './pages/OrganizationSetup'
import WasteList from './pages/WasteList'
import WastePassport from './pages/WastePassport'
import Inventory from './pages/Inventory'
import Marketplace from './pages/Marketplace'
import BuyerRequirements from './pages/BuyerRequirements'
import Orders from './pages/Orders'
import Logistics from './pages/Logistics'
import Notifications from './pages/Notifications'
import AICopilot from './components/AICopilot'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import OrgVerification from './pages/admin/OrgVerification'
import ListingVerification from './pages/admin/ListingVerification'
import Reports from './pages/admin/Reports'
import AuditLogs from './pages/admin/AuditLogs'
import DataExport from './pages/admin/DataExport'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import PassportVerification from './pages/PassportVerification'
import Scene from './Scene'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <span className="text-muted">Loading...</span>
      </div>
    )
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function DashboardRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  const adminRoles = ['admin', 'super_admin', 'verification_admin', 'moderation_admin', 'support_admin']
  if (adminRoles.includes(user.role)) return <Navigate to="/admin" replace />
  if (user.role === 'buyer') return <Navigate to="/dashboard/buyer" replace />
  if (user.role === 'logistics') return <Navigate to="/logistics" replace />
  return <Navigate to="/dashboard/factory" replace />
}

export default function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh' }}>
        <div className="loader"></div>
        <span className="text-muted">Loading ReSourceX...</span>
      </div>
    )
  }

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/verify-passport" element={<PassportVerification />} />
        <Route path="/verify" element={<PassportVerification />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/scene" element={<Scene />} />
        <Route path="/get-started-button" element={<Scene />} />

        {/* Protected routes with layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardRedirect />} />
          <Route path="verify-passport" element={<PassportVerification />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="dashboard/factory" element={<FactoryDashboard />} />
          <Route path="dashboard/buyer" element={<BuyerDashboard />} />
          <Route path="organization" element={<OrganizationSetup />} />
          <Route path="waste" element={<WasteList />} />
          <Route path="waste/:batchId" element={<WastePassport />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="requirements" element={<BuyerRequirements />} />
          <Route path="orders" element={<Orders />} />
          <Route path="logistics" element={<Logistics />} />
          <Route path="notifications" element={<Notifications />} />

          {/* Admin routes */}
          <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="admin/organizations" element={<AdminRoute><OrgVerification /></AdminRoute>} />
          <Route path="admin/listings" element={<AdminRoute><ListingVerification /></AdminRoute>} />
          <Route path="admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="admin/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
          <Route path="admin/exports" element={<AdminRoute><DataExport /></AdminRoute>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global AI Circular Copilot */}
      {isAuthenticated && <AICopilot />}
    </>
  )
}
