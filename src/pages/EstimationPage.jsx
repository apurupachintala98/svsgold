import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Loader, Plus, Trash2, AlertCircle, Save, Download,
  FileText, CreditCard, Calculator, LogOut, Menu, X, Home
} from 'lucide-react'
import { applicationsAPI } from '../api/api'
import PdfGenerator from '../utils/PdfGenerator'

export default function EstimationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const application = location.state?.application

  /* ---- Sidebar ---- */
  const [sidebarOpen, setSidebarOpen] = useState(true)

  /* ---- Items ---- */
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [estimationNo, setEstimationNo] = useState('')

  /* ---- Post-save ---- */
  const [saved, setSaved] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const storedLogin = JSON.parse(localStorage.getItem('svs_gold_login_data') || '{}')
  const loggedInMobile = localStorage.getItem('user_mobile') || storedLogin?.mobile || ''

  /* ================================================================ */
  /*  PRE-FILL FROM ORNAMENTS (from finalPreview via application)     */
  /* ================================================================ */
  useEffect(() => {
    if (!application) return
    const ornaments = application.ornaments || []
    if (ornaments.length > 0 && items.length === 0) {
      setItems(ornaments.map((o, i) => ({
        id: Date.now() + i,
        item_name: o.item_name || '',
        quantity: Number(o.quantity) || 1,
        gross_weight_gms: Number(o.approx_weight_gms) || 0,
        stone_weight_gms: 0,
        purity_percentage: Number(o.purity_percentage) || 0,
        gold_rate_per_gm: 0,
        deduction_percentage: 0
      })))
    }
  }, [application])

  /* ---- Styles ---- */
  const inputClass = 'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300'
  const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5'

  /* ---- Item helpers ---- */
  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now(), item_name: '', quantity: 1, gross_weight_gms: 0, stone_weight_gms: 0, purity_percentage: 0, gold_rate_per_gm: 0, deduction_percentage: 0 }])
    setError('')
  }
  const updateItem = (i, f, v) => setItems(prev => { const u = [...prev]; u[i] = { ...u[i], [f]: v }; return u })
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const calcItem = (item) => {
    // net_gold_weight = gross_weight - stone_weight
    const netWeight = Math.round(((parseFloat(item.gross_weight_gms) || 0) - (parseFloat(item.stone_weight_gms) || 0)) * 100) / 100
    // pure_gold_weight = net_gold_weight * (purity / 100)
    const pureGoldWeight = Math.round((netWeight * (parseFloat(item.purity_percentage) || 0) / 100) * 100) / 100
    // gross_amount = pure_gold_weight * gold_rate_per_gm
    const grossAmount = Math.round((pureGoldWeight * (parseFloat(item.gold_rate_per_gm) || 0)) * 100) / 100
    // net_amount = gross_amount - (gross_amount * deduction / 100)
    const netAmount = Math.round((grossAmount - (grossAmount * (parseFloat(item.deduction_percentage) || 0) / 100)) * 100) / 100
    return { netWeight, pureGoldWeight, grossAmount, netAmount }
  }

  const grandTotal = items.reduce((s, it) => s + calcItem(it).netAmount, 0)

  /* ---- Pledge Release: deduct total_due from grand total ---- */
  const appType = application?.application?.application_type || ''
  const isPledgeRelease = appType === 'PLEDGE_RELEASE'
  const totalDue = parseFloat(application?.pledge_details?.total_due) || 0
  const finalAmount = isPledgeRelease ? Math.max(0, grandTotal - totalDue) : grandTotal

  /* ---- Validate ---- */
  const validate = () => {
    if (items.length === 0) { setError('Add at least one item'); return false }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].item_name?.trim()) { setError(`Item ${i + 1}: name is required`); return false }
      if (!parseFloat(items[i].gross_weight_gms)) { setError(`Item ${i + 1}: gross weight is required`); return false }
      if (!parseFloat(items[i].gold_rate_per_gm)) { setError(`Item ${i + 1}: gold rate is required`); return false }
    }
    return true
  }

  /* ---- Save ---- */
  const handleSaveEstimation = async () => {
    if (!validate()) return
    try {
      setLoading(true); setError('')
      const estNo = `EST-${Date.now()}`
      setEstimationNo(estNo)

      for (const item of items) {
        await applicationsAPI.addEstimation({
          mobile: loggedInMobile, estimation_no: estNo, item_name: item.item_name,
          quantity: parseFloat(item.quantity) || 1, gross_weight_gms: parseFloat(item.gross_weight_gms) || 0,
          stone_weight_gms: parseFloat(item.stone_weight_gms) || 0, purity_percentage: parseFloat(item.purity_percentage) || 0,
          gold_rate_per_gm: parseFloat(item.gold_rate_per_gm) || 0, deduction_percentage: parseFloat(item.deduction_percentage) || 0
        })
      }

      setSaved(true); setGeneratingPdf(true)
      const res = await applicationsAPI.getFinalPreview(loggedInMobile)
      const preview = res.data; setPreviewData(preview)

      const gen = new PdfGenerator()
      const pdfBytes = await gen.generateEstimationPdf({
        estimation_no: estNo,
        name: preview?.account?.name || [preview?.account?.first_name, preview?.account?.last_name].filter(Boolean).join(' ') || preview?.pledge_details?.pledger_name || '',
        mobile: loggedInMobile,
        application_no: preview?.application?.application_no || '',
        items: items.map(it => { const c = calcItem(it); return { item_name: it.item_name, gross_weight: it.gross_weight_gms, net_weight: c.netWeight, pure_gold_weight: c.pureGoldWeight, gold_rate: it.gold_rate_per_gm, net_amount: c.netAmount.toFixed(2) } })
      })
      setPdfUrl(URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' })))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save estimation.')
    } finally { setLoading(false); setGeneratingPdf(false) }
  }

  const handleProceedToPayment = () => {
    navigate('/payment', { state: { application: previewData, estimation_no: estimationNo, items, grandTotal: finalAmount } })
  }

  const handleLogout = () => {
    localStorage.removeItem('svs_gold_login_data'); localStorage.removeItem('user_mobile'); navigate('/login')
  }

  /* ---- No data guard ---- */
  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda)' }}>
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Application Data</h2>
          <p className="text-gray-500 mb-6">Please go back and select an application first.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}>Go to Dashboard</button>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="flex h-screen" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda, #fdf8f0)' }}>

      {/* ======== SIDEBAR ======== */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} text-white transition-all duration-300 shadow-2xl overflow-hidden flex-shrink-0`} style={{ background: 'linear-gradient(180deg, #a36e24, #8b5c1c)' }}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <img src="/svslogo-white.png" alt="SVS Gold" className="w-8 h-8 object-contain" />
              </div>
              {sidebarOpen && <span className="font-bold text-lg">SVS Gold</span>}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all">
              <FileText size={20} className="text-amber-200" />
              {sidebarOpen && <span className="font-medium">Applications</span>}
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Calculator size={20} className="text-amber-200" />
              {sidebarOpen && <span className="font-medium">Estimation</span>}
            </button>
          </nav>

          {/* Collapse */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg hover:bg-white/10 transition-all">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              {sidebarOpen && <span className="text-sm">Collapse</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ======== MAIN ======== */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="bg-white shadow-md px-8 py-5 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Estimation</h1>
            <p className="text-gray-500 text-sm mt-1">{application?.application?.application_no || 'Application'} • Customer: {loggedInMobile}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-3 rounded-lg hover:bg-gray-100 transition-colors"><Home size={20} className="text-gray-600" /></button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"><LogOut size={18} /> Logout</button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/*  ESTIMATION FORM (before save)                           */}
            {/* ======================================================== */}
            {!saved && (
              <div className="space-y-6">

                {/* Pre-fill info banner */}
                {items.length > 0 && application?.ornaments?.length > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f0d5a8)', border: '1px solid #e4b96e' }}>
                    <FileText size={18} style={{ color: '#a36e24' }} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#6e4816' }}>Ornament details pre-filled from application</p>
                      <p className="text-xs mt-0.5" style={{ color: '#8b5c1c' }}>Item names, quantities, weights and purity have been carried over. Fill in Gold Rate and Deduction to complete the estimation.</p>
                    </div>
                  </div>
                )}

                {items.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
                    <FileText size={48} className="mx-auto text-amber-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Items</h3>
                    <p className="text-gray-500 mb-6">Add gold items to estimate their value</p>
                    <button onClick={addItem} className="px-8 py-3 text-white font-bold rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}>
                      <Plus size={18} className="inline mr-2" /> Add First Item
                    </button>
                  </div>
                )}

                {items.map((item, index) => {
                  const calc = calcItem(item)
                  const isFromOrnament = application?.ornaments?.length > 0 && index < application.ornaments.length
                  return (
                    <div key={item.id || index} className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-800">
                          Item {index + 1}
                          {item.item_name && <span className="ml-2 text-sm font-normal text-gray-500">— {item.item_name}</span>}
                          {isFromOrnament && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">From ornaments</span>}
                        </h4>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-amber-700">₹{calc.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          <button onClick={() => removeItem(index)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                        </div>
                      </div>

                      {/* Row 1: Name, Qty, Purity */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className={labelClass}>Item Name <span className="text-red-500">*</span></label>
                          <input type="text" value={item.item_name} onChange={(e) => updateItem(index, 'item_name', e.target.value)} placeholder="e.g., Gold Chain" className={inputClass} readOnly={isFromOrnament} />
                        </div>
                        <div>
                          <label className={labelClass}>Quantity</label>
                          <input type="text" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value.replace(/[^0-9]/g, ''))} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Purity %</label>
                          <input type="text" value={item.purity_percentage} onChange={(e) => updateItem(index, 'purity_percentage', e.target.value.replace(/[^0-9.]/g, ''))} className={inputClass} />
                        </div>
                      </div>

                      {/* Row 2: Weights */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Gross Weight (gms) <span className="text-red-500">*</span></label>
                          <input type="text" value={item.gross_weight_gms} onChange={(e) => updateItem(index, 'gross_weight_gms', e.target.value.replace(/[^0-9.]/g, ''))} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Stone Weight (gms)</label>
                          <input type="text" value={item.stone_weight_gms} onChange={(e) => updateItem(index, 'stone_weight_gms', e.target.value.replace(/[^0-9.]/g, ''))} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Net Weight (gms)</label>
                          <div className="px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-xl text-amber-800 font-semibold">{calc.netWeight.toFixed(2)} gms</div>
                        </div>
                      </div>

                      {/* Row 3: Rate, Deduction, Net */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Gold Rate per gm (₹) <span className="text-red-500">*</span></label>
                          <input type="text" value={item.gold_rate_per_gm} onChange={(e) => updateItem(index, 'gold_rate_per_gm', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Enter rate" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Deduction %</label>
                          <input type="text" value={item.deduction_percentage} onChange={(e) => updateItem(index, 'deduction_percentage', e.target.value.replace(/[^0-9.]/g, ''))} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Net Amount (₹)</label>
                          <div className="px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 font-bold text-lg">₹{calc.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {items.length > 0 && (
                  <div className="space-y-4">
                    <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-amber-500 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all flex items-center justify-center gap-2">
                      <Plus size={18} /> Add Another Item
                    </button>
                    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-800">Estimation Total</span>
                        <span className="text-2xl font-bold text-amber-800">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {isPledgeRelease && totalDue > 0 && (
                        <>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-sm text-red-600 font-medium">Less: Pledge Total Due</span>
                            <span className="text-lg font-semibold text-red-600">- ₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t-2 border-amber-200">
                            <span className="text-lg font-bold text-gray-900">Amount Payable to Customer</span>
                            <span className="text-2xl font-bold text-green-700">₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <button onClick={handleSaveEstimation} disabled={loading} className="px-10 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-all hover:-translate-y-0.5">
                        {loading ? (
                          <><Loader size={18} className="animate-spin" /> {generatingPdf ? 'Generating PDF...' : 'Saving Items...'}</>
                        ) : (
                          <><Save size={18} /> Save & Generate Estimation PDF</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/*  POST-SAVE: Estimation PDF Preview (matches template)    */}
            {/* ======================================================== */}
            {saved && (() => {
              const acc = previewData?.account || {}
              const addrs = previewData?.addresses || []
              const custName = acc.name || [acc.first_name, acc.last_name].filter(Boolean).join(' ') || ''
              const presentA = addrs.find(a => /present|current/i.test(a.address_type)) || addrs[0] || {}
              const permA = addrs.find(a => /permanent/i.test(a.address_type)) || addrs[1] || presentA
              const fmtA = (a) => [a?.address_line, a?.street, a?.city, a?.state, a?.pincode].filter(Boolean).join(', ')

              const numToWords = (n) => {
                if (!n || n === 0) return 'Zero'
                const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
                const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
                const num = Math.floor(Math.abs(n))
                if (num < 20) return a[num]
                if (num < 100) return b[Math.floor(num/10)] + (num%10 ? ' ' + a[num%10] : '')
                if (num < 1000) return a[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' and ' + numToWords(num%100) : '')
                if (num < 100000) return numToWords(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' ' + numToWords(num%1000) : '')
                if (num < 10000000) return numToWords(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' ' + numToWords(num%100000) : '')
                return numToWords(Math.floor(num/10000000)) + ' Crore' + (num%10000000 ? ' ' + numToWords(num%10000000) : '')
              }

              const blue = '#2c5f8a'
              const cb = '1px solid #6a9ec7'
              const lb = { border: cb, padding: '5px 8px', fontWeight: 'bold', background: '#f0f6fb', fontSize: '10px' }
              const vl = { border: cb, padding: '5px 8px', fontSize: '10px' }

              return (
              <div className="space-y-6">
                {/* Success banner */}
                <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><Check size={18} className="text-white" /></div>
                  <div>
                    <p className="text-sm text-green-800 font-medium">Estimation Saved Successfully</p>
                    <p className="text-xs text-green-600 mt-1">Estimation No: {estimationNo} • {items.length} item{items.length > 1 ? 's' : ''} • Total: ₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* ======== ESTIMATION PDF REPLICA ======== */}
                <div id="estimation-print-area" style={{ fontFamily: "'Times New Roman',Georgia,serif", maxWidth: '750px', margin: '0 auto', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>

                  {/* Header */}
                  <div style={{ background: `linear-gradient(180deg, #3a7ab5, ${blue})`, padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#fff', lineHeight: '1.5' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>SVS GOLD PRIVATE LIMITED</div>
                      <div style={{ fontSize: '10px', opacity: .85 }}>3-4-659/3, YMCA, Himayathnagar</div>
                      <div style={{ fontSize: '10px', opacity: .85 }}>Himayathnagar, Hyderabad - 29</div>
                      <div style={{ fontSize: '10px', opacity: .85 }}>98855 88220</div>
                      <div style={{ fontSize: '10px', opacity: .85 }}>www.svsgold.com</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px' }}>ESTIMATION COPY</div>
                    </div>
                    <div style={{ width: '100px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/svslogo-white.png" alt="SVS Gold" style={{ maxHeight: '65px', maxWidth: '95px', objectFit: 'contain' }} />
                    </div>
                  </div>

                  <div style={{ padding: '20px 28px' }}>
                    {/* Customer Details */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={lb} width="130">Estimation No.</td>
                          <td style={vl}>{estimationNo}</td>
                          <td style={lb} width="60">Date</td>
                          <td style={vl} width="120">{new Date().toLocaleDateString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Name</td>
                          <td style={vl} colSpan={3}>{custName}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Email ID</td>
                          <td style={vl}>{acc.email || ''}</td>
                          <td style={lb}>Mobile No.</td>
                          <td style={vl}>{loggedInMobile}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Present Address</td>
                          <td style={vl} colSpan={3}>{fmtA(presentA)}</td>
                        </tr>
                        <tr>
                          <td style={lb}>Permanent Address</td>
                          <td style={vl} colSpan={3}>{fmtA(permA)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Items Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', marginBottom: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f0f6fb' }}>
                          {['S.\nNo.','Item','Qty.','Gross\nWeight\nIn Gms','Stone\nWeight\nIn Carats','Net\nWeight\nIn Gms','Gold Rate\nPer Gm.','Purity\nIn %','Gross\nAmount','Deductions','Net\nAmount','Item\nPictures'].map((h,i) => (
                            <th key={i} style={{ border: cb, padding: '6px 4px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'pre-line', verticalAlign: 'bottom', lineHeight: '1.3' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => {
                          const c = calcItem(item)
                          return (
                            <tr key={i}>
                              <td style={{ ...vl, textAlign: 'center' }}>{i + 1}</td>
                              <td style={vl}>{item.item_name}</td>
                              <td style={{ ...vl, textAlign: 'center' }}>{item.quantity}</td>
                              <td style={{ ...vl, textAlign: 'center' }}>{item.gross_weight_gms}</td>
                              <td style={{ ...vl, textAlign: 'center' }}>{item.stone_weight_gms || 0}</td>
                              <td style={{ ...vl, textAlign: 'center' }}>{c.netWeight.toFixed(2)}</td>
                              <td style={{ ...vl, textAlign: 'center' }}>{item.gold_rate_per_gm}</td>
                              <td style={{ ...vl, textAlign: 'center' }}>{item.purity_percentage}%</td>
                              <td style={{ ...vl, textAlign: 'center' }}>₹{c.grossAmount.toLocaleString('en-IN')}</td>
                              <td style={{ ...vl, textAlign: 'center' }}>{item.deduction_percentage}%</td>
                              <td style={{ ...vl, textAlign: 'center', fontWeight: 'bold' }}>₹{c.netAmount.toLocaleString('en-IN')}</td>
                              <td style={{ ...vl, textAlign: 'center', padding: '2px' }}></td>
                            </tr>
                          )
                        })}
                        {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                          <tr key={`e${i}`}>{Array.from({length:12}).map((_,j) => <td key={j} style={{ ...vl, height: '24px' }}>&nbsp;</td>)}</tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Total Net Amount */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '6px' }}>
                      <tbody>
                        <tr>
                          <td style={lb} width="150">Total Net Amount</td>
                          <td style={{ ...vl, fontWeight: 'bold', fontSize: '13px' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {isPledgeRelease && totalDue > 0 && (
                          <>
                            <tr>
                              <td style={{ ...lb, color: '#dc2626' }}>Less: Pledge Due</td>
                              <td style={{ ...vl, color: '#dc2626', fontWeight: 'bold' }}>- ₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td style={{ ...lb, background: '#e8f5e9' }}>Payable to Customer</td>
                              <td style={{ ...vl, fontWeight: 'bold', fontSize: '13px', color: '#16a34a' }}>₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td style={lb}>Amount In Words</td>
                          <td style={{ ...vl, fontStyle: 'italic' }}>{numToWords(Math.round(isPledgeRelease ? finalAmount : grandTotal))} Rupees Only</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Consent for Melting */}
                    <div style={{ marginTop: '16px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: blue, marginBottom: '6px' }}>Consent for Melting:</div>
                      <div style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'justify' }}>
                        I <strong>{custName || '____________'}</strong>, hereby grant <strong>SVS Gold Private Limited (' SVS Gold')</strong> and its representative's permission and accord my consent to remove precious/semi - precious stones, gems, dust, or any material other than gold from ornaments before melting. Upon melting, I will accept to actual weight and purity arrived after melting of my ornaments. I agree to bear all the losses in terms of purity and weight which occurs from the melting process and/or stones and other materials removal. I agree to settle the differential amount based on the current gold rate to SVS Gold before and after melting.
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: blue, marginBottom: '6px' }}>Terms & Conditions</div>
                      <ol style={{ fontSize: '9.5px', lineHeight: '1.7', paddingLeft: '16px', margin: 0 }}>
                        <li style={{ marginBottom: '3px' }}>SVS Gold is not responsible for any loss after melting such as weight loss or purity loss. The customer will not have any claim for the weight loss and purity loss.</li>
                        <li style={{ marginBottom: '3px' }}>After melting, if the gold is rejected by the SVS Gold due to inadequate purity or customer rejects the gold due to any reason, the melted gold (after melting) will be returned to the customer. The Customer agrees and undertakes not to claim gold in its earlier form, shape size and weight as it was prior to melting of gold ornament and agrees that SVS Gold shall not be held liable to restore gold into original form, size and weight as it was before melting and the customer is liable to refund full advance amount to Gold.</li>
                        <li style={{ marginBottom: '3px' }}>The above gold price per gram is valid for today only. The gold rates change on day-to-day basis.</li>
                        <li style={{ marginBottom: '3px' }}>Deductions include processing fees, documentation charges and other charges.</li>
                        <li style={{ marginBottom: '3px' }}>All the disputes arising from this transaction shall be settled by binding arbitration within jurisdiction of Hyderabad, Telangana.</li>
                      </ol>
                    </div>

                    {/* Date / Place / Signature */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                      <table style={{ fontSize: '11px', borderCollapse: 'collapse' }}><tbody>
                        <tr><td style={lb}>Date</td><td style={{ ...vl, minWidth: '150px' }}>{new Date().toLocaleDateString('en-IN')}</td></tr>
                        <tr><td style={lb}>Place</td><td style={vl}>{application?.application?.place || ''}</td></tr>
                      </tbody></table>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '220px', borderBottom: '1px solid #666', paddingBottom: '40px', marginBottom: '4px' }}></div>
                        <div style={{ fontSize: '10px', color: '#555' }}>Customer Signature / Thumb Impression</div>
                      </div>
                    </div>
                  </div>
                </div>

                   <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      const el = document.getElementById('estimation-print-area')
                      if (!el) return
                      const w = window.open('','_blank')
                      w.document.write(`<html><head><title>Estimation</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Times New Roman',serif;background:#fff}@media print{@page{margin:10mm}}</style></head><body>${el.innerHTML}</body></html>`)
                      w.document.close(); setTimeout(() => { w.print(); w.close() }, 400)
                    }}
                    className="px-6 py-2.5 flex items-center gap-2 bg-white text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 transition-all hover:bg-gray-50 text-sm"
                  >
                    <Download size={16} /> Print / Download
                  </button>
                  <button onClick={handleProceedToPayment} className="px-8 py-2.5 flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg text-sm">
                    <CreditCard size={16} /> Proceed to Payment
                  </button>
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

/* ---- Check icon for success banner ---- */
function Check({ size, className }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}