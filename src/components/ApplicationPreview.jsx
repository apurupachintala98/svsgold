// import React, { useState, useEffect } from 'react'
// import { ChevronLeft, Loader, AlertCircle, Download } from 'lucide-react'
// import { applicationsAPI } from '../api/api'
// import PdfGenerator from '../utils/PdfGenerator'
// import { useNavigate } from 'react-router-dom'

// export default function ApplicationPreview({ application, userIdentifier, onBack }) {

//   const navigate = useNavigate()

//   const [previewData, setPreviewData] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [pdfUrl, setPdfUrl] = useState(null)
//   const [pdfLoaded, setPdfLoaded] = useState(false)
//   const [submitting, setSubmitting] = useState(false)

//   const [isComplete, setIsComplete] = useState(false)

//   useEffect(() => {
//     const fetchPreviewAndGeneratePdf = async () => {
//       try {
//         setLoading(true)
//         setError('')

//         const response = await applicationsAPI.getFinalPreview(userIdentifier)
//         const dataToUse = response.data

//         if (application) {
//           dataToUse.application = {
//             ...dataToUse.application,
//             ...application
//           }
//         }
//         setPreviewData(dataToUse)
//         const hasPledge = !!(
//           dataToUse.pledge_details?.pledger_name
//         )
//         const hasOrnaments = !!(
//           dataToUse.ornaments &&
//           Array.isArray(dataToUse.ornaments) &&
//           dataToUse.ornaments.length > 0
//         )
//         setIsComplete(hasPledge && hasOrnaments)

//         const appType = application?.application_type ||
//           dataToUse.application?.application_type || ''

//         const pdfGenerator = new PdfGenerator()
//         let pdfBytes

//         if (appType === 'PLEDGE_RELEASE') {
//           pdfBytes = await pdfGenerator.generatePledgeReleasePdf(dataToUse)
//         } else {
//           pdfBytes = await pdfGenerator.generateDirectBuyingPdf(dataToUse)
//         }

//         const blob = new Blob([pdfBytes], { type: 'application/pdf' })
//         setPdfUrl(URL.createObjectURL(blob))

//       } catch (err) {
//         console.error('Error loading preview:', err)
//         setError('Failed to generate preview PDF. Please try again.')
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchPreviewAndGeneratePdf()

//     return () => {
//       if (pdfUrl) URL.revokeObjectURL(pdfUrl)
//     }
//   }, [application, userIdentifier])

//   const handleAcceptAndContinue = async () => {
//     if (!isComplete) return

//     try {
//       setSubmitting(true)
//       setError('')

//       await applicationsAPI.updateApplicationStatus(
//         previewData.application.application_id,
//         'SUBMITTED'
//       )

//       navigate('/estimation', {
//         state: { application: previewData }
//       })
//     } catch (err) {
//       console.error('Error submitting:', err)
//       setError('Failed to submit application. Please try again.')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   // Labels
//   const appType = application?.application_type ||
//     previewData?.application?.application_type || ''
//   const typeLabel = appType === 'PLEDGE_RELEASE' ? 'Pledge Release' : 'Direct Buying'
//   const isDraft = application?.status === 'DRAFT' || !application?.status

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="text-center">
//           <Loader size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
//           <p className="text-gray-600 font-medium">Generating {typeLabel} PDF Preview...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <button
//           onClick={onBack}
//           className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium"
//         >
//           <ChevronLeft size={20} />
//           Back to Applications
//         </button>

//         <div className="text-right">
//           <h3 className="text-lg font-bold text-gray-800">
//             {application?.application_no || 'Application'} — {typeLabel}
//           </h3>
//           <p className="text-sm text-gray-500">
//             {appType === 'PLEDGE_RELEASE' ? 'pledge-release.pdf' : 'direct-buying.pdf'}
//           </p>
//         </div>
//       </div>

//       {/* Incomplete Warning */}
//       {!isComplete && (
//         <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
//           <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
//           <div>
//             <p className="text-sm text-amber-800 font-medium">Application Incomplete</p>
//             <p className="text-xs text-amber-600 mt-1">
//               All steps (Application, Pledge Details, Ornaments) must be completed before you can accept and continue.
//               The PDF preview is generated with the available data.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Error */}
//       {error && (
//         <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
//           <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
//           <span className="text-sm text-red-700">{error}</span>
//         </div>
//       )}

//       {/* PDF Preview */}
//       {pdfUrl && (
//         <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">

//           <iframe
//             src={pdfUrl}
//             width="100%"
//             height="750px"
//             onLoad={() => setPdfLoaded(true)}
//             className="rounded-xl border"
//             title={`${typeLabel} PDF Preview`}
//           />

//           {pdfLoaded && (
//             <div className="flex gap-4">
//               {/* Accept & Continue — only for DRAFT apps with all steps complete */}
//               {isDraft && isComplete && (
//                 <button
//                   onClick={handleAcceptAndContinue}
//                   disabled={submitting}
//                   className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {submitting ? (
//                     <span className="flex items-center justify-center gap-2">
//                       <Loader size={18} className="animate-spin" />
//                       Submitting...
//                     </span>
//                   ) : (
//                     'Accept & Continue'
//                   )}
//                 </button>
//               )}

//               {/* Disabled state hint */}
//               {isDraft && !isComplete && (
//                 <button
//                   disabled
//                   className="flex-1 py-3 px-6 bg-gray-300 text-gray-500 font-bold rounded-xl cursor-not-allowed"
//                   title="Complete all steps first"
//                 >
//                   Accept & Continue
//                 </button>
//               )}
//             </div>
//           )}

//         </div>
//       )}
//     </div>
//   )
// }

import React, { useState, useEffect } from 'react'
import { ChevronLeft, Loader, AlertCircle, Download } from 'lucide-react'
import { applicationsAPI } from '../api/api'
import PdfGenerator from '../utils/PdfGenerator'
import { useNavigate } from 'react-router-dom'

export default function ApplicationPreview({ application, userIdentifier, onBack }) {

  const navigate = useNavigate()

  const [previewData, setPreviewData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Track whether all steps are complete
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const fetchPreviewAndGeneratePdf = async () => {
      try {
        setLoading(true)
        setError('')

        // 1️⃣ Fetch preview data
        const response = await applicationsAPI.getFinalPreview(userIdentifier)
        const dataToUse = response.data

        // 2️⃣ Override with selected application's details
        if (application) {
          dataToUse.application = {
            ...dataToUse.application,
            ...application
          }
        }

        setPreviewData(dataToUse)

        // 3️⃣ Determine type from the SELECTED application
        const appType = application?.application_type ||
                        dataToUse.application?.application_type || ''

        // 4️⃣ Check completeness — type-aware
        const hasPledge = !!(dataToUse.pledge_details?.pledger_name)
        const hasOrnaments = !!(
          dataToUse.ornaments &&
          Array.isArray(dataToUse.ornaments) &&
          dataToUse.ornaments.length > 0
        )

        // DIRECT_BUYING only needs ornaments, PLEDGE_RELEASE needs both
        if (appType === 'DIRECT_BUYING') {
          setIsComplete(hasOrnaments)
        } else {
          setIsComplete(hasPledge && hasOrnaments)
        }

        // 5️⃣ Generate correct PDF
        const pdfGenerator = new PdfGenerator()
        let pdfBytes

        if (appType === 'PLEDGE_RELEASE') {
          pdfBytes = await pdfGenerator.generatePledgeReleasePdf(dataToUse)
        } else {
          pdfBytes = await pdfGenerator.generateDirectBuyingPdf(dataToUse)
        }

        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        setPdfUrl(URL.createObjectURL(blob))

      } catch (err) {
        console.error('Error loading preview:', err)
        setError('Failed to generate preview PDF. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPreviewAndGeneratePdf()

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [application, userIdentifier])

  const handleAcceptAndContinue = async () => {
    if (!isComplete) return

    try {
      setSubmitting(true)
      setError('')

      navigate('/estimation', {
        state: { application: previewData }
      })
    } catch (err) {
      console.error('Error submitting:', err)
      setError('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Labels
  const appType = application?.application_type ||
                  previewData?.application?.application_type || ''
  const typeLabel = appType === 'PLEDGE_RELEASE' ? 'Pledge Release' : 'Direct Buying'
  const isDraft = application?.status === 'DRAFT' || !application?.status

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Generating {typeLabel} PDF Preview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          Back to Applications
        </button>

        <div className="text-right">
          <h3 className="text-lg font-bold text-gray-800">
            {application?.application_no || 'Application'} — {typeLabel}
          </h3>
          <p className="text-sm text-gray-500">
            {appType === 'PLEDGE_RELEASE' ? 'pledge-release.pdf' : 'direct-buying.pdf'}
          </p>
        </div>
      </div>

      {/* Incomplete Warning */}
      {!isComplete && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-amber-800 font-medium">Application Incomplete</p>
            <p className="text-xs text-amber-600 mt-1">
              All steps (Application, Pledge Details, Ornaments) must be completed before you can accept and continue.
              The PDF preview is generated with the available data.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* PDF Preview */}
      {pdfUrl && (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">

          <iframe
            src={pdfUrl}
            width="100%"
            height="750px"
            onLoad={() => setPdfLoaded(true)}
            className="rounded-xl border"
            title={`${typeLabel} PDF Preview`}
          />

          {pdfLoaded && (
            <div className="flex gap-4">
             

              {/* Accept & Continue — only for DRAFT apps with all steps complete */}
              {isDraft || isComplete && (
                <button
                  onClick={handleAcceptAndContinue}
                  disabled={submitting}
                  className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader size={18} className="animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Accept & Continue'
                  )}
                </button>
              )}

              {/* Disabled state hint */}
              {isDraft && !isComplete && (
                <button
                  disabled
                  className="flex-1 py-3 px-6 bg-gray-300 text-gray-500 font-bold rounded-xl cursor-not-allowed"
                  title="Complete all steps first"
                >
                  Accept & Continue
                </button>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}