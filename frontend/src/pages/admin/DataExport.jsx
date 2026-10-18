import { useState, useEffect } from 'react'
import {
  Database, Download, FileSpreadsheet, ExternalLink,
  Copy, Check, Search, TrendingUp, Building2, ShoppingBag,
  Layers, HardDrive, RefreshCw, AlertCircle, Info
} from 'lucide-react'
import api from '../../api'
import { useAuth } from '../../AuthContext'
import { useToast } from '../../components/Toast'

export default function DataExport() {
  const { token } = useAuth()
  const { addToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetchExportData()
  }, [])

  const fetchExportData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/export/overview')
      setData(res.data)
    } catch (err) {
      addToast('Failed to load export metrics and company sales', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle direct file download with authentication
  const handleDownload = async (endpoint, defaultFilename) => {
    try {
      addToast('Preparing spreadsheet export...', 'info')
      const res = await api.get(endpoint, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', defaultFilename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      addToast('Download started successfully!', 'success')
    } catch (err) {
      addToast('Failed to download file. Please try again.', 'error')
    }
  }

  // Copy TSV data for Google Sheets Ctrl+V
  const copyForGoogleSheets = (type) => {
    if (!data) return
    let tsv = ''
    if (type === 'sales') {
      tsv = 'Company Name\tBusiness Type\tTotal Sales (INR)\tOrders Sold\tVolume Sold (kg)\tTotal Purchases (INR)\tCity\tState\tGST Number\n'
      data.companies.forEach((c) => {
        tsv += `${c.company_name}\t${c.business_type}\t${c.total_sales_inr}\t${c.orders_sold_count}\t${c.volume_sold_kg}\t${c.total_purchases_inr}\t${c.city}\t${c.state}\t${c.tax_id}\n`
      })
    }
    navigator.clipboard.writeText(tsv)
    setCopiedId(type)
    addToast('Copied to clipboard! Just press Ctrl+V in Google Sheets.', 'success')
    setTimeout(() => setCopiedId(null), 3000)
  }

  const copyFormula = (csvEndpoint) => {
    const fullUrl = `${window.location.origin.replace('5173', '8000')}/api/admin/export/csv/${csvEndpoint}?token=${token}`
    const formula = `=IMPORTDATA("${fullUrl}")`
    navigator.clipboard.writeText(formula)
    setCopiedId(`formula_${csvEndpoint}`)
    addToast('Google Sheets formula copied! Paste it into cell A1.', 'success')
    setTimeout(() => setCopiedId(null), 3000)
  }

  const filteredCompanies = (data?.companies || []).filter((c) =>
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.business_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.tax_id && c.tax_id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <span className="text-muted">Loading business intelligence & database assets...</span>
      </div>
    )
  }

  const metrics = data?.metrics || {}
  const dbInfo = data?.database_info || {}

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Enterprise Sales & Google Sheets Hub</h1>
          <p className="page-subtitle">
            Inspect live database storage, analyze company sales volumes, and export reports directly to Google Sheets & Google Drive
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchExportData}>
            <RefreshCw size={16} /> Refresh
          </button>
          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FileSpreadsheet size={16} /> Open Google Sheets <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Database Diagnostic Card */}
      <div
        className="card"
        style={{
          padding: '24px',
          marginBottom: '28px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--blue-subtle)',
                color: 'var(--blue-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--gray-950)', fontWeight: 600 }}>
                  Active Database: {dbInfo.engine || 'SQLite'}
                </h3>
                <span
                  style={{
                    fontSize: '0.725rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  LIVE & CONNECTED
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                Database File: <code style={{ color: '#38bdf8', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{dbInfo.path}</code>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <HardDrive size={14} /> Open Google Drive <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>Database Engine:</span>{' '}
            <strong style={{ color: '#f1f5f9' }}>SQLite 3 (Serverless SQL)</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>Schema Management:</span>{' '}
            <strong style={{ color: '#f1f5f9' }}>SQLAlchemy Declarative Models</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>How to inspect outside app:</span>{' '}
            <span style={{ color: '#cbd5e1' }}>Install <em>SQLite Viewer</em> in IDE or free <em>DB Browser for SQLite</em></span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-value">₹{(metrics.total_sales_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="stat-label">Total Platform Sales (Completed)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <ShoppingBag size={24} />
          </div>
          <div className="stat-value">{metrics.completed_orders_count || 0} / {metrics.total_orders_count || 0}</div>
          <div className="stat-label">Orders Completed / Total Placed</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <Building2 size={24} />
          </div>
          <div className="stat-value">{metrics.total_companies_count || 0}</div>
          <div className="stat-label">Registered Enterprise Companies</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Layers size={24} />
          </div>
          <div className="stat-value">{(metrics.total_sales_volume_kg || 0).toLocaleString()} kg</div>
          <div className="stat-label">Total Material Traded Volume</div>
        </div>
      </div>

      {/* Export Action Cards (4 Core Datasets) */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--gray-900)' }}>
        1-Click Downloads & Google Sheets Sync
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1: Company Sales Breakdown */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                <TrendingUp size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Company Sales Breakdown</h3>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '16px', lineHeight: 1.5 }}>
              Total completed sales revenue, volume traded, buyer purchases, city, state, and GST tax IDs for each enterprise.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
              onClick={() => handleDownload('/admin/export/csv/sales-by-company', 'resourcex_company_sales.csv')}
            >
              <Download size={14} /> Download CSV for Sheets / Excel
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => copyForGoogleSheets('sales')}
              >
                {copiedId === 'sales' ? <Check size={14} color="#059669" /> : <Copy size={14} />} Copy for Sheets
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => copyFormula('sales-by-company')}
                title="Copy =IMPORTDATA formula for Google Sheets live sync"
              >
                {copiedId === 'formula_sales-by-company' ? <Check size={14} color="#059669" /> : <ExternalLink size={14} />} Live Formula
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Orders Ledger */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
                <ShoppingBag size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Complete Orders Ledger</h3>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '16px', lineHeight: 1.5 }}>
              All transaction records including order numbers, dates, seller & buyer organizations, material types, rates, and logistics costs.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
              onClick={() => handleDownload('/admin/export/csv/orders', 'resourcex_orders_ledger.csv')}
            >
              <Download size={14} /> Download Orders CSV
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => copyFormula('orders')}
            >
              {copiedId === 'formula_orders' ? <Check size={14} color="#059669" /> : <ExternalLink size={14} />} Copy Google Sheets Formula
            </button>
          </div>
        </div>

        {/* Card 3: Company Master Directory */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed' }}>
                <Building2 size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Company Master Directory</h3>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '16px', lineHeight: 1.5 }}>
              Full directory of verified and pending factories, recyclers, buyers, GST numbers, contact persons, emails, and phone numbers.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
              onClick={() => handleDownload('/admin/export/csv/companies', 'resourcex_companies_directory.csv')}
            >
              <Download size={14} /> Download Companies CSV
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => copyFormula('companies')}
            >
              {copiedId === 'formula_companies' ? <Check size={14} color="#059669" /> : <ExternalLink size={14} />} Copy Google Sheets Formula
            </button>
          </div>
        </div>

        {/* Card 4: Master Dataset */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
                <Database size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>All-in-One Master Dataset</h3>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '16px', lineHeight: 1.5 }}>
              Consolidated enterprise file combining order histories, active waste passports, and organization profiles for backup or BI tools.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
              onClick={() => handleDownload('/admin/export/csv/master', 'resourcex_master_dataset.csv')}
            >
              <Download size={14} /> Download Master CSV
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => copyFormula('master')}
            >
              {copiedId === 'formula_master' ? <Check size={14} color="#059669" /> : <ExternalLink size={14} />} Copy Google Sheets Formula
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets Step-by-Step Instructions */}
      <div
        className="card"
        style={{
          padding: '20px',
          marginBottom: '32px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Info size={18} color="var(--primary-600)" />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-900)' }}>
            How to View in Google Sheets & Google Drive
          </h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '0.85rem', color: 'var(--gray-700)' }}>
          <div>
            <strong>Option A: Upload to Google Drive / Sheets</strong>
            <ol style={{ paddingLeft: '18px', margin: '6px 0 0 0', lineHeight: 1.6 }}>
              <li>Click <strong>"Download CSV"</strong> above.</li>
              <li>Go to <a href="https://drive.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-600)', textDecoration: 'underline' }}>Google Drive</a> and drag & drop the CSV.</li>
              <li>Double-click the file to open directly in Google Sheets!</li>
            </ol>
          </div>

          <div>
            <strong>Option B: Quick Copy & Paste</strong>
            <ol style={{ paddingLeft: '18px', margin: '6px 0 0 0', lineHeight: 1.6 }}>
              <li>Click <strong>"Copy for Sheets"</strong>.</li>
              <li>Click <strong>"Open Google Sheets"</strong> (or open a sheet).</li>
              <li>Select cell <strong>A1</strong> and press <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px' }}>Ctrl + V</kbd>. All columns populate instantly!</li>
            </ol>
          </div>

          <div>
            <strong>Option C: Live Auto-Sync Formula</strong>
            <ol style={{ paddingLeft: '18px', margin: '6px 0 0 0', lineHeight: 1.6 }}>
              <li>Click <strong>"Live Formula"</strong> on any card above.</li>
              <li>Open Google Sheets and paste into cell <strong>A1</strong>.</li>
              <li>Google Sheets will fetch and auto-refresh the data live from your API!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Detailed Company Sales Table */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              Company Sales Performance Breakdown
            </h3>
            <p className="text-muted text-xs" style={{ margin: '4px 0 0 0' }}>
              Real-time sales value, order frequency, and volume traded by company
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search company or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => copyForGoogleSheets('sales')}
            >
              <Copy size={14} /> Copy Table
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Business Type</th>
                <th>Location</th>
                <th style={{ textAlign: 'right' }}>Total Sales (INR)</th>
                <th style={{ textAlign: 'center' }}>Orders Sold</th>
                <th style={{ textAlign: 'right' }}>Volume Sold</th>
                <th style={{ textAlign: 'right' }}>Total Purchases (INR)</th>
                <th>GST / Tax ID</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="text-muted">No companies found matching search criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{c.company_name}</div>
                      <div className="text-muted text-xs">{c.owner_email}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                        {c.business_type}
                      </span>
                    </td>
                    <td>
                      <div>{c.city}, {c.state}</div>
                      <span className="badge badge-gray text-xs">{c.country}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: c.total_sales_inr > 0 ? '#059669' : 'var(--gray-600)' }}>
                      ₹{c.total_sales_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-blue">
                        {c.orders_sold_count} sold
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {c.volume_sold_kg > 0 ? `${c.volume_sold_kg.toLocaleString()} kg` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--gray-700)' }}>
                      ₹{c.total_purchases_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px' }}>
                        {c.tax_id}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.contact_person}</div>
                      <div className="text-muted text-xs">{c.owner_phone}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
