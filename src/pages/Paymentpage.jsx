import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Loader, Plus, Trash2, ChevronLeft, ChevronRight,
  AlertCircle, Save, Check, FileText, CreditCard,
  Receipt, Percent, Banknote, Eye
} from 'lucide-react'
import { paymentsAPI, applicationsAPI } from '../api/api'

export default function PaymentPage() {

  const location = useLocation()
  const navigate = useNavigate()

  const appData = location.state?.application
  const estimationItems = location.state?.items || []
  const estimationTotal = location.state?.grandTotal || 0
  const estimationNo = location.state?.estimation_no || ''

  const storedLogin = JSON.parse(localStorage.getItem("svs_gold_login_data"))
const loggedInMobile =
  localStorage.getItem("user_mobile") ||
  storedLogin?.mobile ||
  storedLogin?.account?.mobile ||
  ''

  /* ================================================================ */
  /*  STATE                                                           */
  /* ================================================================ */
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Invoice
  const [invoice, setInvoice] = useState({
    mobile: loggedInMobile,
    invoice_no: `INV-${Date.now()}`,
    invoice_date: new Date().toISOString().split('T')[0],
    total_net_amount: estimationTotal,
    amount_in_words: '',
    remarks: ''
  })

  // Step 2: Invoice Items
  const [invoiceItems, setInvoiceItems] = useState(
    estimationItems.length > 0
      ? estimationItems.map((item, i) => ({
          id: Date.now() + i,
          mobile: loggedInMobile,
          item_name: item.item_name || '',
          weight_before_melting: item.gross_weight_gms || 0,
          weight_after_melting: 0,
          purity_after_melting: item.purity_percentage || 0,
          gold_rate_per_gm: item.gold_rate_per_gm || 0,
          gross_amount: 0,
          deductions_amount: 0,
          net_amount: 0,
          _savedItemId: null
        }))
      : []
  )

  // Step 3: Deductions
  const [deductions, setDeductions] = useState([])

  // Step 4: Settlement
  const [settlement, setSettlement] = useState({
    mobile:loggedInMobile,
    payment_mode: 'BANK_TRANSFER',
    paid_amount: estimationTotal,
    payment_date: new Date().toISOString().split('T')[0],
    reference_no: '',
    bank_name: ''
  })

  // All done
  const [allComplete, setAllComplete] = useState(false)

  /* ================================================================ */
  /*  STYLES                                                          */
  /* ================================================================ */
  const inputClass =
    'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300'
  const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide'
  const readOnlyClass =
    'w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-700 font-medium cursor-not-allowed'

  /* ================================================================ */
  /*  HELPERS                                                         */
  /* ================================================================ */
  const numberToWords = (n) => {
    if (!n || n === 0) return 'Zero'
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const num = Math.floor(Math.abs(n))
    if (num < 20) return a[num]
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '')
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '')
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '')
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '')
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '')
  }

  const recalcItem = (item) => {
    const gross = (item.weight_after_melting || 0) * (item.gold_rate_per_gm || 0)
    const net = gross - (item.deductions_amount || 0)
    return { ...item, gross_amount: parseFloat(gross.toFixed(2)), net_amount: parseFloat(net.toFixed(2)) }
  }

  /* ================================================================ */
  /*  STEP 1: CREATE INVOICE                                          */
  /* ================================================================ */
  const handleStep1 = async () => {
    if (!invoice.invoice_no.trim()) { setError('Invoice number is required'); return }
    if (!invoice.total_net_amount || invoice.total_net_amount <= 0) { setError('Total amount must be greater than 0'); return }

    try {
      setLoading(true); setError('')
      const words = invoice.amount_in_words || numberToWords(invoice.total_net_amount) + ' Rupees Only'
      const payload = { ...invoice, amount_in_words: words }
      await paymentsAPI.createInvoice(payload)
      setInvoice(prev => ({ ...prev, amount_in_words: words }))
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice')
    } finally { setLoading(false) }
  }

  /* ================================================================ */
  /*  STEP 2: ADD INVOICE ITEMS                                       */
  /* ================================================================ */
  const addInvoiceItem = () => {
    setInvoiceItems(prev => [...prev, {
      id: Date.now(), mobile: loggedInMobile, item_name: '', weight_before_melting: 0,
      weight_after_melting: 0, purity_after_melting: 0, gold_rate_per_gm: 0,
      gross_amount: 0, deductions_amount: 0, net_amount: 0, _savedItemId: null
    }])
  }

  const updateInvoiceItem = (idx, field, value) => {
    setInvoiceItems(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      updated[idx] = recalcItem(updated[idx])
      return updated
    })
  }

  const removeInvoiceItem = (idx) => setInvoiceItems(prev => prev.filter((_, i) => i !== idx))

  const handleStep2 = async () => {
    if (invoiceItems.length === 0) { setError('Add at least one item'); return }
    for (let i = 0; i < invoiceItems.length; i++) {
      if (!invoiceItems[i].item_name?.trim()) { setError(`Item ${i + 1}: name is required`); return }
    }

    try {
      setLoading(true); setError('')
      const savedItems = []
      for (const item of invoiceItems) {
        const { id, _savedItemId, ...payload } = item
        const res = await paymentsAPI.addInvoiceItem(payload)
        savedItems.push({ ...item, _savedItemId: res.data?.invoice_item_id || res.data?.id || null })
      }
      setInvoiceItems(savedItems)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save invoice items')
    } finally { setLoading(false) }
  }

  /* ================================================================ */
  /*  STEP 3: DEDUCTIONS                                              */
  /* ================================================================ */
  const addDeduction = () => {
    setDeductions(prev => [...prev, {
      id: Date.now(),
      invoice_item_id: invoiceItems[0]?._savedItemId || 0,
      deduction_type: '',
      deduction_amount: 0
    }])
  }

  const updateDeduction = (idx, field, value) => {
    setDeductions(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  const removeDeduction = (idx) => setDeductions(prev => prev.filter((_, i) => i !== idx))

  const handleStep3 = async () => {
    try {
      setLoading(true); setError('')
      for (const ded of deductions) {
        if (!ded.deduction_type?.trim()) { setError('Deduction type is required'); setLoading(false); return }
        const { id, ...payload } = ded
        await paymentsAPI.addDeduction(payload)
      }
      setStep(4)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save deductions')
    } finally { setLoading(false) }
  }

  /* ================================================================ */
  /*  STEP 4: SETTLEMENT                                              */
  /* ================================================================ */
  const handleStep4 = async () => {
    if (!settlement.payment_mode) { setError('Select a payment mode'); return }
    if (!settlement.paid_amount || settlement.paid_amount <= 0) { setError('Paid amount is required'); return }

    try {
      setLoading(true); setError('')
      await paymentsAPI.addSettlement(settlement)
      setAllComplete(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settlement')
    } finally { setLoading(false) }
  }

  /* ================================================================ */
  /*  PREVIEW                                                         */
  /* ================================================================ */
  const handlePreview = () => {
    navigate('/payment-preview', {
      state: {
        application: appData,
        invoice,
        invoiceItems,
        deductions,
        settlement,
        mobile: loggedInMobile
      }
    })
  }

  /* ================================================================ */
  /*  NO DATA GUARD                                                   */
  /* ================================================================ */
  if (!appData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Data Found</h2>
          <p className="text-gray-500 mb-6">Please complete the estimation first.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  STEP INDICATOR                                                  */
  /* ================================================================ */
  const stepsMeta = [
    { num: 1, label: 'Create Invoice', icon: Receipt },
    { num: 2, label: 'Invoice Items', icon: FileText },
    { num: 3, label: 'Deductions', icon: Percent },
    { num: 4, label: 'Settlement', icon: Banknote }
  ]

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-gray-50 rounded-xl shadow-md transition-all">
            <ChevronLeft size={22} className="text-indigo-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Payment
            </h1>
            <p className="text-gray-500 text-sm mt-1">Invoice & Settlement • {loggedInMobile}</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            {stepsMeta.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    allComplete || step > s.num ? 'bg-green-500 text-white'
                    : step === s.num ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                    {allComplete || step > s.num ? <Check size={20} /> : <s.icon size={20} />}
                  </div>
                  <span className={`text-xs mt-2 font-medium text-center ${step >= s.num ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < stepsMeta.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 mb-6 ${step > s.num || allComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/*  STEP 1: CREATE INVOICE                                      */}
        {/* ============================================================ */}
        {step === 1 && !allComplete && (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Create Invoice</h2>
              <p className="text-sm text-gray-500 mt-1">Enter invoice details to begin payment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Invoice Number</label>
                <input value={invoice.invoice_no} onChange={e => setInvoice(p => ({ ...p, invoice_no: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Invoice Date</label>
                <input type="date" value={invoice.invoice_date} onChange={e => setInvoice(p => ({ ...p, invoice_date: e.target.value }))} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Total Net Amount (₹)</label>
                <input type="number" value={invoice.total_net_amount} onChange={e => setInvoice(p => ({ ...p, total_net_amount: parseFloat(e.target.value) || 0 }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Amount in Words</label>
                <input value={invoice.amount_in_words || numberToWords(invoice.total_net_amount) + ' Rupees Only'} onChange={e => setInvoice(p => ({ ...p, amount_in_words: e.target.value }))} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Remarks</label>
              <textarea value={invoice.remarks} onChange={e => setInvoice(p => ({ ...p, remarks: e.target.value }))} rows={3} placeholder="Optional remarks..." className={inputClass} />
            </div>

            <button onClick={handleStep1} disabled={loading} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-lg">
              {loading ? <><Loader size={20} className="animate-spin" /> Saving...</> : <>Save Invoice & Next <ChevronRight size={20} /></>}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  STEP 2: INVOICE ITEMS                                       */}
        {/* ============================================================ */}
        {step === 2 && !allComplete && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Invoice Items</h2>
                  <p className="text-sm text-gray-500 mt-1">Add items with melting weights and rates</p>
                </div>
                <button onClick={addInvoiceItem} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-all">
                  <Plus size={18} /> Add Item
                </button>
              </div>

              {invoiceItems.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <FileText size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No items added. Click "Add Item" to start.</p>
                </div>
              )}

              {invoiceItems.map((item, idx) => (
                <div key={item.id || idx} className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800">Item {idx + 1} {item.item_name && `— ${item.item_name}`}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-green-600">Net: ₹{item.net_amount?.toLocaleString('en-IN') || 0}</span>
                      <button onClick={() => removeInvoiceItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelClass}>Item Name *</label>
                      <input value={item.item_name} onChange={e => updateInvoiceItem(idx, 'item_name', e.target.value)} className={inputClass} /></div>
                    <div><label className={labelClass}>Weight Before Melting (g)</label>
                      <input type="number" value={item.weight_before_melting} onChange={e => updateInvoiceItem(idx, 'weight_before_melting', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                    <div><label className={labelClass}>Weight After Melting (g)</label>
                      <input type="number" value={item.weight_after_melting} onChange={e => updateInvoiceItem(idx, 'weight_after_melting', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div><label className={labelClass}>Purity After Melting (%)</label>
                      <input type="number" value={item.purity_after_melting} onChange={e => updateInvoiceItem(idx, 'purity_after_melting', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                    <div><label className={labelClass}>Gold Rate / gm (₹)</label>
                      <input type="number" value={item.gold_rate_per_gm} onChange={e => updateInvoiceItem(idx, 'gold_rate_per_gm', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                    <div><label className={labelClass}>Gross Amount (₹)</label>
                      <div className={readOnlyClass}>₹{item.gross_amount?.toLocaleString('en-IN') || 0}</div></div>
                    <div><label className={labelClass}>Deductions (₹)</label>
                      <input type="number" value={item.deductions_amount} onChange={e => updateInvoiceItem(idx, 'deductions_amount', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                  </div>

                  <div className="flex justify-end">
                    <div className="px-6 py-3 bg-green-50 border-2 border-green-200 rounded-xl">
                      <span className="text-xs text-gray-500">Net Amount: </span>
                      <span className="font-bold text-green-700 text-lg">₹{item.net_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setStep(1); setError('') }} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2">
                <ChevronLeft size={20} /> Back
              </button>
              <button onClick={handleStep2} disabled={loading} className="flex-[2] py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-lg">
                {loading ? <><Loader size={20} className="animate-spin" /> Saving Items...</> : <>Save Items & Next <ChevronRight size={20} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  STEP 3: DEDUCTIONS                                          */}
        {/* ============================================================ */}
        {step === 3 && !allComplete && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Deductions</h2>
                  <p className="text-sm text-gray-500 mt-1">Add any deductions against invoice items (optional)</p>
                </div>
                <button onClick={addDeduction} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-all">
                  <Plus size={18} /> Add Deduction
                </button>
              </div>

              {deductions.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <Percent size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 mb-2">No deductions added</p>
                  <p className="text-gray-400 text-sm">You can skip this step if there are no deductions.</p>
                </div>
              )}

              {deductions.map((ded, idx) => (
                <div key={ded.id || idx} className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800">Deduction {idx + 1}</h4>
                    <button onClick={() => removeDeduction(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Invoice Item</label>
                      <select value={ded.invoice_item_id} onChange={e => updateDeduction(idx, 'invoice_item_id', parseInt(e.target.value) || 0)} className={inputClass}>
                        <option value={0}>Select item...</option>
                        {invoiceItems.map((item, i) => (
                          <option key={i} value={item._savedItemId || 0}>{item.item_name || `Item ${i + 1}`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Deduction Type *</label>
                      <select value={ded.deduction_type} onChange={e => updateDeduction(idx, 'deduction_type', e.target.value)} className={inputClass}>
                        <option value="">Select type...</option>
                        <option value="MAKING_CHARGE">Making Charge</option>
                        <option value="WASTAGE">Wastage</option>
                        <option value="STONE_DEDUCTION">Stone Deduction</option>
                        <option value="HALLMARK_CHARGE">Hallmark Charge</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Deduction Amount (₹)</label>
                      <input type="number" value={ded.deduction_amount} onChange={e => updateDeduction(idx, 'deduction_amount', parseFloat(e.target.value) || 0)} className={inputClass} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setStep(2); setError('') }} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2">
                <ChevronLeft size={20} /> Back
              </button>
              <button onClick={handleStep3} disabled={loading} className="flex-[2] py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-lg">
                {loading ? <><Loader size={20} className="animate-spin" /> Saving...</> : <>{deductions.length === 0 ? 'Skip & Next' : 'Save Deductions & Next'} <ChevronRight size={20} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  STEP 4: SETTLEMENT                                          */}
        {/* ============================================================ */}
        {step === 4 && !allComplete && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Settlement</h2>
                <p className="text-sm text-gray-500 mt-1">Payment mode and details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Payment Mode *</label>
                  <select value={settlement.payment_mode} onChange={e => setSettlement(p => ({ ...p, payment_mode: e.target.value }))} className={inputClass}>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="IMPS">IMPS</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Paid Amount (₹) *</label>
                  <input type="number" value={settlement.paid_amount} onChange={e => setSettlement(p => ({ ...p, paid_amount: parseFloat(e.target.value) || 0 }))} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Payment Date</label>
                  <input type="date" value={settlement.payment_date} onChange={e => setSettlement(p => ({ ...p, payment_date: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Reference No</label>
                  <input value={settlement.reference_no} onChange={e => setSettlement(p => ({ ...p, reference_no: e.target.value }))} placeholder="Transaction reference" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input value={settlement.bank_name} onChange={e => setSettlement(p => ({ ...p, bank_name: e.target.value }))} placeholder="Bank name" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setStep(3); setError('') }} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2">
                <ChevronLeft size={20} /> Back
              </button>
              <button onClick={handleStep4} disabled={loading} className="flex-[2] py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-lg">
                {loading ? <><Loader size={20} className="animate-spin" /> Saving...</> : <><CreditCard size={20} /> Complete Settlement</>}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  ALL COMPLETE — Summary + Preview Button                     */}
        {/* ============================================================ */}
        {allComplete && (
          <div className="space-y-6">

            {/* Success */}
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">Payment Completed Successfully!</h3>
                <p className="text-sm text-green-600 mt-1">
                  Invoice {invoice.invoice_no} • {invoiceItems.length} item{invoiceItems.length !== 1 ? 's' : ''} •
                  ₹{settlement.paid_amount.toLocaleString('en-IN')} via {settlement.payment_mode.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Invoice No" value={invoice.invoice_no} color="indigo" />
              <SummaryCard label="Total Amount" value={`₹${invoice.total_net_amount.toLocaleString('en-IN')}`} color="green" />
              <SummaryCard label="Payment Mode" value={settlement.payment_mode.replace('_', ' ')} color="purple" />
              <SummaryCard label="Paid Amount" value={`₹${settlement.paid_amount.toLocaleString('en-IN')}`} color="emerald" />
            </div>

            {/* Items Summary */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5">
                <h3 className="text-lg font-bold text-white">Invoice Items</h3>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Item', 'Wt Before', 'Wt After', 'Purity %', 'Rate/g', 'Gross', 'Deduct.', 'Net'].map(h => (
                        <th key={h} className="text-right first:text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-3 px-2 font-medium text-gray-800 text-left">{item.item_name}</td>
                        <td className="py-3 px-2 text-right text-gray-600">{item.weight_before_melting}g</td>
                        <td className="py-3 px-2 text-right text-gray-600">{item.weight_after_melting}g</td>
                        <td className="py-3 px-2 text-right text-gray-600">{item.purity_after_melting}%</td>
                        <td className="py-3 px-2 text-right text-gray-600">₹{item.gold_rate_per_gm}</td>
                        <td className="py-3 px-2 text-right text-gray-600">₹{item.gross_amount}</td>
                        <td className="py-3 px-2 text-right text-red-600">-₹{item.deductions_amount}</td>
                        <td className="py-3 px-2 text-right font-bold text-indigo-700">₹{item.net_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deductions Summary */}
            {deductions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-5">
                  <h3 className="text-lg font-bold text-white">Deductions ({deductions.length})</h3>
                </div>
                <div className="p-6">
                  {deductions.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-800">{d.deduction_type?.replace('_', ' ')}</span>
                      <span className="font-bold text-red-600">-₹{d.deduction_amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Button */}
            <button
              onClick={handlePreview}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-3 text-lg transition-all"
            >
              <Eye size={22} />
              Preview the Details
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================ */
/*  HELPERS                                                         */
/* ================================================================ */

function SummaryCard({ label, value, color }) {
  const colorMap = {
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700',
  }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border-2 rounded-xl p-5 text-center`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  )
}