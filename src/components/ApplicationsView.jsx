import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, AlertCircle, Loader, Edit, ChevronLeft,
  FileText, Calendar, MapPin, User, Building2,
  Hash, Clock, FileDown, CreditCard, Calculator
} from 'lucide-react'
import ApplicationForm from './ApplicationForm'
import ApplicationPreview from './ApplicationPreview'
import { applicationsAPI, accountsAPI } from '../api/api'

export default function ApplicationsView({
  userIdentifier,
  applications,
  loading,
  error,
  onApplicationsUpdate
}) {
  const navigate = useNavigate()

  const [selectedApplication, setSelectedApplication] = useState(null)
  const [viewMode, setViewMode] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [selectedPdf, setSelectedPdf] = useState(null)

  // Data from final-preview (single source of truth)
  const [previewData, setPreviewData] = useState(null)
  const [checkingCompletion, setCheckingCompletion] = useState(true)

  /* ================================================================ */
  /*  FETCH DATA ON MOUNT — searchCustomer only (has everything)      */
  /* ================================================================ */
  useEffect(() => {
    if (!userIdentifier) return

    const fetchPreview = async () => {
      setCheckingCompletion(true)
      let custData = {}
      try {
        const res = await accountsAPI.searchCustomer(userIdentifier)
        custData = res.data || {}
      } catch {}

      const merged = {
        account: custData.customer || {},
        addresses: custData.addresses || [],
        documents: custData.documents || [],
        bank_account: custData.bank_accounts?.[0] || null,
        invoices: custData.invoices || [],
        estimations: custData.estimations || [],
        pledge_details: custData.pledge_details || [],
        ornaments: custData.ornaments || [],
        application: null
      }

      setPreviewData(Object.keys(custData).length > 0 ? merged : null)
      setCheckingCompletion(false)
    }

    fetchPreview()
  }, [userIdentifier, applications])

  /* ================================================================ */
  /*  EXTRACT DATA FROM PREVIEW                                       */
  /* ================================================================ */
  const allPledges = previewData?.pledge_details || []
  const allOrnaments = previewData?.ornaments || []

  // Per-app helpers
  const getAppPledge = (appId) => (Array.isArray(allPledges) ? allPledges : []).find(p => p.application_id === appId)
  const getAppOrnaments = (appId) => (Array.isArray(allOrnaments) ? allOrnaments : []).filter(o => o.application_id === appId)

  /* ================================================================ */
  /*  TYPE-AWARE COMPLETION CHECK (per application_id)                */
  /* ================================================================ */
  const isAppComplete = (app) => {
    if (!previewData) {
      const status = (app?.status || '').toUpperCase()
      return ['SUBMITTED', 'APPROVED', 'COMPLETED'].includes(status)
    }
    const appId = app?.application_id
    const type = app?.application_type || ''
    const appHasOrn = getAppOrnaments(appId).length > 0
    if (type === 'DIRECT_BUYING') return appHasOrn
    const appHasPledge = !!getAppPledge(appId)
    return appHasPledge && appHasOrn
  }

  const getMissingSteps = (app) => {
    const appId = app?.application_id
    const type = app?.application_type || ''
    const missing = []
    if (type === 'DIRECT_BUYING') {
      if (getAppOrnaments(appId).length === 0) missing.push('Ornaments')
    } else {
      if (!getAppPledge(appId)) missing.push('Pledge details')
      if (getAppOrnaments(appId).length === 0) missing.push('Ornaments')
    }
    return missing
  }

  const getDisplayStatus = (app) => {
    // Always trust the app's own status from the server first
    const serverStatus = (app.status || '').toUpperCase()
    if (serverStatus && serverStatus !== 'DRAFT') return serverStatus

    // Only override to DRAFT if preview has loaded and app is actually incomplete
    if (!checkingCompletion && !isAppComplete(app)) return 'DRAFT'

    return app.status || 'DRAFT'
  }

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':     return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'SUBMITTED': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'APPROVED':  return 'bg-green-50 text-green-700 border-green-200'
      case 'REJECTED':  return 'bg-red-50 text-red-700 border-red-200'
      case 'COMPLETED': return 'bg-amber-50 text-amber-800 border-amber-200'
      default:          return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  /* ================================================================ */
  /*  VIEW APPLICATION DETAILS — fetch from search API by app_id      */
  /* ================================================================ */
  const handleViewApplication = async (app) => {
    setSelectedApplication(app)
    setViewMode('view')
    setDetailLoading(true)
    setDetailError('')

    const appId = app.application_id
    let custData = {}

    try {
      const res = await accountsAPI.searchCustomer(userIdentifier)
      custData = res.data || {}
    } catch {}

    // Match by application_id
    const allPledges = custData.pledge_details || []
    const appPledge = allPledges.find(p => p.application_id === appId) || null

    const allOrnaments = custData.ornaments || []
    const appOrnaments = allOrnaments.filter(o => o.application_id === appId)

    const allEstimations = custData.estimations || []
    const appEstimation = allEstimations.find(e => e.application_id === appId) || null

    const allInvoices = custData.invoices || []
    const appInvoice = allInvoices.find(inv => inv.application_id === appId) || null

    const mergedPreview = {
      account: custData.customer || {},
      addresses: custData.addresses || [],
      documents: custData.documents || [],
      bank_account: custData.bank_accounts?.[0] || null,
      invoices: allInvoices,
      pledge_details: allPledges,
      ornaments: allOrnaments,
      estimation: appEstimation,
      application: app,
      _appPledge: appPledge,
      _appOrnaments: appOrnaments,
      _appEstimation: appEstimation,
      _appInvoice: appInvoice
    }
    setPreviewData(mergedPreview)

    setDetailData({
      application: app,
      pledge_details: appPledge,
      ornaments: appOrnaments,
      estimation: appEstimation,
      invoice: appInvoice
    })
    setDetailLoading(false)
  }

  const handleEditApplication = (app) => {
    setSelectedApplication(app)
    setViewMode('edit')
  }

  const handleBackToList = () => {
    setViewMode(null)
    setSelectedApplication(null)
    setDetailData(null)
    setDetailError('')
    setSelectedPdf(null)
  }

  const handleApplicationCreated = (updatedApplication) => {
    const updatedList = applications.some(
      app => app.application_no === updatedApplication.application_no
    )
      ? applications.map(app =>
          app.application_no === updatedApplication.application_no
            ? { ...app, ...updatedApplication }
            : app
        )
      : [...applications, updatedApplication]

    onApplicationsUpdate(updatedList)

    // Force re-fetch preview data on next render
    setPreviewData(null)
    setViewMode(null)
    setSelectedApplication(null)
  }

  /* ================================================================ */
  /*  LOADING / ERROR                                                 */
  /* ================================================================ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader size={48} className="text-amber-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading applications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 flex items-start gap-4">
        <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  DETAIL VIEW                                                     */
  /* ================================================================ */
  if (viewMode === 'view' && selectedApplication) {
    const complete = isAppComplete(selectedApplication)
    const displayStatus = getDisplayStatus(selectedApplication)
    const missing = getMissingSteps(selectedApplication)
    const isDirect = selectedApplication.application_type === 'DIRECT_BUYING'
    const isDraft = displayStatus === 'DRAFT'

    return (
      <div className="space-y-6">
        <button onClick={handleBackToList} className="flex items-center gap-2 px-4 py-2 text-amber-700 hover:bg-amber-50 rounded-xl transition-colors font-medium">
          <ChevronLeft size={20} /> Back to Applications
        </button>

        {/* Completion Warning — only show for DRAFT apps that are genuinely incomplete */}
        {!detailLoading && isDraft && !complete && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-amber-800 font-medium">Application Incomplete — Status: DRAFT</p>
              <p className="text-xs text-amber-600 mt-1">
                {missing.length > 0
                  ? `${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} missing.`
                  : 'Complete all steps and click "Accept & Continue" to submit.'
                }
              </p>
              <button onClick={() => handleEditApplication(selectedApplication)} className="mt-3 flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all text-sm">
                <Edit size={16} /> Edit & Complete
              </button>
            </div>
          </div>
        )}

        {detailLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader size={40} className="text-amber-700 animate-spin" />
          </div>
        )}

        {!detailLoading && detailData && (
          <div className="space-y-6">

            {/* Application Info */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-100">
              <div className="px-8 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f0d5a8)' }}>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{detailData?.application?.application_no || '—'}</h2>
                  <p className="text-amber-700 text-sm mt-1">{detailData?.application?.application_type?.replace('_', ' ') || ''}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(displayStatus)}`}>
                  {displayStatus}
                </span>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailField icon={<FileText size={16} className="text-amber-600" />} label="Type" value={detailData?.application?.application_type?.replace('_', ' ') || '—'} />
                  <DetailField icon={<Calendar size={16} className="text-amber-600" />} label="Date" value={detailData?.application?.application_date || '—'} />
                  <DetailField icon={<MapPin size={16} className="text-amber-600" />} label="Branch" value={detailData?.application?.branch || '—'} />
                  <DetailField icon={<Hash size={16} className="text-amber-600" />} label="Mobile" value={detailData?.application?.mobile || userIdentifier || '—'} />
                  <DetailField icon={<Clock size={16} className="text-amber-600" />} label="Status" value={displayStatus} />
                </div>
              </div>
            </div>

            {/* Pledge Details — only for PLEDGE_RELEASE */}
            {!isDirect && (
              detailData.pledge_details?.pledger_name ? (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-100">
                  <div className="px-8 py-5" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f0d5a8)' }}>
                    <h3 className="text-lg font-bold text-gray-900">Pledge Details</h3>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <DetailField icon={<User size={16} className="text-amber-600" />} label="Pledger Name" value={detailData.pledge_details.pledger_name} />
                      <DetailField icon={<Building2 size={16} className="text-amber-600" />} label="Financier" value={detailData.pledge_details.financier_name || '—'} />
                      <DetailField icon={<Building2 size={16} className="text-amber-600" />} label="Branch" value={detailData.pledge_details.branch_name || '—'} />
                      <DetailField icon={<Hash size={16} className="text-amber-600" />} label="Gold Loan A/C" value={detailData.pledge_details.gold_loan_account_no || '—'} />
                      <DetailField icon={<MapPin size={16} className="text-amber-600" />} label="Address" value={detailData.pledge_details.pledger_address || '—'} />
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <AmountCard label="Principal" amount={detailData.pledge_details.principal_amount} />
                      <AmountCard label="Interest" amount={detailData.pledge_details.interest_amount} />
                      <AmountCard label="Total Due" amount={detailData.pledge_details.total_due} highlight />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
                  <p className="text-amber-700 font-medium">Pledge details not added yet</p>
                </div>
              )
            )}

            {/* Ornaments */}
            {detailData.ornaments?.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-100">
                <div className="px-8 py-5" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f0d5a8)' }}>
                  <h3 className="text-lg font-bold text-gray-900">Ornaments ({detailData.ornaments.length})</h3>
                </div>
                <div className="p-8">
                  <div className="hidden md:grid grid-cols-5 gap-4 pb-3 border-b-2 border-gray-100 mb-4">
                    {['Item Name', 'Quantity', 'Purity %', 'Weight (gms)', 'Photo'].map(h => (
                      <span key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</span>
                    ))}
                  </div>
                  {detailData.ornaments.map((orn, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4 border-b border-gray-50 last:border-0 items-center">
                      <span className="font-medium text-gray-800">{orn.item_name || '—'}</span>
                      <span className="text-gray-700">{orn.quantity || 0}</span>
                      <span className="text-gray-700">{orn.purity_percentage || 0}%</span>
                      <span className="text-gray-700">{orn.approx_weight_gms || 0} gms</span>
                      <div>{orn.item_photo_url ? <img src={orn.item_photo_url} alt={orn.item_name} className="w-12 h-12 rounded-lg object-cover border-2 border-amber-200" /> : <span className="text-gray-400 text-sm">No photo</span>}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
                <p className="text-amber-700 font-medium">Ornaments not added yet</p>
              </div>
            )}

            {/* Action Buttons — progress-aware (matched by application_id) */}
            <div className="space-y-4 pt-4">
              {(() => {
                const appId = selectedApplication?.application_id
                const hasPledge = !!detailData?.pledge_details?.pledger_name
                const hasOrn = detailData?.ornaments?.length > 0

                // Estimation matched by application_id from search API
                const appEst = previewData?._appEstimation || detailData?.estimation
                const hasEst = !!appEst?.estimation_id || (appEst?.items?.length > 0)
                const estItems = appEst?.items || detailData?.estimation?.items || []

                // Invoice matched by application_id from search API
                const appInv = previewData?._appInvoice || detailData?.invoice
                const hasInvoice = !!appInv?.invoice_no || !!appInv?.invoice_id
                const hasInvoiceItems = !!appInv?.has_items || !!appInv?.items_count || (appInv?.invoice_items?.length > 0)
                const hasSettlement = !!appInv?.settlement_id || !!appInv?.payment_mode || !!appInv?.settlement_status

                const paymentComplete = hasInvoice && hasSettlement
                const isSubmitted = ['SUBMITTED','APPROVED','COMPLETED'].includes((selectedApplication?.status || '').toUpperCase())

                const completedPdfs = []
                if (hasPledge && hasOrn) completedPdfs.push({ label: 'Application Form', mode: 'pdf' })
                if (hasEst) completedPdfs.push({ label: 'Estimation', mode: 'estimation-pdf' })
                if (paymentComplete || isSubmitted) completedPdfs.push({ label: 'Payment Voucher', mode: 'payment-pdf' })

                let nextAction = null
                if (!isSubmitted) {
                  const isPledgeType = selectedApplication?.application_type === 'PLEDGE_RELEASE'
                  if (isPledgeType && !hasPledge) {
                    nextAction = { label: 'Continue — Pledge Details', action: () => handleEditApplication(selectedApplication) }
                  } else if (!hasOrn) {
                    nextAction = { label: 'Continue — Add Ornaments', action: () => handleEditApplication(selectedApplication) }
                  } else if (!hasEst) {
                    nextAction = { label: 'Continue — Estimation', action: () => navigate('/estimation', { state: { application: previewData } }) }
                  } else if (!paymentComplete) {
                    let paymentStep = 1
                    if (hasInvoice && !hasInvoiceItems) paymentStep = 2
                    else if (hasInvoice && hasInvoiceItems && !hasSettlement) paymentStep = 3

                    nextAction = {
                      label: paymentStep === 1 ? 'Continue — Create Invoice' : paymentStep === 2 ? 'Continue — Invoice Items' : 'Continue — Settlement',
                      action: () => {
                        navigate('/payment', {
                          state: {
                            application: previewData,
                            applicationId: appId,
                            estimation_no: appEst?.estimation_no || '',
                            items: estItems,
                            grandTotal: appEst?.summary?.total_net_amount || appEst?.total_net_amount || 0
                          }
                        })
                      }
                    }
                  }
                }

                return (
                  <>
                    {completedPdfs.length > 0 && (
                      <div className="flex justify-center gap-3 flex-wrap">
                        {completedPdfs.map(p => (
                          <button key={p.mode} onClick={() => setSelectedPdf(selectedPdf === p.mode ? null : p.mode)} className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl shadow text-sm transition-all ${selectedPdf === p.mode ? 'ring-2 ring-offset-2 ring-amber-400' : ''}`}
                            style={{ background: p.mode === 'pdf' ? 'linear-gradient(135deg, #c9943a, #a36e24)' : p.mode === 'estimation-pdf' ? 'linear-gradient(135deg, #3a7ab5, #2c5f8a)' : 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff' }}>
                            <FileDown size={16} /> {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {nextAction && (
                      <div className="flex justify-center">
                        <button onClick={nextAction.action} className="flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-xl shadow-lg text-sm" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}>
                          <Edit size={16} /> {nextAction.label}
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Inline PDF Preview */}
            {selectedPdf === 'pdf' && (
              <div className="mt-6">
                <ApplicationPreview application={selectedApplication} userIdentifier={userIdentifier} onBack={() => setSelectedPdf(null)} />
              </div>
            )}
            {selectedPdf === 'estimation-pdf' && (
              <div className="mt-6">
                <EstimationPdfView userIdentifier={userIdentifier} applicationId={selectedApplication?.application_id} />
              </div>
            )}
            {selectedPdf === 'payment-pdf' && (
              <div className="mt-6">
                <PaymentPdfView userIdentifier={userIdentifier} applicationId={selectedApplication?.application_id} />
              </div>
            )}
            </div>
        )}
      </div>
    )
  }

  /* ================================================================ */
  /*  PDF PREVIEW                                                     */
  /* ================================================================ */
  if (viewMode === 'pdf' && selectedApplication) {
    return <ApplicationPreview application={selectedApplication} userIdentifier={userIdentifier} onBack={() => { setViewMode('view'); setSelectedPdf(null) }} />
  }

  /* ================================================================ */
  /*  EDIT MODE                                                       */
  /* ================================================================ */
  if (viewMode === 'edit' && selectedApplication) {
    return <ApplicationForm userIdentifier={userIdentifier} existingApplication={selectedApplication} onSuccess={handleApplicationCreated} onCancel={handleBackToList} />
  }

  /* ================================================================ */
  /*  APPLICATIONS LIST                                               */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>
        <p className="text-gray-500 text-sm mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''} found</p>
      </div>

      <div className="space-y-4">
        {applications.map((app, index) => {
          const complete = isAppComplete(app)
          const displayStatus = getDisplayStatus(app)
          const isAccepted = ['SUBMITTED', 'APPROVED', 'COMPLETED'].includes(displayStatus)
          const isDraft = displayStatus === 'DRAFT'

          return (
            <div key={app.application_id || app.application_no || index} className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={22} className="text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900">{app.application_no || `App ${index + 1}`}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(displayStatus)}`}>{displayStatus}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
                      {app.application_type && <span className="flex items-center gap-1.5"><FileText size={14} /> {app.application_type.replace('_', ' ')}</span>}
                      {app.application_date && <span className="flex items-center gap-1.5"><Calendar size={14} /> {app.application_date}</span>}
                      {app.place && <span className="flex items-center gap-1.5"><MapPin size={14} /> {app.place}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => handleViewApplication(app)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 font-semibold rounded-xl hover:bg-amber-100 transition-all">
                    <Eye size={16} /> View
                  </button>
                  
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================ */
function DetailField({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function AmountCard({ label, amount, highlight = false, suffix = '' }) {
  const formatted = suffix === '%' ? `${amount || 0}%` : `₹${Number(amount || 0).toLocaleString('en-IN')}`
  return (
    <div className={`rounded-xl p-4 text-center ${highlight ? 'border-2 border-amber-300' : 'bg-gray-50 border border-gray-100'}`} style={highlight ? { background: 'linear-gradient(135deg, #fdf8f0, #f0d5a8)' } : {}}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold mt-1 ${highlight ? 'text-amber-800' : 'text-gray-800'}`}>{formatted}</p>
    </div>
  )
}
/* ================================================================ */
/*  ESTIMATION PDF VIEW — fetches data and shows estimation preview  */
/* ================================================================ */
function EstimationPdfView({ userIdentifier, applicationId }) {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [branchInfo, setBranchInfo] = React.useState(null)

  React.useEffect(() => {
    (async () => {
      try {
        const r = await accountsAPI.searchCustomer(userIdentifier)
        const d = r.data || {}
        const ests = d.estimations || []
        // Find estimation matching the applicationId, fallback to latest
        const latest = applicationId
          ? ests.find(e => e.application_id === applicationId) || (ests.length > 0 ? ests[ests.length - 1] : null)
          : (ests.length > 0 ? ests[ests.length - 1] : null)
        const allPledges = d.pledge_details || []
        const targetAppId = applicationId || latest?.application_id
        const appPledge = targetAppId ? allPledges.find(p => p.application_id === targetAppId) : allPledges[0]
        // Always find app by applicationId first, fallback to estimation's app
        const appObj = (d.applications || []).find(a => a.application_id === (applicationId || latest?.application_id)) || {}

        // Fetch branch info
        try {
          const br = await applicationsAPI.getBranches()
          const branches = br.data?.branches || []
          const place = (appObj.place || '').toLowerCase().trim()
          if (place) {
            let matched = branches.find(b => b.branch_name.toLowerCase() === place)
            if (!matched) matched = branches.find(b => b.branch_name.toLowerCase().includes(place) || place.includes(b.branch_name.toLowerCase()))
            if (matched) setBranchInfo(matched)
          }
        } catch {}

        setData({
          account: d.customer || {},
          addresses: d.addresses || [],
          pledge_details: appPledge || null,
          estimation: latest ? { ...latest, items: latest.items || [], summary: { total_net_amount: latest.total_net_amount, estimation_no: latest.estimation_no } } : {},
          application: appObj
        })
      } catch {} finally { setLoading(false) }
    })()
  }, [userIdentifier, applicationId])

  if (loading) return <div className="text-center py-20"><Loader size={36} className="animate-spin mx-auto text-amber-600" /><p className="text-gray-600 mt-4">Loading Estimation...</p></div>

  const acc = data?.account || {}
  const addrs = data?.addresses || []
  const pledge = data?.pledge_details || {}
  const est = data?.estimation || {}
  const items = est.items || []
  const name = [acc.first_name, acc.last_name].filter(Boolean).join(' ')
  const present = addrs.find(a => /present|current/i.test(a.address_type)) || addrs[0] || {}
  const perm = addrs.find(a => /permanent/i.test(a.address_type)) || addrs[1] || present
  const fA = (a) => [a?.address_line, a?.street, a?.city, a?.state, a?.pincode].filter(Boolean).join(', ')

  const totalNet = est.summary?.total_net_amount || items.reduce((s, it) => s + (parseFloat(it.net_amount) || 0), 0)
  const totalDue = parseFloat(pledge.total_due) || 0
  const isPR = data?.application?.application_type === 'PLEDGE_RELEASE'
  const finalAmount = isPR ? totalNet - totalDue : totalNet

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

  const blue = '#2c5f8a'; const cb = '1px solid #6a9ec7'
  const lb = { border: cb, padding: '5px 8px', fontWeight: 'bold', background: '#f0f6fb', fontSize: '10px' }
  const vl = { border: cb, padding: '5px 8px', fontSize: '10px' }

  const handlePrint = () => {
    const el = document.getElementById('est-pdf-view')
    if (!el) return
    const w = window.open('','_blank')
    w.document.write('<html><head><title>Estimation</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Times New Roman",serif}@media print{@page{margin:10mm}}</style></head><body>' + el.innerHTML + '</body></html>')
    w.document.close(); setTimeout(() => { w.print(); w.close() }, 400)
  }

  if (items.length === 0) return <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center"><p className="text-amber-700 font-medium">No estimation data found.</p></div>

  return (
    <div className="space-y-4">
      <div id="est-pdf-view" style={{ fontFamily: "'Times New Roman',Georgia,serif", maxWidth: '750px', margin: '0 auto', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(180deg, #3a7ab5, ${blue})`, padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff', lineHeight: '1.5' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>SVS GOLD PRIVATE LIMITED</div>
            <div style={{ fontSize: '10px', opacity: .85 }}>{branchInfo?.full_address_txt}</div>
            <div style={{ fontSize: '10px', opacity: .85 }}>{branchInfo?.phone_number}</div>
            <div style={{ fontSize: '10px', opacity: .85 }}>www.svsgold.com</div>
          </div>
          <div style={{ textAlign: 'center', color: '#fff' }}><div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px' }}>ESTIMATION COPY</div></div>
          <div style={{ width: '100px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="/svslogo-white.png" alt="SVS Gold" style={{ maxHeight: '65px', maxWidth: '95px', objectFit: 'contain' }} /></div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          {/* Customer Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}><tbody>
            <tr><td style={lb} width="130">Estimation No.</td><td style={vl}>{est.estimation_no || est.summary?.estimation_no || '—'}</td><td style={lb} width="60">Date</td><td style={vl} width="120">{new Date().toLocaleDateString('en-IN')}</td></tr>
            <tr><td style={lb}>Name</td><td style={vl} colSpan={3}>{name}</td></tr>
            <tr><td style={lb}>Email ID</td><td style={vl}>{acc.email || ''}</td><td style={lb}>Mobile No.</td><td style={vl}>{acc.mobile || userIdentifier}</td></tr>
            <tr><td style={lb}>Present Address</td><td style={vl} colSpan={3}>{fA(present)}</td></tr>
            <tr><td style={lb}>Permanent Address</td><td style={vl} colSpan={3}>{fA(perm)}</td></tr>
          </tbody></table>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', marginBottom: '12px' }}>
            <thead><tr style={{ background: '#f0f6fb' }}>
              {['S.\nNo.','Item','Qty.','Gross\nWeight\nIn Gms','Stone\nWeight\nIn Carats','Net\nWeight\nIn Gms','Gold Rate\nPer Gm.','Purity\nIn %','Gross\nAmount','Deductions','Net\nAmount','Item\nPictures'].map((h,i) => (
                <th key={i} style={{ border: cb, padding: '6px 4px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'pre-line', verticalAlign: 'bottom', lineHeight: '1.3' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td style={{ ...vl, textAlign: 'center' }}>{i+1}</td>
                  <td style={vl}>{it.item_name}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.quantity}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.gross_weight_gms}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.stone_weight_gms || 0}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.net_weight || (parseFloat(it.gross_weight_gms||0) - parseFloat(it.stone_weight_gms||0)).toFixed(2)}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.gold_rate_per_gm}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.purity_percentage}%</td>
                  <td style={{ ...vl, textAlign: 'center' }}>₹{Number(it.gross_amount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.deduction_percentage || 0}%</td>
                  <td style={{ ...vl, textAlign: 'center', fontWeight: 'bold' }}>₹{Number(it.net_amount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ ...vl, textAlign: 'center', padding: '2px' }}></td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                <tr key={`e${i}`}>{Array.from({length:12}).map((_,j) => <td key={j} style={{ ...vl, height: '24px' }}>&nbsp;</td>)}</tr>
              ))}
            </tbody>
          </table>

          {/* Total Net Amount */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '6px' }}><tbody>
            <tr><td style={lb} width="150">Total Net Amount</td><td style={{ ...vl, fontWeight: 'bold', fontSize: '13px' }}>₹{Number(totalNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            {isPR && totalDue > 0 && (<>
              <tr><td style={{ ...lb, color: '#dc2626' }}>Less: Pledge Due</td><td style={{ ...vl, color: '#dc2626', fontWeight: 'bold' }}>- ₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr><td style={{ ...lb, background: '#e8f5e9' }}>Payable to Customer</td><td style={{ ...vl, fontWeight: 'bold', fontSize: '13px', color: '#16a34a' }}>₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            </>)}
            <tr><td style={lb}>Amount In Words</td><td style={{ ...vl, fontStyle: 'italic' }}>{numToWords(Math.round(Math.abs(isPR ? finalAmount : totalNet)))} Rupees Only</td></tr>
          </tbody></table>

          {/* Consent for Melting */}
          <div style={{ marginTop: '16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: blue, marginBottom: '6px' }}>Consent for Melting:</div>
            <div style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'justify' }}>
              I <strong>{name || '______'}</strong>, hereby grant <strong>SVS Gold Private Limited (' SVS Gold')</strong> and its representative's permission and accord my consent to remove precious/semi - precious stones, gems, dust, or any material other than gold from ornaments before melting. Upon melting, I will accept to actual weight and purity arrived after melting of my ornaments. I agree to bear all the losses in terms of purity and weight which occurs from the melting process and/or stones and other materials removal. I agree to settle the differential amount based on the current gold rate to SVS Gold before and after melting.
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
              <tr><td style={lb}>Place</td><td style={vl}>{data?.application?.place || ''}</td></tr>
            </tbody></table>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '220px', borderBottom: '1px solid #666', paddingBottom: '40px', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '10px', color: '#555' }}>Customer Signature / Thumb Impression</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center"><button onClick={handlePrint} className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 text-sm hover:bg-gray-50"><FileDown size={16} /> Print / Download</button></div>
    </div>
  )
}


/* ================================================================ */
/*  PAYMENT VOUCHER PDF VIEW                                         */
/* ================================================================ */
function PaymentPdfView({ userIdentifier, applicationId }) {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [branchInfo, setBranchInfo] = React.useState(null)

  React.useEffect(() => {
    (async () => {
      try {
        const r = await accountsAPI.searchCustomer(userIdentifier)
        const d = r.data || {}
        setData(d)

        // Find the app to get place — prioritize applicationId
        const apps = d.applications || []
        const invoices = d.invoices || []
        const inv = applicationId ? invoices.find(i => i.application_id === applicationId) : invoices[invoices.length - 1]
        // Always find app by applicationId first
        const app = apps.find(a => a.application_id === applicationId) || apps.find(a => a.application_id === inv?.application_id) || apps[0] || {}

        try {
          const br = await applicationsAPI.getBranches()
          const branches = br.data?.branches || []
          const place = (app.place || '').toLowerCase().trim()
          if (place) {
            let matched = branches.find(b => b.branch_name.toLowerCase() === place)
            if (!matched) matched = branches.find(b => b.branch_name.toLowerCase().includes(place) || place.includes(b.branch_name.toLowerCase()))
            if (matched) setBranchInfo(matched)
          }
        } catch {}
      } catch {} finally { setLoading(false) }
    })()
  }, [userIdentifier, applicationId])

  if (loading) return <div className="text-center py-20"><Loader size={36} className="animate-spin mx-auto text-amber-600" /><p className="text-gray-600 mt-4">Loading Payment Voucher...</p></div>

  const acc = data?.customer || {}
  const addrs = data?.addresses || []
  const apps = data?.applications || []
  const invoices = data?.invoices || []
  const inv = applicationId ? invoices.find(i => i.application_id === applicationId) || invoices[invoices.length - 1] || {} : invoices[invoices.length - 1] || {}
  const app = apps.find(a => a.application_id === (inv.application_id || applicationId)) || apps[0] || {}
  const invItems = inv.items || []
  const settlements = inv.settlements || []
  const settlement = settlements.length > 0 ? settlements[settlements.length - 1] : {}

  const name = [acc.first_name, acc.last_name].filter(Boolean).join(' ')
  const present = addrs.find(a => /present|current/i.test(a.address_type)) || addrs[0] || {}
  const perm = addrs.find(a => /permanent/i.test(a.address_type)) || addrs[1] || present
  const fA = (a) => [a?.address_line, a?.street, a?.city, a?.state, a?.pincode].filter(Boolean).join(', ')
  const age = (d) => { if (!d) return ''; const b = new Date(d), t = new Date(); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a }
  const cur = (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '₹0.00'
  const totalNet = invItems.reduce((s, it) => s + (parseFloat(it.net_amount) || 0), 0)

  // Pledge deduction
  const allPledges = data?.pledge_details || []
  const appPledge = Array.isArray(allPledges) ? allPledges.find(p => p.application_id === (app.application_id || applicationId)) : allPledges
  const pledgeDue = parseFloat(appPledge?.total_due || 0)
  const isPR = app.application_type === 'PLEDGE_RELEASE'
  const payableAmount = Math.round((totalNet - pledgeDue) * 100) / 100

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

  const blue = '#2c5f8a'; const cb = '1px solid #6a9ec7'
  const lb = { border: cb, padding: '6px 10px', fontWeight: 'bold', background: '#f0f6fb', fontSize: '11px' }
  const vl = { border: cb, padding: '6px 10px', fontSize: '11px' }

  const handlePrint = () => {
    const el = document.getElementById('pay-pdf-view')
    if (!el) return
    const w = window.open('','_blank')
    w.document.write('<html><head><title>Payment Voucher</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Times New Roman",serif}@media print{@page{margin:10mm}}</style></head><body>' + el.innerHTML + '</body></html>')
    w.document.close(); setTimeout(() => { w.print(); w.close() }, 400)
  }

  return (
    <div className="space-y-4">
      <div id="pay-pdf-view" style={{ fontFamily: "'Times New Roman',Georgia,serif", maxWidth: '750px', margin: '0 auto', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(180deg, #3a7ab5, ${blue})`, padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff', lineHeight: '1.5' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>SVS GOLD PRIVATE LIMITED</div>
            <div style={{ fontSize: '10px', opacity: .85 }}>{branchInfo?.full_address_txt}</div>
            <div style={{ fontSize: '10px', opacity: .85 }}>{branchInfo?.phone_number}</div>
            <div style={{ fontSize: '10px', opacity: .85 }}>www.svsgold.com</div>
          </div>
          <div style={{ textAlign: 'center', color: '#fff' }}><div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px' }}>PAYMENT VOUCHER</div></div>
          <div style={{ width: '100px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="/svslogo-white.png" alt="SVS Gold" style={{ maxHeight: '65px', maxWidth: '95px', objectFit: 'contain' }} /></div>
        </div>

        <div style={{ padding: '20px 28px' }}>

          {/* Bill No / Application No */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}><tbody>
            <tr><td style={lb} width="130">Bill No.</td><td style={vl}>{inv.invoice_no || '—'}</td><td style={lb} width="130">Date</td><td style={vl}>{inv.invoice_date || ''}</td></tr>
            <tr><td style={lb}>Application No.</td><td style={vl}>{app.application_no || ''}</td><td style={lb}>Application Date</td><td style={vl}>{app.application_date || ''}</td></tr>
          </tbody></table>

          {/* Customer Details */}
          {(() => {
            const docs = data?.documents || []
            const photoDoc = docs.find(d => /photo/i.test(d.document_type))
            const photoUrl = acc.photo_url || photoDoc?.file_path || ''
            const ageVal = acc.date_of_birth ? age(acc.date_of_birth) : ''
            return (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}><tbody>
            <tr>
              <td style={lb} width="120">Name</td>
              <td style={vl} colSpan={5}>{name}</td>
              <td style={{ border: cb, padding: '4px', textAlign: 'center', verticalAlign: 'top', width: '90px' }} rowSpan={5}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Customer" style={{ width: '80px', height: '95px', objectFit: 'cover', borderRadius: '2px' }} />
                ) : (
                  <div style={{ width: '80px', height: '95px', background: '#f0f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#999', border: '1px dashed #bbb', margin: '0 auto' }}>Photo</div>
                )}
              </td>
            </tr>
            <tr>
              <td style={lb}>Email ID</td>
              <td style={vl}>{acc.email || ''}</td>
              <td style={{ ...lb, width: '60px' }}>D.O.B.</td>
              <td style={vl}>{acc.date_of_birth || ''}</td>
              <td style={{ ...lb, width: '40px' }}>Age</td>
              <td style={{ ...vl, width: '40px' }}>{ageVal}</td>
            </tr>
            <tr>
              <td style={lb}>Mobile No.</td>
              <td style={vl}>{acc.mobile || userIdentifier}</td>
              <td style={lb}>Aadhar No.</td>
              <td style={vl}>{acc.aadhar_no != null ? String(acc.aadhar_no) : ''}</td>
              <td style={lb}>PAN No.</td>
              <td style={vl}>{acc.pan_no != null ? String(acc.pan_no) : ''}</td>
            </tr>
            <tr>
              <td style={lb}>Present Address</td>
              <td style={vl} colSpan={5}>{fA(present)}</td>
            </tr>
            <tr>
              <td style={lb}>Permanent Address</td>
              <td style={vl} colSpan={5}>{fA(perm)}</td>
            </tr>
          </tbody></table>
            )
          })()}

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '12px' }}>
            <thead><tr style={{ background: '#f0f6fb' }}>
              {['S.\nNo.','Item','Wt. Before\nMelting','Wt. After\nMelting','Purity\nAfter\nMelting','Gold Rate\nPer Gm.','Gross\nAmount','Deductions','Net\nAmount'].map((h,i) => (
                <th key={i} style={{ border: cb, padding: '6px 4px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'pre-line', verticalAlign: 'bottom', lineHeight: '1.3' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {invItems.map((it, i) => (
                <tr key={i}>
                  <td style={{ ...vl, textAlign: 'center' }}>{i+1}</td>
                  <td style={vl}>{it.item_name}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.weight_before_melting}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.weight_after_melting}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.purity_after_melting}%</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{cur(it.gold_rate_per_gm)}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{cur(it.gross_amount)}</td>
                  <td style={{ ...vl, textAlign: 'center' }}>{it.deduction_percentage || 0}%</td>
                  <td style={{ ...vl, textAlign: 'center', fontWeight: 'bold' }}>{cur(it.net_amount)}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 6 - invItems.length) }).map((_, i) => (
                <tr key={`e${i}`}>{Array.from({length:9}).map((_,j) => <td key={j} style={{ ...vl, height: '24px' }}>&nbsp;</td>)}</tr>
              ))}
              <tr style={{ background: '#f0f6fb' }}>
                <td style={lb} colSpan={7}></td>
                <td style={{ ...lb, textAlign: 'center' }}>Total Net Amount</td>
                <td style={{ ...vl, textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>{cur(inv.total_net_amount || totalNet)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals + Pledge Deduction + Amount in Words */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11px' }}><tbody>
            <tr><td style={lb} width="180">Total Net Amount</td><td style={{ ...vl, fontWeight: 'bold', fontSize: '12px' }}>{cur(inv.total_net_amount || totalNet)}</td></tr>
            {isPR && pledgeDue > 0 && (<>
              <tr><td style={{ ...lb, color: '#dc2626' }}>Less: Pledge Total Due</td><td style={{ ...vl, color: '#dc2626', fontWeight: 'bold' }}>- {cur(pledgeDue)}</td></tr>
              <tr><td style={{ ...lb, background: '#e8f5e9' }}>Amount Payable to Customer</td><td style={{ ...vl, fontWeight: 'bold', fontSize: '13px', color: '#16a34a' }}>{cur(payableAmount)}</td></tr>
            </>)}
            <tr><td style={lb}>Amount In Words</td><td style={{ ...vl, fontStyle: 'italic' }}>{inv.amount_in_words || (numToWords(Math.round(Math.abs(isPR && pledgeDue > 0 ? payableAmount : totalNet))) + ' Rupees Only')}</td></tr>
            <tr><td style={lb}>Note: Payment Reference No.</td><td style={vl}>{settlement.reference_no || inv.remarks || '—'}</td></tr>
          </tbody></table>

          {/* Terms & Conditions */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: blue, marginBottom: '6px' }}>Terms & Conditions</div>
            <ol style={{ fontSize: '9.5px', lineHeight: '1.8', paddingLeft: '16px', margin: 0 }}>
              <li style={{ marginBottom: '3px' }}>SVS Gold Private Limited (' SVS Gold') purchases the gold items based on the Customer's declaration that he/she is the only legal owner of the gold and is entitled to sell them.</li>
              <li style={{ marginBottom: '3px' }}>SVS Gold shall intimate the appropriate authorities in case it finds the Customer is trying to sell the stolen or counterfeit gold items.</li>
              <li style={{ marginBottom: '3px' }}>Under any circumstance SVS Gold shall not return gold items brought from the customers.</li>
              <li style={{ marginBottom: '3px' }}>Deductions include processing fees, documentation charges and other charges.</li>
              <li style={{ marginBottom: '3px' }}>All the disputes arising from this transaction shall be settled by binding arbitration within jurisdiction of Hyderabad, Telangana.</li>
            </ol>
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
            <div>
              <div style={{ width: '200px', borderBottom: '1px solid #666', paddingBottom: '40px', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '10px', color: '#555' }}>Authorised Signatory</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', marginBottom: '40px' }}>Accepted & Received</div>
              <div style={{ width: '220px', borderBottom: '1px solid #666', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '10px', color: '#555' }}>Customer Signature / Thumb Impression</div>
            </div>
          </div>

          {/* Date / Place */}
          <div style={{ marginTop: '16px' }}>
            <table style={{ fontSize: '11px', borderCollapse: 'collapse' }}><tbody>
              <tr><td style={lb}>Date</td><td style={{ ...vl, minWidth: '150px' }}>{inv.invoice_date || new Date().toLocaleDateString('en-IN')}</td></tr>
              <tr><td style={lb}>Place</td><td style={vl}>{app.place || ''}</td></tr>
            </tbody></table>
          </div>
        </div>
      </div>
      <div className="flex justify-center"><button onClick={handlePrint} className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 text-sm hover:bg-gray-50"><FileDown size={16} /> Print / Download</button></div>
    </div>
  )
}