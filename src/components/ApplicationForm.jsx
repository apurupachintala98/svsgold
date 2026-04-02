import React, { useState, useEffect } from 'react'
import {
  ChevronLeft, AlertCircle, Loader, Plus, Trash2, Upload,
  ChevronRight, Check, Save
} from 'lucide-react'
import { applicationsAPI, accountsAPI } from '../api/api'

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
    principal_amount: '',
    interest_amount: '',
    total_due: '',
    cheque_no: '',
    cheque_date: '',
    margin_percentage: 0
  }

  const [applicationData, setApplicationData] = useState(
    existingApplication ? { ...defaultApplication, ...existingApplication, mobile: userIdentifier } : defaultApplication
  )
  const [pledgeDetails, setPledgeDetails] = useState(defaultPledge)
  const [ornaments, setOrnaments] = useState([])

  const [applicationId, setApplicationId] = useState(
    existingApplication?.application_id || null
  )
  const [pledgeSaved, setPledgeSaved] = useState(false)
  const [ornamentsSaved, setOrnamentsSaved] = useState(false)

  /* ================================================================ */
  /*  DERIVED: Is this a Direct Buying application?                   */
  /* ================================================================ */
  const isDirectBuying = applicationData.application_type === 'DIRECT_BUYING'

  // The ornaments step number changes based on type
  const ornamentsStep = isDirectBuying ? 2 : 3
  const totalSteps = isDirectBuying ? 2 : 3

  /* ================================================================ */
  /*  EDIT MODE: Fetch existing data, determine resume step           */
  /* ================================================================ */
  useEffect(() => {
    if (!existingApplication) return

    const fetchExistingData = async () => {
      try {
        setFetchingData(true)
        const appType = existingApplication.application_type || applicationData.application_type
        const isDirect = appType === 'DIRECT_BUYING'
        const appId = existingApplication.application_id

        let hasPledge = false
        let hasOrnaments = false

        // Single API call — searchCustomer has everything
        try {
          const res = await accountsAPI.searchCustomer(userIdentifier)
          const d = res.data || {}
          const cust = d.customer || {}
          const addresses = d.addresses || []
          const fullName = [cust.first_name, cust.last_name].filter(Boolean).join(' ')
          const presentAddr = addresses.find(a => /present|current/i.test(a.address_type)) || addresses[0] || {}
          const fullAddress = [presentAddr.address_line, presentAddr.street, presentAddr.city, presentAddr.state, presentAddr.pincode].filter(Boolean).join(', ')

          // Match pledge by application_id
          const allPledges = d.pledge_details || []
          const appPledge = allPledges.find(p => p.application_id === appId)
          if (appPledge?.pledger_name) {
            setPledgeDetails(prev => ({ ...prev, ...appPledge, pledger_name: appPledge.pledger_name || fullName, pledger_address: appPledge.pledger_address || fullAddress }))
            hasPledge = true; setPledgeSaved(true)
          } else if (!isDirect && fullName) {
            setPledgeDetails(prev => ({
              ...prev,
              pledger_name: prev.pledger_name || fullName,
              pledger_address: prev.pledger_address || fullAddress,
              branch_name: prev.branch_name || existingApplication.place || ''
            }))
          }

          // Match ornaments by application_id
          const allOrnaments = d.ornaments || []
          const appOrnaments = allOrnaments.filter(o => o.application_id === appId)
          if (appOrnaments.length > 0) {
            setOrnaments(appOrnaments.map((o, i) => ({ ...o, id: o.id || o.item_id || Date.now() + i })))
            hasOrnaments = true; setOrnamentsSaved(true)
          }
        } catch {
          console.log('Customer search failed during edit')
        }

        // Determine resume step
        if (isDirect) {
          setStep(hasOrnaments ? 2 : 2)
        } else {
          if (hasOrnaments) setStep(3)
          else if (hasPledge) setStep(3)
          else setStep(2)
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
  /*  FETCH CUSTOMER INFO — pre-fill pledger name, address & branch   */
  /*  Primary: /customers/search API                                  */
  /*  Fallback: localStorage, checkAccount                            */
  /* ================================================================ */
  useEffect(() => {
    if (!userIdentifier) return

    const fetchCustomerInfo = async () => {
      let fullName = ''
      let fullAddress = ''

      // === Primary: /customers/search API ===
      try {
        const res = await accountsAPI.searchCustomer(userIdentifier)
        const d = res.data || {}
        const cust = d.customer || {}
        const addresses = d.addresses || []

        fullName = [cust.first_name, cust.last_name].filter(Boolean).join(' ')
        if (addresses.length > 0) {
          const a = addresses.find(a => /present|current/i.test(a.address_type)) || addresses[0]
          fullAddress = [a.address_line, a.street, a.city, a.state, a.pincode].filter(Boolean).join(', ')
        }
      } catch (e) {
        // Fallback: localStorage
        try {
          const stored = JSON.parse(localStorage.getItem('svs_customer_info') || '{}')
          if (stored.name) fullName = stored.name
          if (!fullName) fullName = [stored.first_name, stored.last_name].filter(Boolean).join(' ')
          if (stored.addresses?.length > 0) {
            const addr = stored.addresses.find(a => /present|current/i.test(a.address_type)) || stored.addresses[0]
            fullAddress = [addr.address_line, addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
          }
        } catch {}

        // Fallback: checkAccount
        if (!fullName) {
          try {
            const res2 = await accountsAPI.checkAccount({ mobile: userIdentifier })
            const acc = res2.data?.account || res2.data || {}
            fullName = acc.name || [acc.first_name, acc.last_name].filter(Boolean).join(' ') || ''
          } catch {}
        }
      }

      if (fullName || fullAddress) {
        setPledgeDetails(prev => ({
          ...prev,
          pledger_name: prev.pledger_name || fullName || '',
          pledger_address: prev.pledger_address || fullAddress || ''
        }))
      }
    }

    fetchCustomerInfo()
  }, [userIdentifier])

  // Branch name in pledge is manually entered by user

  /* ================================================================ */
  /*  HANDLERS                                                        */
  /* ================================================================ */

  const handleBasicChange = (field, value) => {
    setApplicationData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handlePledgeChange = (field, value) => {
    setPledgeDetails(prev => {
      const updated = { ...prev, [field]: value }

      // Auto-calculate Total Due = Principal + Interest
      if (field === 'principal_amount' || field === 'interest_amount') {
        const principal = parseFloat(field === 'principal_amount' ? value : updated.principal_amount) || 0
        const interest = parseFloat(field === 'interest_amount' ? value : updated.interest_amount) || 0
        const total = principal + interest
        updated.total_due = total > 0 ? String(total) : ''
      }

      return updated
    })
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
      setError('Please select a branch')
      return false
    }
    return true
  }

  const validateStep2Pledge = () => {
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

  const validateOrnaments = () => {
    if (ornaments.length === 0) {
      setError('Please add at least one ornament')
      return false
    }
    const isPledge = applicationData.application_type === 'PLEDGE_RELEASE'
    for (let i = 0; i < ornaments.length; i++) {
      if (!ornaments[i].item_name?.trim()) {
        setError(`Ornament ${i + 1}: Item name is required`)
        return false
      }
      if (!ornaments[i].quantity || Number(ornaments[i].quantity) <= 0) {
        setError(`Ornament ${i + 1}: Quantity is required`)
        return false
      }
      if (!ornaments[i].purity_percentage || Number(ornaments[i].purity_percentage) <= 0) {
        setError(`Ornament ${i + 1}: Purity percentage is required`)
        return false
      }
      if (!ornaments[i].approx_weight_gms || Number(ornaments[i].approx_weight_gms) <= 0) {
        setError(`Ornament ${i + 1}: Approx weight is required`)
        return false
      }
      if (isPledge && !ornaments[i].item_photo_url) {
        setError(`Ornament ${i + 1}: Pledge ticket upload is required`)
        return false
      }
    }
    return true
  }

  /* ================================================================ */
  /*  STEP-BY-STEP SUBMIT                                             */
  /* ================================================================ */

  const handleNextStep = async () => {
    try {
      setLoading(true)
      setError('')

      /* ---------- STEP 1: Create/Update Application ---------- */
      if (step === 1) {
        if (!validateStep1()) return

        let appId = applicationId

        if (existingApplication?.application_id) {
          appId = existingApplication.application_id
          try {
            await applicationsAPI.updateApplication(applicationData)
          } catch (e) {
            console.log('Update application, continuing...')
          }
        } else {
          const createRes = await applicationsAPI.createApplication({
            ...applicationData,
            status: 'DRAFT'
          })
          appId = createRes.data.application_id
        }

        setApplicationId(appId)
        setApplicationData(prev => ({ ...prev, application_id: appId }))

        // DIRECT_BUYING → skip pledge, go straight to ornaments (step 2)
        // PLEDGE_RELEASE → go to pledge details (step 2)
        setStep(2)
        return
      }

      /* ---------- STEP 2 for PLEDGE_RELEASE: Save Pledge Details ---------- */
      if (step === 2 && !isDirectBuying) {
        if (!validateStep2Pledge()) return

        const appId = applicationId || existingApplication?.application_id
        if (!appId) { setError('Application not found. Go back to Step 1.'); return }

        await applicationsAPI.addPledgeDetails({
          ...pledgeDetails,
          mobile: userIdentifier,
          application_id: appId
        })

        setPledgeSaved(true)
        setStep(3) // go to ornaments
        return
      }

      /* ---------- ORNAMENTS STEP (Step 2 for DIRECT_BUYING, Step 3 for PLEDGE) ---------- */
      if ((step === 2 && isDirectBuying) || (step === 3 && !isDirectBuying)) {
        if (!validateOrnaments()) return

        const appId = applicationId || existingApplication?.application_id
        if (!appId) { setError('Application not found. Go back to Step 1.'); return }

        await applicationsAPI.addOrnaments({
          application_id: appId,
          mobile: userIdentifier,
          ornaments
        })

        setOrnamentsSaved(true)

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
    setError('')
    if (step === 1) {
      onCancel()
    } else if (step === 2) {
      setStep(1) // both types go back to step 1
    } else if (step === 3) {
      setStep(2) // only PLEDGE_RELEASE reaches step 3
    }
  }

  /* ================================================================ */
  /*  STYLES                                                          */
  /* ================================================================ */

  const inputClass =
    'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300'
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-2'

  /* ================================================================ */
  /*  STEP INDICATOR — dynamic based on application type              */
  /* ================================================================ */

  const getSteps = () => {
    if (isDirectBuying) {
      return [
        { num: 1, label: 'Application Details' },
        { num: 2, label: 'Ornaments' }
      ]
    }
    return [
      { num: 1, label: 'Application Details' },
      { num: 2, label: 'Pledge Details' },
      { num: 3, label: 'Ornaments' }
    ]
  }

  const StepIndicator = () => {
    const stepsConfig = getSteps()
    return (
      <div className="flex items-center justify-center mb-8">
        {stepsConfig.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step > s.num
                    ? 'bg-green-500 text-white'
                    : step === s.num
                    ? 'bg-amber-700 text-white shadow-lg shadow-amber-600/30'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.num ? <Check size={18} /> : (i + 1)}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  step >= s.num ? 'text-amber-700' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < stepsConfig.length - 1 && (
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
  }

  /* ================================================================ */
  /*  Which content to show at current step?                          */
  /* ================================================================ */
  const showApplicationForm = step === 1
  const showPledgeForm = step === 2 && !isDirectBuying
  const showOrnamentsForm = (step === 2 && isDirectBuying) || (step === 3 && !isDirectBuying)

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
          <input type="text" value={applicationData.application_no} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
        </div>
        <div>
          <label className={labelClass}>Application Date</label>
          <input type="date" value={applicationData.application_date} onChange={(e) => handleBasicChange('application_date', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Application Type <span className="text-red-500">*</span></label>
          <select value={applicationData.application_type} onChange={(e) => handleBasicChange('application_type', e.target.value)} className={inputClass}>
            <option value="">Select Type</option>
            <option value="PLEDGE_RELEASE">Pledge Release</option>
            <option value="DIRECT_BUYING">Direct Buying</option>
          </select>
          {applicationData.application_type && (
            <p className="text-xs text-amber-600 mt-1.5">
              {applicationData.application_type === 'DIRECT_BUYING'
                ? '→ Next: Ornaments (pledge details not required)'
                : '→ Next: Pledge Details → Ornaments'
              }
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Branch <span className="text-red-500">*</span></label>
          <select value={applicationData.place} onChange={(e) => handleBasicChange('place', e.target.value)} className={inputClass}>
            <option value="">Select Branch</option>
            {branches.length > 0
              ? branches.map(b => <option key={b.branch_code} value={b.branch_name}>{b.branch_name}</option>)
              : <><option value="Dilsukhnagar">Dilsukhnagar</option><option value="Narayanguda">Narayanguda</option></>
            }
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Mobile</label>
        <input type="text" value={applicationData.mobile || userIdentifier} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
      </div>
    </div>
  )

  /* ================================================================ */
  /*  STEP 2 (PLEDGE_RELEASE only): PLEDGE DETAILS                    */
  /* ================================================================ */

  const renderPledgeForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">Pledge Details</h3>
        <p className="text-sm text-gray-500">Enter pledge and loan information</p>
      </div>

      {/* Pledger Name (pre-filled from customer) */}
      <div>
        <label className={labelClass}>Pledger Name <span className="text-red-500">*</span></label>
        <input type="text" value={pledgeDetails.pledger_name} onChange={(e) => handlePledgeChange('pledger_name', e.target.value)} placeholder="Full name" className={inputClass} />
        {pledgeDetails.pledger_name && (
          <p className="text-xs text-green-600 mt-1">Pre-filled from customer info</p>
        )}
      </div>

      {/* Pledger Address (pre-filled from customer) */}
      <div>
        <label className={labelClass}>Pledger Address</label>
        <textarea value={pledgeDetails.pledger_address} onChange={(e) => handlePledgeChange('pledger_address', e.target.value)} placeholder="Full address" rows={3} className={inputClass} />
        {pledgeDetails.pledger_address && (
          <p className="text-xs text-green-600 mt-1">Pre-filled from customer address</p>
        )}
      </div>

      {/* Financier & Branch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Financier Name <span className="text-red-500">*</span></label>
          <input type="text" value={pledgeDetails.financier_name} onChange={(e) => handlePledgeChange('financier_name', e.target.value)} placeholder="Financier / Bank" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Branch Name</label>
          <input type="text" value={pledgeDetails.branch_name} onChange={(e) => handlePledgeChange('branch_name', e.target.value)} placeholder="Branch name" className={inputClass} />
        </div>
      </div>

      {/* Gold Loan Account No */}
      <div>
        <label className={labelClass}>Gold Loan Account No</label>
        <input type="text" value={pledgeDetails.gold_loan_account_no} onChange={(e) => handlePledgeChange('gold_loan_account_no', e.target.value)} placeholder="Loan account number" className={inputClass} />
      </div>

      {/* Principal + Interest = Total Due */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className={labelClass}>Principal Amount (₹)</label>
          <input
            type="text"
            value={pledgeDetails.principal_amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '')
              handlePledgeChange('principal_amount', val)
            }}
            placeholder="Enter principal amount"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Interest Amount (₹)</label>
          <input
            type="text"
            value={pledgeDetails.interest_amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '')
              handlePledgeChange('interest_amount', val)
            }}
            placeholder="Enter interest amount"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Total Due (₹) <span className="text-xs text-gray-400 font-normal">Auto-calculated</span></label>
          <div className="px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-800 font-semibold text-lg">
            ₹{pledgeDetails.total_due ? Number(pledgeDetails.total_due).toLocaleString('en-IN') : '0'}
          </div>
        </div>
      </div>
    </div>
  )

  /* ================================================================ */
  /*  ORNAMENTS FORM (Step 2 for DIRECT_BUYING, Step 3 for PLEDGE)    */
  /* ================================================================ */

  const [goldItems, setGoldItems] = useState([
    'Ring', 'Chain', 'Necklace', 'Bangle', 'Bracelet', 'Earrings', 'Pendant',
    'Mangalsutra', 'Anklet', 'Waist Belt (Vaddanam)', 'Nose Ring', 'Gold Coin',
    'Brooch', 'Hair Pin', 'Locket', 'Bulk Gold (for melting)', 'Other'
  ])

  // Fetch gold items from API
  useEffect(() => {
    (async () => {
      try {
        const res = await applicationsAPI.getGoldItems()
        const items = res.data?.gold_items || []
        if (items.length > 0) {
          setGoldItems(items.map(i => i.name))
        }
      } catch { /* use default list */ }
    })()
  }, [])

  // Branches from API
  const [branches, setBranches] = useState([])
  useEffect(() => {
    (async () => {
      try {
        const res = await applicationsAPI.getBranches()
        const b = res.data?.branches || []
        if (b.length > 0) setBranches(b)
      } catch { /* fallback: empty, user types manually */ }
    })()
  }, [])

  const renderOrnamentsForm = () => {
    const isPledgeRelease = !isDirectBuying

    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">Ornaments</h3>
          <p className="text-sm text-gray-500">Add gold ornament details</p>
        </div>
        <button type="button" onClick={addOrnament} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 font-semibold rounded-xl hover:bg-amber-100 transition-all duration-300">
          <Plus size={18} /> Add Ornament
        </button>
      </div>

      {ornaments.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <Upload size={40} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 font-medium">No ornaments added yet</p>
          <button type="button" onClick={addOrnament} className="mt-4 px-6 py-2 bg-amber-700 text-white font-semibold rounded-xl hover:bg-amber-800 transition-all">
            <Plus size={16} className="inline mr-1" /> Add First Ornament
          </button>
        </div>
      )}

      {ornaments.map((ornament, index) => (
        <div key={ornament.id || index} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border-2 border-amber-100/50 space-y-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">Ornament {index + 1}</h4>
            <button type="button" onClick={() => removeOrnament(index)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-800 transition-all">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Item Name <span className="text-red-500">*</span></label>
              <select
                value={ornament.item_name}
                onChange={(e) => updateOrnament(index, 'item_name', e.target.value)}
                className={inputClass}
              >
                <option value="">Select Item</option>
                {goldItems.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Quantity <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={ornament.quantity}
                onChange={(e) => updateOrnament(index, 'quantity', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter quantity"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Purity Percentage (%) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={ornament.purity_percentage}
                onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); if (v === '' || parseInt(v) <= 100) updateOrnament(index, 'purity_percentage', v) }}                placeholder="Enter purity %"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Approx Weight (gms) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={ornament.approx_weight_gms}
                onChange={(e) => updateOrnament(index, 'approx_weight_gms', e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Enter weight in gms"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{isPledgeRelease ? 'Pledge Ticket' : 'Item Photo'}{isPledgeRelease && <span className="text-red-500"> *</span>}</label>
            <div className="flex items-center gap-4">
              <input type="file" accept="image/*,.pdf" onChange={(e) => handleImageUpload(index, e.target.files[0])} className="hidden" id={`ornament-photo-${index}`} />
              <label htmlFor={`ornament-photo-${index}`} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-amber-500 rounded-xl cursor-pointer hover:bg-amber-50 transition-all flex-1">
                <Upload size={18} className="text-amber-700" />
                <span className="text-amber-700 font-medium text-sm">
                  {ornament.item_photo_url
                    ? (isPledgeRelease ? 'Pledge ticket uploaded ✓' : 'Photo uploaded ✓')
                    : (isPledgeRelease ? 'Click to upload pledge ticket' : 'Click to upload photo')
                  }
                </span>
              </label>
              {ornament.item_photo_url && (
                <img src={ornament.item_photo_url} alt={`Ornament ${index + 1}`} className="w-16 h-16 object-cover rounded-xl border-2 border-amber-200" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
    )
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  if (fetchingData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <Loader size={36} className="text-amber-700 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Loading application data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Current step number relative to total steps (for display)
  const currentStepDisplay = isDirectBuying
    ? step       // step 1 or 2
    : step       // step 1, 2, or 3

  // Is this the last step?
  const isLastStep = (isDirectBuying && step === 2) || (!isDirectBuying && step === 3)

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {existingApplication ? 'Continue Application' : 'Create Application'}
        </h2>
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
          Cancel
        </button>
      </div>

      {/* Step Indicator */}
      <StepIndicator />

      {/* Info banner for edit mode */}
      {existingApplication && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <AlertCircle className="text-amber-700 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm text-amber-800 font-medium">
              Continuing: {applicationData.application_no}
              <span className="ml-2 text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                {isDirectBuying ? 'Direct Buying' : 'Pledge Release'}
              </span>
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {isDirectBuying
                ? 'Steps: Application Details → Ornaments'
                : 'Steps: Application Details → Pledge Details → Ornaments'
              }
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
        {showApplicationForm && renderStep1()}
        {showPledgeForm && renderPledgeForm()}
        {showOrnamentsForm && renderOrnamentsForm()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <button type="button" onClick={handleBack} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all disabled:opacity-50">
          <ChevronLeft size={18} />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-2">
            Step {isDirectBuying ? step : step} of {totalSteps}
          </span>

          <button type="button" onClick={handleNextStep} disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <><Loader size={18} className="animate-spin" /> Saving...</>
            ) : isLastStep ? (
              <><Save size={18} /> Save & Complete</>
            ) : (
              <>Save & Next <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}