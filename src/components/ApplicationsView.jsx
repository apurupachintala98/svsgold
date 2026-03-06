// import React, { useState, useEffect } from 'react'
// import {
//   Eye, AlertCircle, Loader, Edit, ChevronLeft,
//   FileText, Calendar, MapPin, User, Building2,
//   Hash, Clock, FileDown
// } from 'lucide-react'
// import ApplicationForm from './ApplicationForm'
// import ApplicationPreview from './ApplicationPreview'
// import { applicationsAPI } from '../api/api'

// export default function ApplicationsView({
//   userIdentifier,
//   applications,
//   loading,
//   error,
//   onApplicationsUpdate
// }) {

//   const [selectedApplication, setSelectedApplication] = useState(null)
//   const [viewMode, setViewMode] = useState(null)
//   const [detailData, setDetailData] = useState(null)
//   const [detailLoading, setDetailLoading] = useState(false)
//   const [detailError, setDetailError] = useState('')

//   // Global data fetched once
//   const [hasPledge, setHasPledge] = useState(false)
//   const [hasOrnaments, setHasOrnaments] = useState(false)
//   const [checkingCompletion, setCheckingCompletion] = useState(true)

//   /* ================================================================ */
//   /*  CHECK PLEDGE & ORNAMENTS ON MOUNT (once for the user)           */
//   /* ================================================================ */
//   useEffect(() => {
//     if (!userIdentifier) return

//     const checkCompletion = async () => {
//       setCheckingCompletion(true)
//       let pledge = false
//       let ornaments = false

//       try {
//         const pledgeRes = await applicationsAPI.getPledgeDetails(userIdentifier)
//         const pd = pledgeRes.data?.pledge_details || pledgeRes.data
//         if (pd && pd.pledger_name) pledge = true
//       } catch (e) { /* no pledge */ }

//       try {
//         const ornRes = await applicationsAPI.getOrnaments(userIdentifier)
//         const orn = ornRes.data?.ornaments || ornRes.data
//         if (orn && Array.isArray(orn) && orn.length > 0) ornaments = true
//       } catch (e) { /* no ornaments */ }

//       setHasPledge(pledge)
//       setHasOrnaments(ornaments)
//       setCheckingCompletion(false)
//     }

//     checkCompletion()
//   }, [userIdentifier, applications])

//   /* ================================================================ */
//   /*  TYPE-AWARE COMPLETION CHECK                                     */
//   /* ================================================================ */
//   const isAppComplete = (app) => {
//     const type = app?.application_type || ''

//     if (type === 'DIRECT_BUYING') {
//       // Direct Buying: only needs ornaments (NO pledge required)
//       return hasOrnaments
//     }
//     // Pledge Release: needs both pledge + ornaments
//     return hasPledge && hasOrnaments
//   }

//   const getMissingSteps = (app) => {
//     const type = app?.application_type || ''
//     const missing = []

//     if (type === 'DIRECT_BUYING') {
//       if (!hasOrnaments) missing.push('Ornaments')
//     } else {
//       if (!hasPledge) missing.push('Pledge details')
//       if (!hasOrnaments) missing.push('Ornaments')
//     }
//     return missing
//   }

//   const getDisplayStatus = (app) => {
//     if (checkingCompletion) return app.status || 'DRAFT'
//     if (!isAppComplete(app)) return 'DRAFT'
//     return app.status || 'DRAFT'
//   }

//   /* ================================================================ */
//   /*  STATUS BADGE STYLES                                             */
//   /* ================================================================ */
//   const getStatusStyle = (status) => {
//     switch (status?.toUpperCase()) {
//       case 'DRAFT':       return 'bg-amber-50 text-amber-700 border-amber-200'
//       case 'SUBMITTED':   return 'bg-blue-50 text-blue-700 border-blue-200'
//       case 'APPROVED':    return 'bg-green-50 text-green-700 border-green-200'
//       case 'REJECTED':    return 'bg-red-50 text-red-700 border-red-200'
//       case 'COMPLETED':   return 'bg-purple-50 text-purple-700 border-purple-200'
//       default:            return 'bg-gray-50 text-gray-700 border-gray-200'
//     }
//   }

//   /* ================================================================ */
//   /*  VIEW APPLICATION DETAILS                                        */
//   /* ================================================================ */
//   const handleViewApplication = async (app) => {
//     try {
//       setSelectedApplication(app)
//       setViewMode('view')
//       setDetailLoading(true)
//       setDetailError('')

//       const [pledgeRes, ornamentsRes] = await Promise.allSettled([
//         applicationsAPI.getPledgeDetails(userIdentifier),
//         applicationsAPI.getOrnaments(userIdentifier)
//       ])

//       const pledge = pledgeRes.status === 'fulfilled' ? pledgeRes.value.data : null
//       const ornaments = ornamentsRes.status === 'fulfilled' ? ornamentsRes.value.data : null

//       const pledgeData = pledge?.pledge_details || pledge || null
//       const ornList = ornaments?.ornaments || ornaments || []

//       // Update global state too
//       if (pledgeData && pledgeData.pledger_name) setHasPledge(true)
//       if (Array.isArray(ornList) && ornList.length > 0) setHasOrnaments(true)

//       setDetailData({
//         application: app,
//         pledge_details: pledgeData,
//         ornaments: ornList
//       })

//     } catch (err) {
//       console.error('Error fetching application details:', err)
//       setDetailError('Failed to load application details')
//     } finally {
//       setDetailLoading(false)
//     }
//   }

//   /* ================================================================ */
//   /*  HANDLERS                                                        */
//   /* ================================================================ */
//   const handleEditApplication = (app) => {
//     setSelectedApplication(app)
//     setViewMode('edit')
//   }

//   const handleBackToList = () => {
//     setViewMode(null)
//     setSelectedApplication(null)
//     setDetailData(null)
//     setDetailError('')
//   }

//   const handleApplicationCreated = (updatedApplication) => {
//     const updatedList = applications.some(
//       app => app.application_no === updatedApplication.application_no
//     )
//       ? applications.map(app =>
//           app.application_no === updatedApplication.application_no
//             ? { ...app, ...updatedApplication }
//             : app
//         )
//       : [...applications, updatedApplication]

//     onApplicationsUpdate(updatedList)

//     if (updatedApplication._allStepsComplete) {
//       setHasOrnaments(true)
//       // If it was a pledge release type, pledge would have been saved in step 2
//       if (updatedApplication.application_type === 'PLEDGE_RELEASE') {
//         setHasPledge(true)
//       }
//     }

//     setViewMode(null)
//     setSelectedApplication(null)
//   }

//   /* ================================================================ */
//   /*  LOADING / ERROR STATES                                          */
//   /* ================================================================ */
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="text-center">
//           <Loader size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
//           <p className="text-gray-600 font-medium">Loading applications...</p>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 flex items-start gap-4">
//         <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
//         <div>
//           <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
//           <p className="text-red-700">{error}</p>
//         </div>
//       </div>
//     )
//   }

//   /* ================================================================ */
//   /*  DETAIL VIEW                                                     */
//   /* ================================================================ */
//   if (viewMode === 'view' && selectedApplication) {
//     const complete = isAppComplete(selectedApplication)
//     const displayStatus = getDisplayStatus(selectedApplication)
//     const missing = getMissingSteps(selectedApplication)
//     const isDirect = selectedApplication.application_type === 'DIRECT_BUYING'

//     return (
//       <div className="space-y-6">
//         <button onClick={handleBackToList} className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium">
//           <ChevronLeft size={20} /> Back to Applications
//         </button>

//         {/* Completion Warning */}
//         {!detailLoading && !complete && (
//           <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
//             <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
//             <div>
//               <p className="text-sm text-amber-800 font-medium">Application Incomplete — Status: DRAFT</p>
//               <p className="text-xs text-amber-600 mt-1">
//                 {missing.join(' and ')} {missing.length === 1 ? 'is' : 'are'} missing.
//                 Complete all steps and click "Accept & Continue" to submit.
//               </p>
//               <button onClick={() => handleEditApplication(selectedApplication)} className="mt-3 flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all text-sm">
//                 <Edit size={16} /> Edit & Complete
//               </button>
//             </div>
//           </div>
//         )}

//         {detailLoading && (
//           <div className="flex items-center justify-center h-64">
//             <Loader size={40} className="text-indigo-600 animate-spin mx-auto" />
//           </div>
//         )}

//         {detailError && (
//           <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
//             <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
//             <span className="text-sm text-red-700">{detailError}</span>
//           </div>
//         )}

//         {!detailLoading && detailData && (
//           <div className="space-y-6">

//             {/* Application Info */}
//             <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
//               <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5 flex items-center justify-between">
//                 <div>
//                   <h2 className="text-xl font-bold text-white">{detailData.application.application_no}</h2>
//                   <p className="text-indigo-200 text-sm mt-1">
//                     {detailData.application.application_type?.replace('_', ' ')}
//                   </p>
//                 </div>
//                 <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(displayStatus)}`}>
//                   {displayStatus}
//                 </span>
//               </div>
//               <div className="p-8">
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   <DetailField icon={<FileText size={16} className="text-indigo-500" />} label="Type" value={detailData.application.application_type?.replace('_', ' ') || '—'} />
//                   <DetailField icon={<Calendar size={16} className="text-indigo-500" />} label="Date" value={detailData.application.application_date || '—'} />
//                   <DetailField icon={<MapPin size={16} className="text-indigo-500" />} label="Place" value={detailData.application.place || '—'} />
//                   <DetailField icon={<Hash size={16} className="text-indigo-500" />} label="Mobile" value={detailData.application.mobile || '—'} />
//                   <DetailField icon={<Clock size={16} className="text-indigo-500" />} label="Status" value={displayStatus} />
//                 </div>
//               </div>
//             </div>

//             {/* Pledge Details — only show for PLEDGE_RELEASE */}
//             {!isDirect && (
//               detailData.pledge_details && detailData.pledge_details.pledger_name ? (
//                 <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
//                   <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-5">
//                     <h3 className="text-lg font-bold text-white">Pledge Details</h3>
//                   </div>
//                   <div className="p-8">
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                       <DetailField icon={<User size={16} className="text-emerald-500" />} label="Pledger Name" value={detailData.pledge_details.pledger_name || '—'} />
//                       <DetailField icon={<Building2 size={16} className="text-emerald-500" />} label="Financier" value={detailData.pledge_details.financier_name || '—'} />
//                       <DetailField icon={<Building2 size={16} className="text-emerald-500" />} label="Branch" value={detailData.pledge_details.branch_name || '—'} />
//                       <DetailField icon={<Hash size={16} className="text-emerald-500" />} label="Gold Loan Account No" value={detailData.pledge_details.gold_loan_account_no || '—'} />
//                       <DetailField icon={<User size={16} className="text-emerald-500" />} label="Authorized Person" value={detailData.pledge_details.authorized_person || '—'} />
//                       <DetailField icon={<MapPin size={16} className="text-emerald-500" />} label="Address" value={detailData.pledge_details.pledger_address || '—'} />
//                     </div>
//                     <div className="mt-6 pt-6 border-t border-gray-100">
//                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                         <AmountCard label="Principal" amount={detailData.pledge_details.principal_amount} />
//                         <AmountCard label="Interest" amount={detailData.pledge_details.interest_amount} />
//                         <AmountCard label="Total Due" amount={detailData.pledge_details.total_due} highlight />
//                         <AmountCard label="Margin %" amount={detailData.pledge_details.margin_percentage} suffix="%" />
//                       </div>
//                     </div>
//                     <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <DetailField icon={<Hash size={16} className="text-emerald-500" />} label="Cheque No" value={detailData.pledge_details.cheque_no || '—'} />
//                       <DetailField icon={<Calendar size={16} className="text-emerald-500" />} label="Cheque Date" value={detailData.pledge_details.cheque_date || '—'} />
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
//                   <p className="text-amber-700 font-medium">Pledge details not added yet</p>
//                 </div>
//               )
//             )}

//             {/* Ornaments */}
//             {detailData.ornaments && detailData.ornaments.length > 0 ? (
//               <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
//                 <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-5">
//                   <h3 className="text-lg font-bold text-white">Ornaments ({detailData.ornaments.length})</h3>
//                 </div>
//                 <div className="p-8">
//                   <div className="hidden md:grid grid-cols-5 gap-4 pb-3 border-b-2 border-gray-100 mb-4">
//                     {['Item Name', 'Quantity', 'Purity %', 'Weight (gms)', 'Photo'].map(h => (
//                       <span key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</span>
//                     ))}
//                   </div>
//                   {detailData.ornaments.map((orn, idx) => (
//                     <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/50 rounded-lg px-2">
//                       <span className="font-medium text-gray-800">{orn.item_name || '—'}</span>
//                       <span className="text-gray-700">{orn.quantity || 0}</span>
//                       <span className="text-gray-700">{orn.purity_percentage || 0}%</span>
//                       <span className="text-gray-700">{orn.approx_weight_gms || 0} gms</span>
//                       <div>{orn.item_photo_url ? <img src={orn.item_photo_url} alt={orn.item_name} className="w-12 h-12 rounded-lg object-cover border-2 border-amber-200" /> : <span className="text-gray-400 text-sm">No photo</span>}</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
//                 <p className="text-amber-700 font-medium">Ornaments not added yet</p>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="flex justify-center gap-4 pt-4">
//               {!complete ? (
//                 <button onClick={() => handleEditApplication(selectedApplication)} className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all">
//                   <Edit size={20} /> Edit & Complete All Steps
//                 </button>
//               ) : (
//                 <button onClick={() => setViewMode('pdf')} className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all">
//                   <FileDown size={20} /> View / Download Application PDF
//                 </button>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     )
//   }

//   /* ================================================================ */
//   /*  PDF PREVIEW                                                     */
//   /* ================================================================ */
//   if (viewMode === 'pdf' && selectedApplication) {
//     return (
//       <ApplicationPreview
//         application={selectedApplication}
//         userIdentifier={userIdentifier}
//         onBack={handleBackToList}
//       />
//     )
//   }

//   /* ================================================================ */
//   /*  EDIT MODE                                                       */
//   /* ================================================================ */
//   if (viewMode === 'edit' && selectedApplication) {
//     return (
//       <ApplicationForm
//         userIdentifier={userIdentifier}
//         existingApplication={selectedApplication}
//         onSuccess={handleApplicationCreated}
//         onCancel={handleBackToList}
//       />
//     )
//   }

//   /* ================================================================ */
//   /*  APPLICATIONS LIST                                               */
//   /* ================================================================ */
//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>
//         <p className="text-gray-500 text-sm mt-1">
//           {applications.length} application{applications.length !== 1 ? 's' : ''} found
//         </p>
//       </div>

//       {checkingCompletion && (
//         <div className="flex items-center gap-2 text-sm text-gray-500">
//           <Loader size={14} className="animate-spin" /> Checking status...
//         </div>
//       )}

//       <div className="space-y-4">
//         {applications.map((app, index) => {
//           const complete = isAppComplete(app)
//           const displayStatus = getDisplayStatus(app)
//           const isAccepted = ['SUBMITTED', 'APPROVED', 'COMPLETED'].includes(displayStatus)

//           return (
//             <div key={app.application_id || app.application_no || index} className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300">
//               <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">

//                 <div className="flex items-start gap-4 flex-1">
//                   <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
//                     <FileText size={22} className="text-indigo-600" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-3 flex-wrap">
//                       <h3 className="text-lg font-bold text-gray-900">{app.application_no || `Application ${index + 1}`}</h3>
//                       <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(displayStatus)}`}>
//                         {displayStatus}
//                       </span>
//                     </div>
//                     <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
//                       {app.application_type && (
//                         <span className="flex items-center gap-1.5">
//                           <FileText size={14} /> {app.application_type.replace('_', ' ')}
//                         </span>
//                       )}
//                       {app.application_date && (
//                         <span className="flex items-center gap-1.5">
//                           <Calendar size={14} /> {app.application_date}
//                         </span>
//                       )}
//                       {app.place && (
//                         <span className="flex items-center gap-1.5">
//                           <MapPin size={14} /> {app.place}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 flex-shrink-0">
//                   <button onClick={() => handleViewApplication(app)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-all">
//                     <Eye size={16} /> View
//                   </button>

//                   {complete && isAccepted && (
//                     <button onClick={() => { setSelectedApplication(app); setViewMode('pdf') }} className="flex items-center gap-2 px-5 py-2.5 bg-purple-50 text-purple-600 font-semibold rounded-xl hover:bg-purple-100 transition-all">
//                       <FileDown size={16} /> PDF
//                     </button>
//                   )}

//                   {(!complete || displayStatus === 'DRAFT') && (
//                     <button onClick={() => handleEditApplication(app)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 font-semibold rounded-xl hover:bg-amber-100 transition-all">
//                       <Edit size={16} /> Edit
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )
//         })}
//       </div>
//     </div>
//   )
// }

// /* ================================================================ */
// function DetailField({ icon, label, value }) {
//   return (
//     <div className="flex items-start gap-3">
//       <div className="mt-0.5">{icon}</div>
//       <div>
//         <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
//         <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
//       </div>
//     </div>
//   )
// }

// function AmountCard({ label, amount, highlight = false, suffix = '' }) {
//   const formatted = suffix === '%' ? `${amount || 0}%` : `₹${Number(amount || 0).toLocaleString('en-IN')}`
//   return (
//     <div className={`rounded-xl p-4 text-center ${highlight ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200' : 'bg-gray-50 border border-gray-100'}`}>
//       <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
//       <p className={`text-lg font-bold mt-1 ${highlight ? 'text-indigo-700' : 'text-gray-800'}`}>{formatted}</p>
//     </div>
//   )
// }

import React, { useState, useEffect } from 'react'
import {
  Eye, AlertCircle, Loader, Edit, ChevronLeft,
  FileText, Calendar, MapPin, User, Building2,
  Hash, Clock, FileDown
} from 'lucide-react'
import ApplicationForm from './ApplicationForm'
import ApplicationPreview from './ApplicationPreview'
import { applicationsAPI } from '../api/api'

export default function ApplicationsView({
  userIdentifier,
  applications,
  loading,
  error,
  onApplicationsUpdate
}) {

  const [selectedApplication, setSelectedApplication] = useState(null)
  const [viewMode, setViewMode] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // Data from final-preview (single source of truth)
  const [previewData, setPreviewData] = useState(null)
  const [checkingCompletion, setCheckingCompletion] = useState(true)

  /* ================================================================ */
  /*  FETCH FINAL-PREVIEW ON MOUNT (single API, all data)             */
  /* ================================================================ */
  useEffect(() => {
    if (!userIdentifier) return

    const fetchPreview = async () => {
      setCheckingCompletion(true)
      try {
        const res = await applicationsAPI.getFinalPreview(userIdentifier)
        setPreviewData(res.data)
      } catch (e) {
        console.log('Final preview not available yet')
        setPreviewData(null)
      } finally {
        setCheckingCompletion(false)
      }
    }

    fetchPreview()
  }, [userIdentifier, applications])

  /* ================================================================ */
  /*  EXTRACT DATA FROM PREVIEW                                       */
  /* ================================================================ */
  const previewPledge = previewData?.pledge_details || null
  const previewOrnaments = previewData?.ornaments || []

  const hasPledge = !!(previewPledge?.pledger_name)
  const hasOrnaments = Array.isArray(previewOrnaments) && previewOrnaments.length > 0

  /* ================================================================ */
  /*  TYPE-AWARE COMPLETION CHECK                                     */
  /* ================================================================ */
  const isAppComplete = (app) => {
    if (!previewData) return false
    const type = app?.application_type || ''
    if (type === 'DIRECT_BUYING') return hasOrnaments
    return hasPledge && hasOrnaments
  }

  const getMissingSteps = (app) => {
    const type = app?.application_type || ''
    const missing = []
    if (type === 'DIRECT_BUYING') {
      if (!hasOrnaments) missing.push('Ornaments')
    } else {
      if (!hasPledge) missing.push('Pledge details')
      if (!hasOrnaments) missing.push('Ornaments')
    }
    return missing
  }

  const getDisplayStatus = (app) => {
    if (checkingCompletion) return app.status || 'DRAFT'
    if (!isAppComplete(app)) return 'DRAFT'
    return app.status || 'DRAFT'
  }

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':     return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'SUBMITTED': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'APPROVED':  return 'bg-green-50 text-green-700 border-green-200'
      case 'REJECTED':  return 'bg-red-50 text-red-700 border-red-200'
      case 'COMPLETED': return 'bg-purple-50 text-purple-700 border-purple-200'
      default:          return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  /* ================================================================ */
  /*  VIEW APPLICATION DETAILS — uses previewData, no extra API calls */
  /* ================================================================ */
  const handleViewApplication = async (app) => {
    setSelectedApplication(app)
    setViewMode('view')
    setDetailLoading(true)
    setDetailError('')

    try {
      // If we already have preview data, use it directly
      if (previewData) {
        setDetailData({
          application: app,
          pledge_details: previewPledge,
          ornaments: previewOrnaments
        })
      } else {
        // Try fetching fresh
        const res = await applicationsAPI.getFinalPreview(userIdentifier)
        const data = res.data
        setPreviewData(data)
        setDetailData({
          application: app,
          pledge_details: data?.pledge_details || null,
          ornaments: data?.ornaments || []
        })
      }
    } catch (err) {
      console.error('Error fetching details:', err)
      // Even if final-preview fails, still show the app info
      setDetailData({
        application: app,
        pledge_details: null,
        ornaments: []
      })
    } finally {
      setDetailLoading(false)
    }
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
          <Loader size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
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

    return (
      <div className="space-y-6">
        <button onClick={handleBackToList} className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium">
          <ChevronLeft size={20} /> Back to Applications
        </button>

        {/* Completion Warning — only show if NOT complete */}
        {!detailLoading && !complete && (
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
            <Loader size={40} className="text-indigo-600 animate-spin" />
          </div>
        )}

        {!detailLoading && detailData && (
          <div className="space-y-6">

            {/* Application Info */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{detailData.application.application_no}</h2>
                  <p className="text-indigo-200 text-sm mt-1">{detailData.application.application_type?.replace('_', ' ')}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(displayStatus)}`}>
                  {displayStatus}
                </span>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailField icon={<FileText size={16} className="text-indigo-500" />} label="Type" value={detailData.application.application_type?.replace('_', ' ') || '—'} />
                  <DetailField icon={<Calendar size={16} className="text-indigo-500" />} label="Date" value={detailData.application.application_date || '—'} />
                  <DetailField icon={<MapPin size={16} className="text-indigo-500" />} label="Place" value={detailData.application.place || '—'} />
                  <DetailField icon={<Hash size={16} className="text-indigo-500" />} label="Mobile" value={detailData.application.mobile || '—'} />
                  <DetailField icon={<Clock size={16} className="text-indigo-500" />} label="Status" value={displayStatus} />
                </div>
              </div>
            </div>

            {/* Pledge Details — only for PLEDGE_RELEASE */}
            {!isDirect && (
              detailData.pledge_details?.pledger_name ? (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-5">
                    <h3 className="text-lg font-bold text-white">Pledge Details</h3>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <DetailField icon={<User size={16} className="text-emerald-500" />} label="Pledger Name" value={detailData.pledge_details.pledger_name} />
                      <DetailField icon={<Building2 size={16} className="text-emerald-500" />} label="Financier" value={detailData.pledge_details.financier_name || '—'} />
                      <DetailField icon={<Building2 size={16} className="text-emerald-500" />} label="Branch" value={detailData.pledge_details.branch_name || '—'} />
                      <DetailField icon={<Hash size={16} className="text-emerald-500" />} label="Gold Loan A/C" value={detailData.pledge_details.gold_loan_account_no || '—'} />
                      <DetailField icon={<User size={16} className="text-emerald-500" />} label="Authorized Person" value={detailData.pledge_details.authorized_person || '—'} />
                      <DetailField icon={<MapPin size={16} className="text-emerald-500" />} label="Address" value={detailData.pledge_details.pledger_address || '—'} />
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <AmountCard label="Principal" amount={detailData.pledge_details.principal_amount} />
                      <AmountCard label="Interest" amount={detailData.pledge_details.interest_amount} />
                      <AmountCard label="Total Due" amount={detailData.pledge_details.total_due} highlight />
                      <AmountCard label="Margin %" amount={detailData.pledge_details.margin_percentage} suffix="%" />
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
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-5">
                  <h3 className="text-lg font-bold text-white">Ornaments ({detailData.ornaments.length})</h3>
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

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              {!complete ? (
                <button onClick={() => handleEditApplication(selectedApplication)} className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all">
                  <Edit size={20} /> Edit & Complete All Steps
                </button>
              ) : (
                <button onClick={() => setViewMode('pdf')} className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all">
                  <FileDown size={20} /> View / Download Application PDF
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ================================================================ */
  /*  PDF PREVIEW                                                     */
  /* ================================================================ */
  if (viewMode === 'pdf' && selectedApplication) {
    return <ApplicationPreview application={selectedApplication} userIdentifier={userIdentifier} onBack={handleBackToList} />
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

      {checkingCompletion && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader size={14} className="animate-spin" /> Checking status...
        </div>
      )}

      <div className="space-y-4">
        {applications.map((app, index) => {
          const complete = isAppComplete(app)
          const displayStatus = getDisplayStatus(app)
          const isAccepted = ['SUBMITTED', 'APPROVED', 'COMPLETED'].includes(displayStatus)

          return (
            <div key={app.application_id || app.application_no || index} className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={22} className="text-indigo-600" />
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
                  <button onClick={() => handleViewApplication(app)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-all">
                    <Eye size={16} /> View
                  </button>
                  {complete && isAccepted && (
                    <button onClick={() => { setSelectedApplication(app); setViewMode('pdf') }} className="flex items-center gap-2 px-5 py-2.5 bg-purple-50 text-purple-600 font-semibold rounded-xl hover:bg-purple-100 transition-all">
                      <FileDown size={16} /> PDF
                    </button>
                  )}
                  {(!complete || displayStatus === 'DRAFT') && (
                    <button onClick={() => handleEditApplication(app)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 font-semibold rounded-xl hover:bg-amber-100 transition-all">
                      <Edit size={16} /> Edit
                    </button>
                  )}
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
    <div className={`rounded-xl p-4 text-center ${highlight ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200' : 'bg-gray-50 border border-gray-100'}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold mt-1 ${highlight ? 'text-indigo-700' : 'text-gray-800'}`}>{formatted}</p>
    </div>
  )
}