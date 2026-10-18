import { Link } from 'react-router-dom'
import { Scale, ShieldAlert, CheckCircle2, ArrowLeft, AlertTriangle, FileText, Gavel, Handshake } from 'lucide-react'

export default function TermsOfService() {
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
            <Scale size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-500)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ReSourceX Legal Terms & Trading Rules
            </span>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.85rem', fontWeight: 700, color: 'var(--gray-950)' }}>
              Master Terms of Service & Supply Agreements
            </h1>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--gray-600)', lineHeight: '1.6' }}>
          These Master Terms of Service govern all access, transactions, byproduct listings, and enterprise interactions on the ReSourceX secondary industrial materials platform. By registering or trading on ReSourceX, manufacturing enterprises and verified buyers contractually agree to these binding covenants.
        </p>

        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
          <div><strong>Effective Date:</strong> January 1, 2026</div>
          <div><strong>Applies To:</strong> Manufacturers, Recyclers, Commercial Buyers, Logistics Haulers</div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Anti-Fraud Section */}
        <section
          className="card"
          style={{
            padding: '28px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={22} color="#ef4444" />
            1. Strict Manufacturer Verification & Anti-Fraud Liability
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.7', margin: '0 0 14px' }}>
            ReSourceX is an authentic industrial exchange. Every connected manufacturing enterprise must guarantee the veracity of their material listings. The following acts constitute <strong>Gross Fraud & Material Breach</strong>:
          </p>
          <ul style={{ margin: '0 0 16px', paddingLeft: '22px', fontSize: '0.875rem', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.6' }}>
            <li>Publishing fake, non-existent, or artificially inflated waste inventory quantities.</li>
            <li>Altering, forging, or digitally fabricating laboratory test sheets or weighbridge receipts.</li>
            <li>Concealing toxic, bio-hazardous, medical, or radioactive contaminants within listed byproduct batches.</li>
            <li>Substituting agreed high-grade industrial secondary material with worthless municipal or contaminated silt.</li>
          </ul>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.85rem',
              color: 'var(--gray-800)',
              lineHeight: '1.6',
            }}
          >
            <strong>Enforcement Protocol:</strong> Any manufacturer committing fraud will face immediate account suspension, forfeit of all escrow holdings, permanent corporate blacklisting across industrial regulatory authorities (CPCB, FICCI), and formal criminal prosecution under commercial cheating and environmental protection penal codes.
          </div>
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
            <Handshake size={20} color="var(--primary-500)" />
            2. Verified Product Standard & Waste Passports
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.7', margin: '0 0 12px' }}>
            All secondary material batches must be accompanied by an authenticated Digital Waste Passport. Sellers agree that:
          </p>
          <ul style={{ margin: 0, paddingLeft: '22px', fontSize: '0.875rem', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.6' }}>
            <li>Passports must accurately detail material chemical classification, form, moisture, and batch size.</li>
            <li>Waste batches remain subject to randomized independent third-party lab testing and gate weighbridge audits.</li>
            <li>Buyers maintain the contractual right of sample rejection upon physical delivery if independent QA testing diverges beyond specified tolerance thresholds.</li>
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
            <Gavel size={20} color="var(--primary-500)" />
            3. Dispute Arbitration & Commercial Escrow Settlement
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.7', margin: 0 }}>
            All transactions executed through the ReSourceX platform utilize automated conditional escrow settlement. Funds are released to the supplier only upon verified delivery receipt and buyer quality signoff. In the event of an unresolvable commercial dispute, the matter shall be referred to expedited binding arbitration in Bangalore, India, conducted under the Arbitration and Conciliation Act 1996.
          </p>
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
