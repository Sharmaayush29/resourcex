import { Link } from 'react-router-dom'
import { Shield, Lock, FileCheck, Eye, ArrowLeft, Mail, Building, Scale, AlertCircle } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Back button */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: 'var(--primary-500)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back to ReSourceX Platform
        </Link>
      </div>

      {/* Header */}
      <div
        className="card"
        style={{
          padding: '36px',
          marginBottom: '32px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--blue-subtle)',
              color: 'var(--blue-accent)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-500)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ReSourceX Legal & Compliance Framework
            </span>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.85rem', fontWeight: 700, color: 'var(--gray-950)' }}>
              Enterprise Privacy & Data Protection Policy
            </h1>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--gray-600)', lineHeight: '1.6' }}>
          ReSourceX Technologies Inc. ("ReSourceX", "we", "us", or "our") operates a B2B circular secondary raw material and industrial waste marketplace. This document outlines how corporate identity, manufacturing byproduct data, chemical assay certificates, and transaction records are safeguarded.
        </p>

        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
          <div><strong>Effective Date:</strong> January 1, 2026</div>
          <div><strong>Version:</strong> 2.4 (Enterprise Production)</div>
          <div><strong>Jurisdiction:</strong> Information Technology Act 2000 & DPDP Act 2023</div>
        </div>
      </div>

      {/* Main Policy Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Section 1 */}
        <section
          className="card"
          style={{
            padding: '28px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-950)', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={20} color="var(--primary-500)" />
            1. Corporate & Operational Information We Collect
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.7', margin: '0 0 12px' }}>
            To facilitate authenticated circular byproduct trade, we collect necessary business and operational data:
          </p>
          <ul style={{ margin: 0, paddingLeft: '22px', fontSize: '0.875rem', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.6' }}>
            <li><strong>Corporate Legal Identity:</strong> Registered Company Name, Corporate Identification Number (CIN), Goods & Services Tax Identification Number (GSTIN), factory licenses, and registered office addresses.</li>
            <li><strong>Authorized Signatory & Contact Data:</strong> Official email addresses, phone numbers, designation of procurement and environmental compliance heads.</li>
            <li><strong>Digital Waste Passport & Material Assays:</strong> Byproduct chemical formulas, moisture content, ash content, physical state, batch weights, origin facility coordinates, and laboratory test reports.</li>
            <li><strong>Transaction & Manifest Telemetry:</strong> Commercial invoice figures, weighbridge net tare gross records, GPS dispatch waypoints, vehicle registration numbers, and driver bills of lading.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section
          className="card"
          style={{
            padding: '28px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-950)', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={20} color="var(--primary-500)" />
            2. Proprietary Industrial Trade Secret Protection
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.7', margin: '0 0 12px' }}>
            We understand that industrial byproduct composition often mirrors proprietary production processes. ReSourceX guarantees:
          </p>
          <ul style={{ margin: 0, paddingLeft: '22px', fontSize: '0.875rem', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.6' }}>
            <li><strong>Zero Public Recipe Exposure:</strong> Manufacturing recipe details and proprietary chemical formulation techniques are strictly quarantined. Only verified byproduct specifications needed for secondary utilization are displayed.</li>
            <li><strong>Anonymized Sourcing Options:</strong> Enterprise sellers can opt for blind listings where factory names are masked until bilateral commercial NDA execution and earnest escrow deposits are locked.</li>
            <li><strong>End-to-End Encryption:</strong> Uploaded laboratory audit reports and regulatory environmental documents are encrypted at rest using AES-256 and transmitted via TLS 1.3.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section
          className="card"
          style={{
            padding: '28px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-950)', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={20} color="var(--primary-500)" />
            3. Purpose of Processing & AI Matching
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.7', margin: '0 0 12px' }}>
            Your industrial information is used exclusively for verified platform operations:
          </p>
          <ul style={{ margin: 0, paddingLeft: '22px', fontSize: '0.875rem', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.6' }}>
            <li><strong>Circular Matchmaking Engine:</strong> Matching industrial waste streams with recycling plants, cement kilns, foundries, and chemical secondary refiners seeking identical feedstock.</li>
            <li><strong>Statutory Waste Passports & ESG Audits:</strong> Generating immutable Digital Waste Passports and carbon offset reduction certificates for Corporate Sustainability Disclosures.</li>
            <li><strong>Logistics Route Optimization:</strong> Calculating consolidated freight corridors to minimize empty deadhead return miles and reduce secondary haulage expenditures.</li>
            <li><strong>Anti-Fraud & Quality Assurance:</strong> Cross-referencing weighbridge sensor data with invoice declarations to eliminate counterfeit or hazardous waste dumping.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section
          className="card"
          style={{
            padding: '28px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-950)', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={20} color="var(--primary-500)" />
            4. Statutory Disclosures & Anti-Fraud Legal Action
          </h2>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
              <AlertCircle size={18} />
              Strict Anti-Fraud & Regulatory Cooperation Policy
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-700)', lineHeight: '1.6' }}>
              ReSourceX maintains zero tolerance for commercial fraud, hazardous adulteration, or forged certificates. In the event of fraudulent activity, deceptive material substitution, or illegal toxic dumping, we reserve the unconditional statutory right to disclose full corporate audit trails, telemetry logs, and IP history to the Central Pollution Control Board (CPCB), State Pollution Control Boards (SPCBs), economic fraud intelligence units, and law enforcement agencies without prior notice.
            </p>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.7', margin: 0 }}>
            Outside of lawful judicial mandates or fraud investigations, we never sell, monetize, or lease your corporate business data to third-party ad networks or brokers.
          </p>
        </section>

        {/* Section 5 */}
        <section
          className="card"
          style={{
            padding: '28px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-950)', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={20} color="var(--primary-500)" />
            5. Legal & Data Protection Officer Contact
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.7', margin: '0 0 16px' }}>
            For privacy inquiries, audit trail review requests, or legal compliance notices, please contact our Legal & Statutory Grievance Cell:
          </p>
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              lineHeight: '1.6',
            }}
          >
            <div><strong>Grievance & Data Protection Officer:</strong> Legal Cell, ReSourceX Technologies</div>
            <div><strong>Corporate Email:</strong> <a href="mailto:compliance@resourcex.com" style={{ color: 'var(--primary-500)' }}>compliance@resourcex.com</a> / <a href="mailto:legal@resourcex.com" style={{ color: 'var(--primary-500)' }}>legal@resourcex.com</a></div>
            <div><strong>Headquarters:</strong> Tower B, Industrial Cyber Park, Bangalore, Karnataka 560100, India</div>
          </div>
        </section>
      </div>

      {/* Footer Links */}
      <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
        <span>© 2026 ReSourceX Industrial Secondary Marketplace. All rights reserved.</span>
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Link to="/terms" style={{ color: 'var(--gray-500)', textDecoration: 'underline' }}>Terms of Service</Link>
          <Link to="/privacy" style={{ color: 'var(--gray-500)', textDecoration: 'underline' }}>Privacy Policy</Link>
          <Link to="/organization" style={{ color: 'var(--gray-500)', textDecoration: 'underline' }}>Manufacturer Accord</Link>
        </div>
      </div>
    </div>
  )
}
