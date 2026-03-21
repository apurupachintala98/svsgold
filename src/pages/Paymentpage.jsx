import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Loader, Plus, Trash2, ChevronLeft, ChevronRight, AlertCircle, Save, Check,
  FileText, CreditCard, Receipt, Banknote, Eye, LogOut, Menu, X, Home, Calculator, Download
} from 'lucide-react'
import { paymentsAPI } from '../api/api'

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const appData = location.state?.application
  const estimationItems = location.state?.items || []
  const estimationTotal = location.state?.grandTotal || 0

  const storedLogin = JSON.parse(localStorage.getItem('svs_gold_login_data') || '{}')
  const loggedInMobile = localStorage.getItem('user_mobile') || storedLogin?.mobile || ''

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [invoice, setInvoice] = useState({
    mobile: loggedInMobile, invoice_no: `INV-${Date.now()}`,
    invoice_date: new Date().toISOString().split('T')[0],
    total_net_amount: estimationTotal, amount_in_words: '', remarks: ''
  })

  const [invoiceItems, setInvoiceItems] = useState(
    estimationItems.length > 0
      ? estimationItems.map((item, i) => ({
          id: Date.now() + i, mobile: loggedInMobile, item_name: item.item_name || '',
          weight_before_melting: item.gross_weight_gms || 0, weight_after_melting: 0,
          purity_after_melting: item.purity_percentage || 0, gold_rate_per_gm: item.gold_rate_per_gm || 0,
          gross_amount: 0, deductions_amount: 0, net_amount: 0, _savedItemId: null
        }))
      : []
  )

  const [settlement, setSettlement] = useState({
    mobile: loggedInMobile, payment_mode: 'BANK_TRANSFER', paid_amount: estimationTotal,
    payment_date: new Date().toISOString().split('T')[0], reference_no: '', bank_name: ''
  })

  const [allComplete, setAllComplete] = useState(false)

  const inputClass = 'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300'
  const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide'
  const readOnlyClass = 'w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-700 font-medium cursor-not-allowed'

  const numberToWords = (n) => {
    if (!n || n === 0) return 'Zero'
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
    const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
    const num = Math.floor(Math.abs(n))
    if (num < 20) return a[num]
    if (num < 100) return b[Math.floor(num/10)] + (num%10 ? ' ' + a[num%10] : '')
    if (num < 1000) return a[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' and ' + numberToWords(num%100) : '')
    if (num < 100000) return numberToWords(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' ' + numberToWords(num%1000) : '')
    if (num < 10000000) return numberToWords(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' ' + numberToWords(num%100000) : '')
    return numberToWords(Math.floor(num/10000000)) + ' Crore' + (num%10000000 ? ' ' + numberToWords(num%10000000) : '')
  }

  const recalcItem = (item) => {
    const gross = (parseFloat(item.weight_after_melting) || 0) * (parseFloat(item.gold_rate_per_gm) || 0)
    const net = gross - (parseFloat(item.deductions_amount) || 0)
    return { ...item, gross_amount: parseFloat(gross.toFixed(2)), net_amount: parseFloat(net.toFixed(2)) }
  }

  const handleStep1 = async () => {
    if (!invoice.total_net_amount || invoice.total_net_amount <= 0) { setError('Total amount must be > 0'); return }
    try {
      setLoading(true); setError('')
      const words = invoice.amount_in_words || numberToWords(invoice.total_net_amount) + ' Rupees Only'
      await paymentsAPI.createInvoice({ ...invoice, amount_in_words: words })
      setInvoice(p => ({ ...p, amount_in_words: words })); setStep(2)
    } catch (err) { setError(err.response?.data?.message || 'Failed to create invoice') }
    finally { setLoading(false) }
  }

  const addInvoiceItem = () => setInvoiceItems(prev => [...prev, { id: Date.now(), mobile: loggedInMobile, item_name: '', weight_before_melting: 0, weight_after_melting: 0, purity_after_melting: 0, gold_rate_per_gm: 0, gross_amount: 0, deductions_amount: 0, net_amount: 0, _savedItemId: null }])
  const updateInvoiceItem = (idx, f, v) => setInvoiceItems(prev => { const u = [...prev]; u[idx] = recalcItem({ ...u[idx], [f]: v }); return u })
  const removeInvoiceItem = (idx) => setInvoiceItems(prev => prev.filter((_, i) => i !== idx))

  const handleStep2 = async () => {
    if (invoiceItems.length === 0) { setError('Add at least one item'); return }
    for (let i = 0; i < invoiceItems.length; i++) { if (!invoiceItems[i].item_name?.trim()) { setError(`Item ${i+1}: name required`); return } }
    try {
      setLoading(true); setError('')
      const saved = []
      for (const item of invoiceItems) { const { id, _savedItemId, ...p } = item; const r = await paymentsAPI.addInvoiceItem(p); saved.push({ ...item, _savedItemId: r.data?.invoice_item_id || r.data?.id || null }) }
      setInvoiceItems(saved); setStep(3)
    } catch (err) { setError(err.response?.data?.message || 'Failed to save items') }
    finally { setLoading(false) }
  }

  const handleStep3 = async () => {
    if (!settlement.payment_mode) { setError('Select payment mode'); return }
    if (!settlement.paid_amount || settlement.paid_amount <= 0) { setError('Paid amount required'); return }
    try {
      setLoading(true); setError('')
      await paymentsAPI.addSettlement(settlement); setAllComplete(true)
    } catch (err) { setError(err.response?.data?.message || 'Failed to save settlement') }
    finally { setLoading(false) }
  }

  const handlePreview = () => navigate('/payment-preview', { state: { application: appData, invoice, invoiceItems, deductions: [], settlement, mobile: loggedInMobile } })
  const handleLogout = () => { localStorage.removeItem('svs_gold_login_data'); localStorage.removeItem('user_mobile'); navigate('/login') }

  if (!appData) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda)' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
        <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Data Found</h2>
        <p className="text-gray-500 mb-6">Please complete the estimation first.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-3 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}>Go to Dashboard</button>
      </div>
    </div>
  )

  const stepsMeta = [{ num: 1, label: 'Create Invoice', icon: Receipt }, { num: 2, label: 'Invoice Items', icon: FileText }, { num: 3, label: 'Settlement', icon: Banknote }]

  return (
    <div className="flex h-screen" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda, #fdf8f0)' }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} text-white transition-all duration-300 shadow-2xl overflow-hidden flex-shrink-0`} style={{ background: 'linear-gradient(180deg, #a36e24, #8b5c1c)' }}>
        <div className="h-full flex flex-col">
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}><img src="/svslogo-white.png" alt="SVS" className="w-8 h-8 object-contain" /></div>
              {sidebarOpen && <span className="font-bold text-lg">SVS Gold</span>}
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10"><FileText size={20} className="text-amber-200" />{sidebarOpen && <span>Applications</span>}</button>
            <button onClick={() => navigate(-1)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10"><Calculator size={20} className="text-amber-200" />{sidebarOpen && <span>Estimation</span>}</button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg" style={{ background: 'rgba(255,255,255,0.2)' }}><CreditCard size={20} className="text-amber-200" />{sidebarOpen && <span>Payment</span>}</button>
          </nav>
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg hover:bg-white/10">{sidebarOpen ? <X size={20} /> : <Menu size={20} />}{sidebarOpen && <span className="text-sm">Collapse</span>}</button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md px-8 py-5 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Payment</h1>
            <p className="text-gray-500 text-sm mt-1">Invoice & Settlement • {loggedInMobile}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-3 rounded-lg hover:bg-gray-100"><Home size={20} className="text-gray-600" /></button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"><LogOut size={18} /> Logout</button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Steps */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between">
                {stepsMeta.map((s, i) => (
                  <React.Fragment key={s.num}>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${allComplete || step > s.num ? 'bg-green-500 text-white' : step === s.num ? 'bg-amber-700 text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}>
                        {allComplete || step > s.num ? <Check size={20} /> : <s.icon size={20} />}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${step >= s.num ? 'text-amber-700' : 'text-gray-400'}`}>{s.label}</span>
                    </div>
                    {i < stepsMeta.length - 1 && <div className={`h-0.5 flex-1 mx-1 mb-6 ${step > s.num || allComplete ? 'bg-green-500' : 'bg-gray-200'}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {error && <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl"><AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} /><span className="text-sm text-red-700">{error}</span></div>}

            {/* Step 1 */}
            {step === 1 && !allComplete && (
              <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                <div><h2 className="text-xl font-bold text-gray-800">Create Invoice</h2><p className="text-sm text-gray-500 mt-1">Enter invoice details to begin payment</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className={labelClass}>Invoice Number</label><input value={invoice.invoice_no} disabled className={readOnlyClass} /></div>
                  <div><label className={labelClass}>Invoice Date</label><input type="date" value={invoice.invoice_date} onChange={e => setInvoice(p => ({ ...p, invoice_date: e.target.value }))} className={inputClass} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className={labelClass}>Total Net Amount (₹)</label><input type="text" value={invoice.total_net_amount} onChange={e => setInvoice(p => ({ ...p, total_net_amount: parseFloat(e.target.value.replace(/[^0-9.]/g,'')) || 0 }))} className={inputClass} /></div>
                  <div><label className={labelClass}>Amount in Words</label><input value={invoice.amount_in_words || numberToWords(invoice.total_net_amount) + ' Rupees Only'} onChange={e => setInvoice(p => ({ ...p, amount_in_words: e.target.value }))} className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Remarks</label><textarea value={invoice.remarks} onChange={e => setInvoice(p => ({ ...p, remarks: e.target.value }))} rows={3} placeholder="Optional remarks..." className={inputClass} /></div>
                <div className="flex justify-center"><button onClick={handleStep1} disabled={loading} className="px-10 py-3 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2 text-sm">{loading ? <><Loader size={16} className="animate-spin" /> Saving...</> : <>Save Invoice & Next <ChevronRight size={16} /></>}</button></div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && !allComplete && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-xl font-bold text-gray-800">Invoice Items</h2><p className="text-sm text-gray-500 mt-1">Add items with melting weights and rates</p></div>
                    <button onClick={addInvoiceItem} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 font-semibold rounded-xl hover:bg-amber-100"><Plus size={18} /> Add Item</button>
                  </div>
                  {invoiceItems.length === 0 && <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300"><FileText size={40} className="mx-auto text-gray-400 mb-3" /><p className="text-gray-500">No items. Click "Add Item".</p></div>}
                  {invoiceItems.map((item, idx) => (
                    <div key={item.id || idx} className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
                      <div className="flex items-center justify-between"><h4 className="font-bold text-gray-800">Item {idx+1} {item.item_name && `— ${item.item_name}`}</h4><div className="flex items-center gap-3"><span className="text-sm font-semibold text-green-600">Net: ₹{item.net_amount?.toLocaleString('en-IN') || 0}</span><button onClick={() => removeInvoiceItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button></div></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className={labelClass}>Item Name *</label><input value={item.item_name} onChange={e => updateInvoiceItem(idx, 'item_name', e.target.value)} className={inputClass} /></div>
                        <div><label className={labelClass}>Wt Before Melting (g)</label><input type="text" value={item.weight_before_melting} onChange={e => updateInvoiceItem(idx, 'weight_before_melting', e.target.value.replace(/[^0-9.]/g,''))} className={inputClass} /></div>
                        <div><label className={labelClass}>Wt After Melting (g)</label><input type="text" value={item.weight_after_melting} onChange={e => updateInvoiceItem(idx, 'weight_after_melting', e.target.value.replace(/[^0-9.]/g,''))} className={inputClass} /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div><label className={labelClass}>Purity After (%)</label><input type="text" value={item.purity_after_melting} onChange={e => updateInvoiceItem(idx, 'purity_after_melting', e.target.value.replace(/[^0-9.]/g,''))} className={inputClass} /></div>
                        <div><label className={labelClass}>Gold Rate/gm (₹)</label><input type="text" value={item.gold_rate_per_gm} onChange={e => updateInvoiceItem(idx, 'gold_rate_per_gm', e.target.value.replace(/[^0-9.]/g,''))} className={inputClass} /></div>
                        <div><label className={labelClass}>Gross Amount (₹)</label><div className={readOnlyClass}>₹{item.gross_amount?.toLocaleString('en-IN') || 0}</div></div>
                        <div><label className={labelClass}>Deductions (₹)</label><input type="text" value={item.deductions_amount} onChange={e => updateInvoiceItem(idx, 'deductions_amount', e.target.value.replace(/[^0-9.]/g,''))} className={inputClass} /></div>
                      </div>
                      <div className="flex justify-end"><div className="px-6 py-3 bg-green-50 border-2 border-green-200 rounded-xl"><span className="text-xs text-gray-500">Net: </span><span className="font-bold text-green-700 text-lg">₹{item.net_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</span></div></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4">
                  <button onClick={() => { setStep(1); setError('') }} className="px-8 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl flex items-center gap-2 text-sm"><ChevronLeft size={16} /> Back</button>
                  <button onClick={handleStep2} disabled={loading} className="px-10 py-2.5 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2 text-sm">{loading ? <><Loader size={16} className="animate-spin" /> Saving...</> : <>Save Items & Next <ChevronRight size={16} /></>}</button>
                </div>
              </div>
            )}

            {/* Step 3: Settlement */}
            {step === 3 && !allComplete && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                  <div><h2 className="text-xl font-bold text-gray-800">Settlement</h2><p className="text-sm text-gray-500 mt-1">Payment mode and details</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Payment Mode *</label>
                      <select value={settlement.payment_mode} onChange={e => setSettlement(p => ({ ...p, payment_mode: e.target.value }))} className={inputClass}>
                        <option value="BANK_TRANSFER">Bank Transfer</option><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option><option value="UPI">UPI</option><option value="NEFT">NEFT</option><option value="RTGS">RTGS</option><option value="IMPS">IMPS</option>
                      </select>
                    </div>
                    <div><label className={labelClass}>Paid Amount (₹) *</label><input type="text" value={settlement.paid_amount} onChange={e => setSettlement(p => ({ ...p, paid_amount: parseFloat(e.target.value.replace(/[^0-9.]/g,'')) || 0 }))} className={inputClass} /></div>
                  </div>
                  <div><label className={labelClass}>Payment Date</label><input type="date" value={settlement.payment_date} onChange={e => setSettlement(p => ({ ...p, payment_date: e.target.value }))} className={inputClass} /></div>
                </div>
                <div className="flex justify-center gap-4">
                  <button onClick={() => { setStep(2); setError('') }} className="px-8 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl flex items-center gap-2 text-sm"><ChevronLeft size={16} /> Back</button>
                  <button onClick={handleStep3} disabled={loading} className="px-10 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2 text-sm">{loading ? <><Loader size={16} className="animate-spin" /> Saving...</> : <><CreditCard size={16} /> Complete Settlement</>}</button>
                </div>
              </div>
            )}

            {/* Complete — Payment Voucher PDF Preview */}
            {allComplete && (() => {
              const acc = appData?.account || {}
              const addrs = appData?.addresses || []
              const appInfo = appData?.application || {}
              const custName = acc.name || [acc.first_name, acc.last_name].filter(Boolean).join(' ') || ''
              const presentA = addrs.find(a => /present|current/i.test(a.address_type)) || addrs[0] || {}
              const permA = addrs.find(a => /permanent/i.test(a.address_type)) || addrs[1] || presentA
              const fmtA = (a) => [a?.address_line, a?.street, a?.city, a?.state, a?.pincode].filter(Boolean).join(', ')
              const calcAge = (d) => { if (!d) return ''; const b = new Date(d), t = new Date(); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a }

              const totalNet = invoiceItems.reduce((s, it) => s + (parseFloat(it.net_amount) || 0), 0)
              const blue = '#2c5f8a'
              const cb = '1px solid #6a9ec7'
              const lb = { border: cb, padding: '5px 8px', fontWeight: 'bold', background: '#f0f6fb', fontSize: '10px' }
              const vl = { border: cb, padding: '5px 8px', fontSize: '10px' }

              return (
              <div className="space-y-6">
                {/* Success */}
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><Check size={22} className="text-white" /></div>
                  <div><h3 className="text-lg font-bold text-green-800">Payment Completed!</h3><p className="text-sm text-green-600 mt-1">Invoice {invoice.invoice_no} • ₹{settlement.paid_amount.toLocaleString('en-IN')} via {settlement.payment_mode.replace(/_/g,' ')}</p></div>
                </div>

                <div id="payment-voucher-print" style={{ fontFamily: "'Times New Roman',Georgia,serif", maxWidth: '750px', margin: '0 auto', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>

                  {/* Header */}
                  <div style={{ background: `linear-gradient(180deg, #3a7ab5, ${blue})`, padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#fff', lineHeight: '1.5' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>SVS GOLD PRIVATE LIMITED</div>
                      <div style={{ fontSize: '10px', opacity: .85 }}>3-4-659/3, YMCA, Narayanguda</div>
                      <div style={{ fontSize: '10px', opacity: .85 }}>Himayathnagar, Hyderabad - 29</div>
                      <div style={{ fontSize: '10px', opacity: .85 }}>9885588220</div>
                      <div style={{ fontSize: '10px', opacity: .85 }}>www.svsgold.com</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px' }}>PAYMENT VOUCHER</div>
                    </div>
                    <div style={{ width: '100px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/svslogo-white.png" alt="SVS Gold" style={{ maxHeight: '65px', maxWidth: '95px', objectFit: 'contain' }} />
                    </div>
                  </div>

                  <div style={{ padding: '20px 28px' }}>
                    {/* Bill No / Application No */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                      <tbody>
                        <tr>
                          <td style={lb} width="120">Bill No.</td>
                          <td style={vl}>{invoice.invoice_no}</td>
                          <td style={lb} width="120">Application Date</td>
                          <td style={vl}>{appInfo.application_date || invoice.invoice_date}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Application No.</td>
                          <td style={vl} colSpan={3}>{appInfo.application_no || ''}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Customer Details */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                      <tbody>
                        <tr>
                          <td style={lb} width="120">Name</td>
                          <td style={vl} colSpan={5}>{custName}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Email ID</td>
                          <td style={vl}>{acc.email || ''}</td>
                          <td style={lb} width="60">D.O.B.</td>
                          <td style={vl}>{acc.date_of_birth || ''}</td>
                          <td style={lb} width="40">Age</td>
                          <td style={vl} width="50">{calcAge(acc.date_of_birth)}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Mobile No.</td>
                          <td style={vl}>{loggedInMobile}</td>
                          <td style={lb}>Aadhar No.</td>
                          <td style={vl}>{acc.aadhar_no || ''}</td>
                          <td style={lb}>PAN No.</td>
                          <td style={vl}>{acc.pan_no || ''}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Present Address</td>
                          <td style={vl} colSpan={5}>{fmtA(presentA)}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Permanent Address</td>
                          <td style={vl} colSpan={5}>{fmtA(permA)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Items Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f0f6fb' }}>
                          {['S. No.','Item','Wt. Before\nMelting','Wt. After\nMelting','Purity\nAfter\nMelting','Gold Rate\nPer Gm.','Gross\nAmount','Deductions','Net\nAmount'].map((h,i) => (
                            <th key={i} style={{ border: cb, padding: '6px 4px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'pre-line', verticalAlign: 'bottom', lineHeight: '1.3' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceItems.map((item, i) => (
                          <tr key={i}>
                            <td style={{ ...vl, textAlign: 'center' }}>{i + 1}</td>
                            <td style={vl}>{item.item_name}</td>
                            <td style={{ ...vl, textAlign: 'center' }}>{item.weight_before_melting}</td>
                            <td style={{ ...vl, textAlign: 'center' }}>{item.weight_after_melting}</td>
                            <td style={{ ...vl, textAlign: 'center' }}>{item.purity_after_melting}%</td>
                            <td style={{ ...vl, textAlign: 'center' }}>₹{item.gold_rate_per_gm}</td>
                            <td style={{ ...vl, textAlign: 'center' }}>₹{item.gross_amount?.toLocaleString('en-IN')}</td>
                            <td style={{ ...vl, textAlign: 'center' }}>₹{item.deductions_amount || 0}</td>
                            <td style={{ ...vl, textAlign: 'center', fontWeight: 'bold' }}>₹{item.net_amount?.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 6 - invoiceItems.length) }).map((_, i) => (
                          <tr key={`e${i}`}>{Array.from({length:9}).map((_,j) => <td key={j} style={{ ...vl, height: '24px' }}>&nbsp;</td>)}</tr>
                        ))}
                        <tr>
                          <td colSpan={7} style={vl}></td>
                          <td style={{ ...lb, textAlign: 'center' }}>Total Net Amount</td>
                          <td style={{ ...vl, fontWeight: 'bold', textAlign: 'center', fontSize: '11px' }}>₹{totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Amount in Words + Payment Ref */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={lb} width="180">Amount In Words</td>
                          <td style={{ ...vl, fontStyle: 'italic' }}>{invoice.amount_in_words || numberToWords(totalNet) + ' Rupees Only'}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Note: Payment Reference No.</td>
                          <td style={vl}>{settlement.payment_mode.replace(/_/g,' ')} — {settlement.payment_date}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Terms & Conditions */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: blue, marginBottom: '6px' }}>Terms & Conditions</div>
                      <ol style={{ fontSize: '9.5px', lineHeight: '1.7', paddingLeft: '16px', margin: 0 }}>
                        <li style={{ marginBottom: '3px' }}>SVS Gold Private Limited (' SVS Gold') purchases the gold items based on the Customer's declaration that he/she is the only legal owner of the gold and is entitled to sell them.</li>
                        <li style={{ marginBottom: '3px' }}>SVS Gold shall intimate the appropriate authorities in case it finds the Customer is trying to sell the stolen or counterfeit gold items.</li>
                        <li style={{ marginBottom: '3px' }}>Under any circumstance SVS Gold shall not return gold items brought from the customers.</li>
                        <li style={{ marginBottom: '3px' }}>Deductions include processing fees, documentation charges and other charges.</li>
                        <li style={{ marginBottom: '3px' }}>All the disputes arising from this transaction shall be settled by binding arbitration within jurisdiction of Hyderabad, Telangana.</li>
                      </ol>
                    </div>

                    {/* Signatures */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#555', marginBottom: '30px' }}>Authorised Signatory</div>
                        <table style={{ fontSize: '11px', borderCollapse: 'collapse' }}><tbody>
                          <tr><td style={lb}>Date</td><td style={{ ...vl, minWidth: '150px' }}>{settlement.payment_date}</td></tr>
                          <tr><td style={lb}>Place</td><td style={vl}>{appInfo.place || ''}</td></tr>
                        </tbody></table>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#555', marginBottom: '8px' }}>Accepted & Received</div>
                        <div style={{ width: '220px', borderBottom: '1px solid #666', paddingBottom: '40px', marginBottom: '4px' }}></div>
                        <div style={{ fontSize: '10px', color: '#555' }}>Customer Signature / Thumb Impression</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      const el = document.getElementById('payment-voucher-print')
                      if (!el) return
                      const w = window.open('','_blank')
                      w.document.write(`<html><head><title>Payment Voucher</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Times New Roman',serif;background:#fff}@media print{@page{margin:10mm}}</style></head><body>${el.innerHTML}</body></html>`)
                      w.document.close(); setTimeout(() => { w.print(); w.close() }, 400)
                    }}
                    className="px-8 py-2.5 bg-white text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 text-sm hover:bg-gray-50"
                  >
                    <Download size={16} /> Print / Download
                  </button>
                  <button onClick={() => navigate('/dashboard')} className="px-8 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl flex items-center gap-2 text-sm"><Home size={16} /> Dashboard</button>
                </div>
              </div>
              )
            })()}
          </div>
        </main>
      </div>
    </div>
  )
}