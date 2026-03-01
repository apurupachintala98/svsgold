import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Loader, Plus, Trash2, ChevronLeft, AlertCircle,
  Save, Download, FileText, CreditCard, Calculator
} from 'lucide-react'
import { applicationsAPI } from '../api/api'
import PdfGenerator from '../utils/PdfGenerator'

export default function EstimationPage() {

  const location = useLocation()
  const navigate = useNavigate()
  const application = location.state?.application

  /* ---- State ---- */
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [estimationNo, setEstimationNo] = useState('')

  // After save
  const [saved, setSaved] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const mobile = application?.application?.mobile || application?.mobile || ''

  /* ---- Shared styles ---- */
  const inputClass =
    'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300'

  const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5'

  /* ================================================================ */
  /*  ITEM MANAGEMENT                                                 */
  /* ================================================================ */

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        item_name: '',
        quantity: 1,
        gross_weight_gms: 0,
        stone_weight_gms: 0,
        purity_percentage: 0,
        gold_rate_per_gm: 0,
        deduction_percentage: 0
      }
    ])
    setError('')
  }

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  /* ---- Calculate derived values for an item ---- */
  const calcItem = (item) => {
    const netWeight = (item.gross_weight_gms || 0) - (item.stone_weight_gms || 0)
    const grossAmount = netWeight * (item.gold_rate_per_gm || 0)
    const deduction = (grossAmount * (item.deduction_percentage || 0)) / 100
    const netAmount = grossAmount - deduction
    return { netWeight, grossAmount, deduction, netAmount }
  }

  const grandTotal = items.reduce((sum, item) => sum + calcItem(item).netAmount, 0)

  /* ================================================================ */
  /*  VALIDATION                                                      */
  /* ================================================================ */

  const validate = () => {
    if (items.length === 0) {
      setError('Please add at least one item')
      return false
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].item_name?.trim()) {
        setError(`Please enter item name for Item ${i + 1}`)
        return false
      }
      if (!items[i].gross_weight_gms || items[i].gross_weight_gms <= 0) {
        setError(`Please enter gross weight for Item ${i + 1}`)
        return false
      }
      if (!items[i].gold_rate_per_gm || items[i].gold_rate_per_gm <= 0) {
        setError(`Please enter gold rate for Item ${i + 1}`)
        return false
      }
    }
    return true
  }

  /* ================================================================ */
  /*  SAVE ESTIMATION — calls API per item, then fetches final preview */
  /* ================================================================ */

  const handleSaveEstimation = async () => {
    if (!validate()) return

    try {
      setLoading(true)
      setError('')

      const estNo = `EST-${Date.now()}`
      setEstimationNo(estNo)

      for (const item of items) {
        await applicationsAPI.addEstimation({
          mobile,
          estimation_no: estNo,
          item_name: item.item_name,
          quantity: item.quantity || 1,
          gross_weight_gms: item.gross_weight_gms || 0,
          stone_weight_gms: item.stone_weight_gms || 0,
          purity_percentage: item.purity_percentage || 0,
          gold_rate_per_gm: item.gold_rate_per_gm || 0,
          deduction_percentage: item.deduction_percentage || 0
        })
      }

      setSaved(true)

      setGeneratingPdf(true)
      const previewRes = await applicationsAPI.getFinalPreview(mobile)
      const preview = previewRes.data
      setPreviewData(preview)

      const pdfGenerator = new PdfGenerator()

      const formattedData = {
        estimation_no: estNo,
        name: preview?.account?.first_name
          ? `${preview.account.first_name} ${preview.account.last_name || ''}`.trim()
          : preview?.pledge_details?.pledger_name || '',
        mobile,
        application_no: preview?.application?.application_no || '',
        application_date: preview?.application?.application_date || '',
        items: items.map(item => {
          const { netWeight, netAmount } = calcItem(item)
          return {
            item_name: item.item_name,
            gross_weight: item.gross_weight_gms,
            net_weight: netWeight,
            gold_rate: item.gold_rate_per_gm,
            net_amount: netAmount.toFixed(2)
          }
        })
      }

      const pdfBytes = await pdfGenerator.generateEstimationPdf(formattedData)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      setPdfUrl(URL.createObjectURL(blob))

    } catch (err) {
      console.error('Error saving estimation:', err)
      setError(err.response?.data?.message || 'Failed to save estimation. Please try again.')
    } finally {
      setLoading(false)
      setGeneratingPdf(false)
    }
  }

  /* ================================================================ */
  /*  PROCEED TO PAYMENT                                              */
  /* ================================================================ */

  const handleProceedToPayment = () => {
    navigate('/payment', {
      state: {
        application: previewData,
        estimation_no: estimationNo,
        items,
        grandTotal
      }
    })
  }

  /* ================================================================ */
  /*  NO APPLICATION DATA                                             */
  /* ================================================================ */

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Application Data</h2>
          <p className="text-gray-500 mb-6">
            Please go back to the dashboard and select an application first.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ---- Header ---- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 bg-white hover:bg-gray-50 rounded-xl shadow-md transition-all"
            >
              <ChevronLeft size={22} className="text-indigo-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Estimation
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {application?.application?.application_no || 'Application'} • Mobile: {mobile}
              </p>
            </div>
          </div>

          {!saved && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm">
              <Calculator size={18} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-700">
                Total: ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* ---- Error ---- */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* ================================================================ */}
        {/*  ESTIMATION FORM — shown before save                            */}
        {/* ================================================================ */}
        {!saved && (
          <div className="space-y-6">

            {/* Items */}
            {items.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
                <FileText size={48} className="mx-auto text-indigo-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Items Added</h3>
                <p className="text-gray-500 mb-6">Add gold items to estimate their value</p>
                <button
                  onClick={addItem}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  <Plus size={18} className="inline mr-2" />
                  Add First Item
                </button>
              </div>
            )}

            {items.map((item, index) => {
              const calc = calcItem(item)
              return (
                <div
                  key={item.id || index}
                  className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800">
                      Item {index + 1}
                      {item.item_name && (
                        <span className="ml-2 text-sm font-normal text-gray-500">— {item.item_name}</span>
                      )}
                    </h4>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-indigo-600">
                        ₹{calc.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Row 1: Name + Quantity */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        placeholder="e.g., Gold Chain"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="1"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Purity %</label>
                      <input
                        type="number"
                        value={item.purity_percentage}
                        onChange={(e) => updateItem(index, 'purity_percentage', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Row 2: Weights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>
                        Gross Weight (gms) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.gross_weight_gms}
                        onChange={(e) => updateItem(index, 'gross_weight_gms', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Stone Weight (gms)</label>
                      <input
                        type="number"
                        value={item.stone_weight_gms}
                        onChange={(e) => updateItem(index, 'stone_weight_gms', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Net Weight (gms)</label>
                      <div className="px-4 py-3 bg-indigo-50 border-2 border-indigo-100 rounded-xl text-indigo-700 font-semibold">
                        {calc.netWeight.toFixed(2)} gms
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Rate + Deduction + Net Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>
                        Gold Rate per gm (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.gold_rate_per_gm}
                        onChange={(e) => updateItem(index, 'gold_rate_per_gm', parseFloat(e.target.value) || 0)}
                        min="0"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Deduction %</label>
                      <input
                        type="number"
                        value={item.deduction_percentage}
                        onChange={(e) => updateItem(index, 'deduction_percentage', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Net Amount (₹)</label>
                      <div className="px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 font-bold text-lg">
                        ₹{calc.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Add + Save buttons */}
            {items.length > 0 && (
              <div className="space-y-4">
                <button
                  onClick={addItem}
                  className="w-full py-3 border-2 border-dashed border-indigo-400 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Another Item
                </button>

                {/* Grand Total */}
                <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">Grand Total</span>
                  <span className="text-2xl font-bold text-indigo-700">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={handleSaveEstimation}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      {generatingPdf ? 'Generating PDF...' : 'Saving Items...'}
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save & Generate Estimation PDF
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/*  PDF PREVIEW + PROCEED TO PAYMENT — shown after save            */}
        {/* ================================================================ */}
        {saved && (
          <div className="space-y-6">

            {/* Success Banner */}
            <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-green-800 font-medium">Estimation Saved Successfully</p>
                <p className="text-xs text-green-600 mt-1">
                  Estimation No: {estimationNo} • {items.length} item{items.length > 1 ? 's' : ''} •
                  Grand Total: ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* PDF Preview */}
            {pdfUrl && (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800">Estimation PDF Preview</h3>
                  <a
                    href={pdfUrl}
                    download={`${estimationNo}_Estimation.pdf`}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-all"
                  >
                    <Download size={16} />
                    Download
                  </a>
                </div>

                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="700px"
                  onLoad={() => setPdfLoaded(true)}
                  className="rounded-xl border"
                  title="Estimation PDF"
                />
              </div>
            )}

            {/* Estimation Summary Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5">
                <h3 className="text-lg font-bold text-white">Estimation Summary</h3>
                <p className="text-indigo-200 text-sm mt-1">
                  {previewData?.account?.first_name
                    ? `${previewData.account.first_name} ${previewData.account.last_name || ''}`
                    : mobile
                  }
                </p>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Gross Wt</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Net Wt</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Rate/g</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Deduction</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const c = calcItem(item)
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-3 font-medium text-gray-800">{item.item_name}</td>
                          <td className="py-3 px-3 text-right text-gray-600">{item.quantity}</td>
                          <td className="py-3 px-3 text-right text-gray-600">{item.gross_weight_gms}g</td>
                          <td className="py-3 px-3 text-right text-gray-600">{c.netWeight.toFixed(2)}g</td>
                          <td className="py-3 px-3 text-right text-gray-600">₹{item.gold_rate_per_gm}</td>
                          <td className="py-3 px-3 text-right text-gray-600">{item.deduction_percentage}%</td>
                          <td className="py-3 px-3 text-right font-bold text-indigo-700">₹{c.netAmount.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={6} className="py-4 px-3 text-right font-bold text-gray-800 text-base">Grand Total</td>
                      <td className="py-4 px-3 text-right font-bold text-indigo-700 text-xl">
                        ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <a
                href={pdfUrl}
                download={`${estimationNo}_Estimation.pdf`}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                <Download size={20} />
                Download Estimation PDF
              </a>

              <button
                onClick={handleProceedToPayment}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 text-lg"
              >
                <CreditCard size={20} />
                Proceed to Payment
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

/* ---- tiny helper for the success banner ---- */
function Check({ size, className }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}