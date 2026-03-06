import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Download, Printer, AlertCircle, Loader
} from 'lucide-react'
import { applicationsAPI } from '../api/api'

export default function InvoicePreviewPage() {

  const location = useLocation()
  const navigate = useNavigate()
  const invoiceRef = useRef(null)

  const {
    application: appData,
    invoice,
    invoiceItems,
    deductions,
    settlement,
    mobile
  } = location.state || {}

  const [previewData, setPreviewData] = useState(null)
  const [loading, setLoading] = useState(true)

  /* ---- Fetch final-preview for customer details ---- */
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await applicationsAPI.getFinalPreview(mobile)
        setPreviewData(res.data)
      } catch (e) {
        console.error('Failed to fetch preview:', e)
      } finally {
        setLoading(false)
      }
    }
    if (mobile) fetchPreview()
    else setLoading(false)
  }, [mobile])

  /* ---- Print ---- */
  const handlePrint = () => {
    const printContent = invoiceRef.current?.innerHTML
    if (!printContent) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Invoice ${invoice?.invoice_no}</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #fff; padding: 0; }
        @media print { body { padding: 0; } .no-print { display: none !important; } }
      </style></head><body>${printContent}</body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  /* ---- Calculations ---- */
  const subTotal = invoiceItems?.reduce((s, i) => s + (i.gross_amount || 0), 0) || 0
  const totalDeductions = deductions?.reduce((s, d) => s + (d.deduction_amount || 0), 0) || 0
  const netTotal = invoiceItems?.reduce((s, i) => s + (i.net_amount || 0), 0) || 0
  const paidAmount = settlement?.paid_amount || 0
  const dueAmount = Math.max(0, netTotal - paidAmount)

  /* ---- Customer info from preview ---- */
  const account = previewData?.account || {}
  const pledge = previewData?.pledge_details || {}
  const customerName = [account.first_name, account.last_name].filter(Boolean).join(' ') || pledge.pledger_name || ''
  const addresses = previewData?.addresses || []
  const addr = addresses[0] || {}
  const customerAddr = [addr.address_line, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')

  /* ---- Guard ---- */
  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Invoice Data</h2>
          <p className="text-gray-500 mb-6">Complete the payment flow first.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl">Dashboard</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader size={48} className="text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Action Bar */}
        <div className="flex items-center justify-between no-print">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md text-gray-700 font-medium transition-all">
            <ChevronLeft size={20} /> Back
          </button>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md text-gray-700 font-medium transition-all">
              <Printer size={18} /> Print
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg font-medium transition-all">
              <Download size={18} /> Download PDF
            </button>
          </div>
        </div>

        {/* ======== INVOICE DOCUMENT ======== */}
        <div ref={invoiceRef}>
          <div style={{
            fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
            background: '#fff',
            maxWidth: '800px',
            margin: '0 auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>

            {/* ---- Green Header ---- */}
            <div style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              padding: '36px 40px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-1px' }}>
                  Invoice
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginTop: '6px' }}>
                  {invoice.invoice_no}
                </div>
              </div>
              <div style={{ textAlign: 'right', color: '#fff' }}>
                <div style={{ fontWeight: '700', fontSize: '18px' }}>SVS GOLD</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px', lineHeight: '1.5' }}>
                  3-4-659/3, YMCA, Narayanguda<br />
                  Himayathnagar, Hyderabad - 29<br />
                  98855 88220 • www.svsgold.com
                </div>
              </div>
            </div>

            {/* ---- Info Row ---- */}
            <div style={{
              padding: '28px 40px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              borderBottom: '1px solid #f0f0f0',
            }}>
              {/* Billed To */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', borderLeft: '3px solid #16a34a', paddingLeft: '8px' }}>
                  Billed to
                </div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#111' }}>{customerName || 'Customer'}</div>
                {customerAddr && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', lineHeight: '1.5' }}>{customerAddr}</div>}
                {account.aadhar_no && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>Aadhar: {account.aadhar_no}</div>}
                {account.pan_no && <div style={{ fontSize: '11px', color: '#9ca3af' }}>PAN: {account.pan_no}</div>}
              </div>

              {/* Invoice Details */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', borderLeft: '3px solid #16a34a', paddingLeft: '8px' }}>
                  Invoice Details
                </div>
                <table style={{ fontSize: '12px', color: '#374151', lineHeight: '2' }}>
                  <tbody>
                    <tr><td style={{ fontWeight: '600', paddingRight: '12px' }}>Invoice #</td><td>{invoice.invoice_no}</td></tr>
                    <tr><td style={{ fontWeight: '600', paddingRight: '12px' }}>Invoice Date</td><td>{invoice.invoice_date}</td></tr>
                    <tr><td style={{ fontWeight: '600', paddingRight: '12px' }}>Mobile</td><td>{mobile}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Record */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', borderLeft: '3px solid #16a34a', paddingLeft: '8px' }}>
                  Payment Record
                </div>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: '2' }}>
                  <div><span style={{ fontWeight: '600' }}>Paid Amount</span>  ₹{paidAmount.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: dueAmount > 0 ? '#dc2626' : '#16a34a', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Due Amount </span>
                    ₹{dueAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Items Table ---- */}
            <div style={{ padding: '0 40px 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f0fdf4', borderTop: '2px solid #16a34a', borderBottom: '2px solid #16a34a' }}>
                    {['Item #/Description', 'Wt Before', 'Wt After', 'Purity %', 'Rate/g', 'Deductions', 'Net Amount'].map((h, i) => (
                      <th key={h} style={{
                        padding: '12px 10px',
                        textAlign: i === 0 ? 'left' : 'right',
                        fontWeight: '700',
                        fontSize: '11px',
                        color: '#16a34a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '16px 10px', fontWeight: '600', color: '#111' }}>{item.item_name || `Item ${idx + 1}`}</td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', color: '#374151' }}>{item.weight_before_melting}g</td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', color: '#374151' }}>{item.weight_after_melting}g</td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', color: '#374151' }}>{item.purity_after_melting}%</td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', color: '#374151' }}>₹{item.gold_rate_per_gm?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', color: '#dc2626' }}>-₹{item.deductions_amount?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: '700', color: '#111' }}>₹{item.net_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---- Bottom Section: Left + Right ---- */}
            <div style={{
              padding: '20px 40px 36px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
            }}>
              {/* Left: Amount in Words + Deductions + Remarks */}
              <div>
                {/* Deductions */}
                {deductions && deductions.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                      Deductions
                    </div>
                    {deductions.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ color: '#374151' }}>{d.deduction_type?.replace('_', ' ')}</span>
                        <span style={{ fontWeight: '600', color: '#dc2626' }}>-₹{d.deduction_amount?.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Invoice total in words */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Invoice total in words
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a', lineHeight: '1.4' }}>
                    {invoice.amount_in_words || '—'}
                  </div>
                </div>

                {/* Payments */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                    Payments
                  </div>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Date', 'Mode', 'Amount', 'Reference'].map(h => (
                          <th key={h} style={{ padding: '8px 6px', textAlign: 'left', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 6px', color: '#374151' }}>{settlement?.payment_date}</td>
                        <td style={{ padding: '8px 6px' }}>
                          <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>
                            {settlement?.payment_mode?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '8px 6px', fontWeight: '700', color: '#111' }}>₹{paidAmount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 6px', color: '#6b7280' }}>{settlement?.reference_no || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Remarks */}
                {invoice.remarks && (
                  <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '12px', color: '#6b7280' }}>
                    <span style={{ fontWeight: '600' }}>Remarks: </span>{invoice.remarks}
                  </div>
                )}
              </div>

              {/* Right: Totals */}
              <div>
                <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '30px' }}>
                  {[
                    { label: 'Sub Total', value: subTotal, bold: false },
                    { label: `Deductions`, value: totalDeductions, bold: false, negative: true },
                    { label: 'Net Amount', value: netTotal, bold: true },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: '#6b7280' }}>{row.label}</span>
                      <span style={{ fontWeight: row.bold ? '700' : '500', color: row.negative ? '#dc2626' : '#111' }}>
                        {row.negative ? '-' : ''}₹{Math.abs(row.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}

                  {/* Settlement info */}
                  {settlement?.bank_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                      <span style={{ color: '#6b7280' }}>Bank</span>
                      <span style={{ fontWeight: '500', color: '#111' }}>{settlement.bank_name}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Paid Amount</span>
                    <span style={{ fontWeight: '600', color: '#16a34a' }}>₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Total Due - BIG */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 0 10px',
                    marginTop: '6px',
                    borderTop: '2px solid #e5e7eb',
                  }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Total Due</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: dueAmount > 0 ? '#dc2626' : '#16a34a' }}>
                      ₹{dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Footer ---- */}
            <div style={{
              background: '#f9fafb',
              padding: '24px 40px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              borderTop: '1px solid #e5e7eb',
              fontSize: '11px',
              color: '#6b7280',
            }}>
              {/* Terms */}
              <div>
                <div style={{ fontWeight: '700', color: '#374151', marginBottom: '8px', fontSize: '12px' }}>Terms and Conditions</div>
                <ol style={{ paddingLeft: '16px', lineHeight: '1.8' }}>
                  <li>This is a computer-generated invoice.</li>
                  <li>Gold rates are subject to market fluctuations.</li>
                  <li>All weights are approximate and subject to verification.</li>
                </ol>
              </div>

              {/* Bank Details */}
              <div>
                <div style={{ fontWeight: '700', color: '#374151', marginBottom: '8px', fontSize: '12px' }}>Bank & Payment Details</div>
                <table style={{ fontSize: '11px', lineHeight: '2' }}>
                  <tbody>
                    <tr><td style={{ fontWeight: '600', paddingRight: '12px', color: '#374151' }}>Company</td><td>SVS Gold Private Limited</td></tr>
                    {settlement?.bank_name && <tr><td style={{ fontWeight: '600', paddingRight: '12px', color: '#374151' }}>Bank</td><td>{settlement.bank_name}</td></tr>}
                    {settlement?.reference_no && <tr><td style={{ fontWeight: '600', paddingRight: '12px', color: '#374151' }}>Ref No</td><td>{settlement.reference_no}</td></tr>}
                    <tr><td style={{ fontWeight: '600', paddingRight: '12px', color: '#374151' }}>Mode</td><td>{settlement?.payment_mode?.replace('_', ' ')}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ---- Green Bottom Bar ---- */}
            <div style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              padding: '14px 40px',
              textAlign: 'center',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.8)',
            }}>
              SVS Gold Private Limited • 3-4-659/3, YMCA, Narayanguda, Hyderabad - 29 • 98855 88220 • www.svsgold.com
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-4 no-print">
          <button onClick={handlePrint} className="flex-1 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all">
            <Printer size={20} /> Print Invoice
          </button>
          <button onClick={() => navigate('/dashboard')} className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}