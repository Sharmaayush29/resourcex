import { useState } from 'react'
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, X, Lock, Building2 } from 'lucide-react'
import api from '../api'
import { useToast } from './Toast'

export default function ManufacturerAgreementModal({ isOpen, onClose, org, onAgreementSigned }) {
  const { addToast } = useToast()
  const [signatoryName, setSignatoryName] = useState(org?.contact_person || '')
  const [signatoryDesignation, setSignatoryDesignation] = useState('Authorized Officer / Plant Head')
  const [agreeVerified, setAgreeVerified] = useState(false)
  const [agreeFraudAction, setAgreeFraudAction] = useState(false)
  const [agreeAuthority, setAgreeAuthority] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const isAlreadySigned = org?.integrity_agreement_signed

  const handleSign = async (e) => {
    e.preventDefault()
    if (!agreeVerified || !agreeFraudAction || !agreeAuthority) {
      addToast('You must acknowledge and accept all three statutory compliance clauses.', 'warning')
      return
    }
    if (!signatoryName.trim() || !signatoryDesignation.trim()) {
      addToast('Signatory name and corporate designation are mandatory.', 'warning')
      return
    }

    try {
      setSubmitting(true)
      const res = await api.post('/organizations/me/agreement', {
        signatory_name: signatoryName,
        signatory_designation: signatoryDesignation,
        accept_verified_product_obligation: agreeVerified,
        accept_anti_fraud_penalties: agreeFraudAction,
        accept_legal_jurisdiction: agreeAuthority,
      })
      addToast('Manufacturer Integrity Agreement successfully executed!', 'success')
      if (onAgreementSigned) {
        onAgreementSigned(res.data)
      }
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to sign agreement'
      addToast(typeof msg === 'string' ? msg : 'Error processing legal execution', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--blue-subtle)',
                color: 'var(--blue-accent)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--gray-950)' }}>
                Manufacturer Integrity & Verified Product Accord
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                Ref: W2R-LEGAL-MFR-2026 • Statutory Anti-Fraud & Quality Assurance
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: 'var(--gray-500)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Legal Agreement Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: 'var(--gray-700)',
          }}
        >
          {isAlreadySigned ? (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CheckCircle2 color="#10b981" size={22} />
                <strong style={{ color: '#10b981', fontSize: '1rem' }}>
                  Legally Executed & In Good Standing
                </strong>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--gray-700)' }}>
                This manufacturing enterprise is legally verified and bound by the ReSourceX Strict Quality & Anti-Fraud Master Agreement.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  fontSize: '0.8rem',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span className="text-muted">Signatory:</span>{' '}
                  <strong>{org?.integrity_agreement_data?.signatory_name || org?.contact_person}</strong>
                </div>
                <div>
                  <span className="text-muted">Designation:</span>{' '}
                  <strong>{org?.integrity_agreement_data?.signatory_designation || 'Authorized Officer'}</strong>
                </div>
                <div>
                  <span className="text-muted">Executed Date:</span>{' '}
                  <strong>{org?.integrity_agreement_data?.signed_at ? new Date(org.integrity_agreement_data.signed_at).toLocaleDateString() : 'Active'}</strong>
                </div>
                <div>
                  <span className="text-muted">Compliance Status:</span>{' '}
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Zero Dispute Violations</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <AlertTriangle color="#ef4444" size={24} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-800)' }}>
                <strong>Statutory Onboarding Requirement:</strong> ReSourceX operates an institutional, verified industrial secondary marketplace. All onboarding factories must execute this anti-fraud covenant before publishing live listings.
              </div>
            </div>
          )}

          {/* Clauses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: 'var(--gray-950)', fontWeight: 600 }}>
                1. Mandatory Provision of Authenticated & Verified Byproducts
              </h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                The Manufacturer certifies that all industrial waste, byproducts, scrap, and secondary raw materials listed on ReSourceX conform strictly to the specifications stated in their respective Digital Waste Passports. Moisture levels, chemical impurities, physical assays, weighbridge slips, and origin batch lots must represent true, unaltered physical inventory.
              </p>
            </section>

            <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: 'var(--gray-950)', fontWeight: 600 }}>
                2. Prohibition of Hazardous Blending & Concealed Toxic Contaminants
              </h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                The Manufacturer warrants that waste batches do not contain undisclosed hazardous, bio-medical, radioactive, or banned chemical residues. Any deliberate adulteration, synthetic dilution, or contamination intended to misrepresent grade or inflate volume is strictly prohibited under the Hazardous and Other Wastes Rules and environmental protection statutes.
              </p>
            </section>

            <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>
                3. Zero-Tolerance Anti-Fraud & Legal Action Protocol
              </h4>
              <p style={{ margin: '0 0 8px', fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                If the Manufacturer fails to provide verified goods, furnishes forged lab documents, executes fraudulent diversion of shipments, or misrepresents product quality:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8125rem', color: 'var(--gray-600)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Immediate Asset Freeze:</strong> Immediate forfeiture of escrow receivables and platform guarantee balances.</li>
                <li><strong>Permanent Corporate Blacklisting:</strong> Company name, CIN/GSTIN, and executive details will be permanently banned and reported to the Central Pollution Control Board (CPCB) and industrial trade syndicates.</li>
                <li><strong>Criminal Prosecution:</strong> ReSourceX will initiate formal criminal proceedings under Indian Penal Code Sections 415, 420 (Cheating), and 406 (Criminal Breach of Trust) alongside commercial recovery litigation.</li>
                <li><strong>Full Civil Indemnity:</strong> Manufacturer assumes 100% financial liability for freight return charges, third-party laboratory re-assays, and consequential buyer damages.</li>
              </ul>
            </section>

            <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: 'var(--gray-950)', fontWeight: 600 }}>
                4. Inspection, Chain of Custody & Smart Weighbridge Verifications
              </h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                The Manufacturer grants ReSourceX certified logistics partners and independent QA auditors the right to inspect byproduct batches at the source factory loading dock and verify net tare weighbridge receipts prior to gate dispatch.
              </p>
            </section>
          </div>

          {/* Form to Sign if Not Signed */}
          {!isAlreadySigned && (
            <form onSubmit={handleSign} style={{ marginTop: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Authorized Signatory Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Corporate Designation / Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={signatoryDesignation}
                    onChange={(e) => setSignatoryDesignation(e.target.value)}
                    placeholder="e.g. Managing Director / Plant Head"
                    required
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <input
                    type="checkbox"
                    checked={agreeVerified}
                    onChange={(e) => setAgreeVerified(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: 'var(--primary-600)' }}
                  />
                  <span>
                    <strong>Verified Product Guarantee:</strong> I solemnly declare that all byproduct batches, weights, purity grades, and lab analyses published by {org?.company_name || 'our company'} on ReSourceX are 100% genuine and physically verifiable.
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <input
                    type="checkbox"
                    checked={agreeFraudAction}
                    onChange={(e) => setAgreeFraudAction(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: 'var(--primary-600)' }}
                  />
                  <span>
                    <strong>Anti-Fraud Strict Liability Acknowledgment:</strong> I acknowledge and agree that providing fake/counterfeit products, forged test results, or fraudulent manifests will result in immediate escrow seizure, corporate blacklisting, and criminal prosecution.
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <input
                    type="checkbox"
                    checked={agreeAuthority}
                    onChange={(e) => setAgreeAuthority(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: 'var(--primary-600)' }}
                  />
                  <span>
                    <strong>Corporate Authorization:</strong> I have full legal power and corporate authorization to bind {org?.company_name || 'this enterprise'} to the Terms of Service, Dispute Policies, and Commercial Jurisdiction of ReSourceX.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !agreeVerified || !agreeFraudAction || !agreeAuthority}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Lock size={15} />
                  {submitting ? 'Executing Accord...' : 'Sign & Execute Binding Legal Agreement'}
                </button>
              </div>
            </form>
          )}

          {isAlreadySigned && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Close Agreement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
