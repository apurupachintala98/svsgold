import React, { useState, useEffect } from 'react'
import {
  ChevronLeft, AlertCircle, Loader, Plus, Trash2, Upload,
  ChevronRight, Check, Save
} from 'lucide-react'
import { applicationsAPI } from '../api/api'

export default function ApplicationForm({
  userIdentifier,
  onSuccess,
  onCancel,
  existingApplication
}) {

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [error, setError] = useState('')

  const generateApplicationNumber = (mobile) => {
    const today = new Date().getDate()
    const lastThreeDigits = mobile ? mobile.toString().slice(-3) : '000'
    const uuid = crypto.randomUUID()
    const numericPart = uuid.replace(/\D/g, '')
    const randomThreeDigits = numericPart.slice(0, 3)
    return `AP-${today}-${lastThreeDigits}-${randomThreeDigits}`
  }

  const defaultApplication = {
    mobile: userIdentifier,
    application_type: 'PLEDGE_RELEASE',
    application_date: new Date().toISOString().split('T')[0],
    application_no: generateApplicationNumber(userIdentifier),
    place: '',
    status: 'DRAFT'
  }

  const defaultPledge = {
    mobile: userIdentifier,
    pledger_name: '',
    pledger_address: '',
    financier_name: '',
    branch_name: '',
    gold_loan_account_no: '',
    authorized_person: '',
    principal_amount: 0,
    interest_amount: 0,
    total_due: 0,
    cheque_no: '',
    cheque_date: new Date().toISOString().split('T')[0],
    margin_percentage: 0
  }

  const [applicationData, setApplicationData] = useState(
    existingApplication || defaultApplication
  )
  const [pledgeDetails, setPledgeDetails] = useState(defaultPledge)
  const [ornaments, setOrnaments] = useState([])

  // Track which APIs have been called (for edit resume)
  const [applicationId, setApplicationId] = useState(
    existingApplication?.application_id || null
  )
  const [pledgeSaved, setPledgeSaved] = useState(false)
  const [ornamentsSaved, setOrnamentsSaved] = useState(false)

  /* ================================================================ */
  /*  EDIT MODE: Fetch existing pledge & ornaments, determine step    */
  /* ================================================================ */
  useEffect(() => {
    if (!existingApplication) return

    const fetchExistingData = async () => {
      try {
        setFetchingData(true)

        // Fetch pledge details
        let hasPledge = false
        try {
          const pledgeRes = await applicationsAPI.getPledgeDetails(userIdentifier)
          const pd = pledgeRes.data?.pledge_details || pledgeRes.data
          if (pd && pd.pledger_name) {
            setPledgeDetails({ ...defaultPledge, ...pd })
            hasPledge = true
            setPledgeSaved(true)
          }
        } catch (e) {
          console.log('No existing pledge details found')
        }

        // Fetch ornaments
        let hasOrnaments = false
        try {
          const ornRes = await applicationsAPI.getOrnaments(userIdentifier)
          const orn = ornRes.data?.ornaments || ornRes.data
          if (orn && Array.isArray(orn) && orn.length > 0) {
            setOrnaments(orn.map((o, i) => ({ ...o, id: o.id || Date.now() + i })))
            hasOrnaments = true
            setOrnamentsSaved(true)
          }
        } catch (e) {
          console.log('No existing ornaments found')
        }

        // Determine which step to resume from
        if (hasOrnaments) {
          // All done — go to step 3 so user can review/re-submit
          setStep(3)
        } else if (hasPledge) {
          // Pledge saved but no ornaments — go to step 3
          setStep(3)
        } else {
          // Only application exists — go to step 2
          setStep(2)
        }

      } catch (err) {
        console.error('Error loading existing data:', err)
      } finally {
        setFetchingData(false)
      }
    }

    fetchExistingData()
  }, [existingApplication])

  /* ================================================================ */
  /*  HANDLERS                                                        */
  /* ================================================================ */

  const handleBasicChange = (field, value) => {
    setApplicationData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handlePledgeChange = (field, value) => {
    setPledgeDetails(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const addOrnament = () => {
    setOrnaments([
      ...ornaments,
      {
        id: Date.now(),
        item_name: '',
        quantity: 0,
        purity_percentage: 0,
        approx_weight_gms: 0,
        item_photo_url: ''
      }
    ])
  }

  const updateOrnament = (index, field, value) => {
    const updated = [...ornaments]
    updated[index] = { ...updated[index], [field]: value }
    setOrnaments(updated)
  }

  const handleImageUpload = (index, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const updated = [...ornaments]
      updated[index].item_photo_url = reader.result
      setOrnaments(updated)
    }
    reader.readAsDataURL(file)
  }

  const removeOrnament = (index) => {
    setOrnaments(ornaments.filter((_, i) => i !== index))
  }

  /* ================================================================ */
  /*  VALIDATION                                                      */
  /* ================================================================ */

  const validateStep1 = () => {
    if (!applicationData.application_type) {
      setError('Please select an application type')
      return false
    }
    if (!applicationData.place?.trim()) {
      setError('Please enter a place')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!pledgeDetails.pledger_name?.trim()) {
      setError('Please enter pledger name')
      return false
    }
    if (!pledgeDetails.financier_name?.trim()) {
      setError('Please enter financier name')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (ornaments.length === 0) {
      setError('Please add at least one ornament')
      return false
    }
    for (let i = 0; i < ornaments.length; i++) {
      if (!ornaments[i].item_name?.trim()) {
        setError(`Please enter item name for Ornament ${i + 1}`)
        return false
      }
    }
    return true
  }

  /* ================================================================ */
  /*  STEP-BY-STEP SUBMIT — each step calls its own API              */
  /* ================================================================ */

  const handleNextStep = async () => {
    try {
      setLoading(true)
      setError('')

      /* ---------- STEP 1 → Create/Update Application → go to Step 2 ---------- */
      if (step === 1) {
        if (!validateStep1()) return

        let appId = applicationId

        if (existingApplication?.application_id) {
          // Edit mode: update existing
          appId = existingApplication.application_id
          try {
            await applicationsAPI.updateApplication(applicationData)
          } catch (e) {
            console.log('Update application (may not exist), continuing...')
          }
        } else {
          // New mode: create
          const createRes = await applicationsAPI.createApplication({
            ...applicationData,
            status: 'DRAFT'
          })
          appId = createRes.data.application_id
        }

        setApplicationId(appId)
        setApplicationData(prev => ({ ...prev, application_id: appId }))
        setStep(2)
        return
      }

      /* ---------- STEP 2 → Save Pledge Details → go to Step 3 ---------- */
      if (step === 2) {
        if (!validateStep2()) return

        const appId = applicationId || existingApplication?.application_id
        if (!appId) {
          setError('Application not found. Please go back to Step 1.')
          return
        }

        await applicationsAPI.addPledgeDetails({
          ...pledgeDetails,
          mobile: userIdentifier,
          application_id: appId
        })

        setPledgeSaved(true)
        setStep(3)
        return
      }

      /* ---------- STEP 3 → Save Ornaments → Complete ---------- */
      if (step === 3) {
        if (!validateStep3()) return

        const appId = applicationId || existingApplication?.application_id
        if (!appId) {
          setError('Application not found. Please go back to Step 1.')
          return
        }

        await applicationsAPI.addOrnaments({
          application_id: appId,
          mobile: userIdentifier,
          ornaments
        })

        setOrnamentsSaved(true)

        // All 3 steps done — notify parent
        onSuccess({
          ...applicationData,
          application_id: appId,
          status: 'DRAFT',
          _allStepsComplete: true
        })
      }

    } catch (err) {
      console.error('Error in step', step, err)
      setError(err.response?.data?.message || 'Error saving. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError('')
    } else {
      onCancel()
    }
  }

  /* ================================================================ */
  /*  STYLES                                                          */
  /* ================================================================ */

  const inputClass =
    'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300'

  const labelClass = 'block text-sm font-semibold text-gray-700 mb-2'

  /* ================================================================ */
  /*  STEP INDICATOR                                                  */
  /* ================================================================ */

  const steps = [
    { num: 1, label: 'Application Details' },
    { num: 2, label: 'Pledge Details' },
    { num: 3, label: 'Ornaments' }
  ]

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step > s.num
                  ? 'bg-green-500 text-white'
                  : step === s.num
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s.num ? <Check size={18} /> : s.num}
            </div>
            <span
              className={`text-xs mt-2 font-medium ${
                step >= s.num ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-16 h-0.5 mx-2 mb-6 transition-all duration-300 ${
                step > s.num ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )

  /* ================================================================ */
  /*  STEP 1: APPLICATION DETAILS                                     */
  /* ================================================================ */

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">Application Details</h3>
        <p className="text-sm text-gray-500">Fill in basic application information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Application Number</label>
          <input
            type="text"
            value={applicationData.application_no}
            disabled
            className={`${inputClass} opacity-60 cursor-not-allowed`}
          />
        </div>

        <div>
          <label className={labelClass}>Application Date</label>
          <input
            type="date"
            value={applicationData.application_date}
            onChange={(e) => handleBasicChange('application_date', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Application Type <span className="text-red-500">*</span>
          </label>
          <select
            value={applicationData.application_type}
            onChange={(e) => handleBasicChange('application_type', e.target.value)}
            className={inputClass}
          >
            <option value="">Select Type</option>
            <option value="PLEDGE_RELEASE">Pledge Release</option>
            <option value="DIRECT_BUYING">Direct Buying</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>
            Place <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={applicationData.place}
            onChange={(e) => handleBasicChange('place', e.target.value)}
            placeholder="Enter place"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Mobile</label>
        <input
          type="text"
          value={applicationData.mobile}
          disabled
          className={`${inputClass} opacity-60 cursor-not-allowed`}
        />
      </div>
    </div>
  )

  /* ================================================================ */
  /*  STEP 2: PLEDGE DETAILS                                          */
  /* ================================================================ */

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">Pledge Details</h3>
        <p className="text-sm text-gray-500">Enter pledge and loan information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>
            Pledger Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={pledgeDetails.pledger_name}
            onChange={(e) => handlePledgeChange('pledger_name', e.target.value)}
            placeholder="Full name of pledger"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Authorized Person</label>
          <input
            type="text"
            value={pledgeDetails.authorized_person}
            onChange={(e) => handlePledgeChange('authorized_person', e.target.value)}
            placeholder="Authorized person name"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Pledger Address</label>
        <textarea
          value={pledgeDetails.pledger_address}
          onChange={(e) => handlePledgeChange('pledger_address', e.target.value)}
          placeholder="Full address of pledger"
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>
            Financier Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={pledgeDetails.financier_name}
            onChange={(e) => handlePledgeChange('financier_name', e.target.value)}
            placeholder="Financier / Bank name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Branch Name</label>
          <input
            type="text"
            value={pledgeDetails.branch_name}
            onChange={(e) => handlePledgeChange('branch_name', e.target.value)}
            placeholder="Branch name"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Gold Loan Account No</label>
        <input
          type="text"
          value={pledgeDetails.gold_loan_account_no}
          onChange={(e) => handlePledgeChange('gold_loan_account_no', e.target.value)}
          placeholder="Loan account number"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className={labelClass}>Principal Amount (₹)</label>
          <input
            type="number"
            value={pledgeDetails.principal_amount}
            onChange={(e) => handlePledgeChange('principal_amount', parseFloat(e.target.value) || 0)}
            placeholder="0"
            min="0"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Interest Amount (₹)</label>
          <input
            type="number"
            value={pledgeDetails.interest_amount}
            onChange={(e) => handlePledgeChange('interest_amount', parseFloat(e.target.value) || 0)}
            placeholder="0"
            min="0"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Total Due (₹)</label>
          <input
            type="number"
            value={pledgeDetails.total_due}
            onChange={(e) => handlePledgeChange('total_due', parseFloat(e.target.value) || 0)}
            placeholder="0"
            min="0"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className={labelClass}>Cheque No</label>
          <input
            type="text"
            value={pledgeDetails.cheque_no}
            onChange={(e) => handlePledgeChange('cheque_no', e.target.value)}
            placeholder="Cheque number"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Cheque Date</label>
          <input
            type="date"
            value={pledgeDetails.cheque_date}
            onChange={(e) => handlePledgeChange('cheque_date', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Margin Percentage (%)</label>
          <input
            type="number"
            value={pledgeDetails.margin_percentage}
            onChange={(e) => handlePledgeChange('margin_percentage', parseFloat(e.target.value) || 0)}
            placeholder="0"
            min="0"
            max="100"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )

  /* ================================================================ */
  /*  STEP 3: ORNAMENTS                                               */
  /* ================================================================ */

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">Ornaments</h3>
          <p className="text-sm text-gray-500">Add gold ornament details</p>
        </div>
        <button
          type="button"
          onClick={addOrnament}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-all duration-300"
        >
          <Plus size={18} />
          Add Ornament
        </button>
      </div>

      {ornaments.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <Upload size={40} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 font-medium">No ornaments added yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add Ornament" to get started</p>
          <button
            type="button"
            onClick={addOrnament}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all"
          >
            <Plus size={16} className="inline mr-1" />
            Add First Ornament
          </button>
        </div>
      )}

      {ornaments.map((ornament, index) => (
        <div
          key={ornament.id || index}
          className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border-2 border-indigo-100/50 space-y-4 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">Ornament {index + 1}</h4>
            <button
              type="button"
              onClick={() => removeOrnament(index)}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-800 transition-all duration-300"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ornament.item_name}
                onChange={(e) => updateOrnament(index, 'item_name', e.target.value)}
                placeholder="e.g., Gold Chain, Bangle"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Quantity</label>
              <input
                type="number"
                value={ornament.quantity}
                onChange={(e) => updateOrnament(index, 'quantity', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Purity Percentage (%)</label>
              <input
                type="number"
                value={ornament.purity_percentage}
                onChange={(e) => updateOrnament(index, 'purity_percentage', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max="100"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Approx Weight (gms)</label>
              <input
                type="number"
                value={ornament.approx_weight_gms}
                onChange={(e) => updateOrnament(index, 'approx_weight_gms', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="0.01"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Item Photo</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(index, e.target.files[0])}
                className="hidden"
                id={`ornament-photo-${index}`}
              />
              <label
                htmlFor={`ornament-photo-${index}`}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-indigo-400 rounded-xl cursor-pointer hover:bg-indigo-50 transition-all duration-300 flex-1"
              >
                <Upload size={18} className="text-indigo-600" />
                <span className="text-indigo-600 font-medium text-sm">
                  {ornament.item_photo_url ? 'Photo uploaded ✓' : 'Click to upload photo'}
                </span>
              </label>
              {ornament.item_photo_url && (
                <img
                  src={ornament.item_photo_url}
                  alt={`Ornament ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-xl border-2 border-indigo-200"
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  if (fetchingData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <Loader size={36} className="text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Loading application data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {existingApplication ? 'Continue Application' : 'Create Application'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
        >
          Cancel
        </button>
      </div>

      {/* Step Indicator */}
      <StepIndicator />

      {/* Info banner for edit mode */}
      {existingApplication && (
        <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl mb-6">
          <AlertCircle className="text-indigo-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm text-indigo-700 font-medium">
              Continuing application: {applicationData.application_no}
            </p>
            <p className="text-xs text-indigo-500 mt-0.5">
              Complete all steps to enable PDF preview. Each step saves automatically when you click Next.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl mb-6">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="mb-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
        >
          <ChevronLeft size={18} />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        <div className="flex items-center gap-2">
          {/* Step label */}
          <span className="text-sm text-gray-400 mr-2">
            Step {step} of 3
          </span>

          <button
            type="button"
            onClick={handleNextStep}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Saving...
              </>
            ) : step === 3 ? (
              <>
                <Save size={18} />
                Save & Complete
              </>
            ) : (
              <>
                Save & Next
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}