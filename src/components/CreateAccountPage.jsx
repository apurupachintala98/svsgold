// import React, { useState } from 'react'
// import { ChevronLeft, AlertCircle } from 'lucide-react'
// import AccountInformation from './AccountInformation'
// import AddressInformation from './AddressInformation'
// import BankAccounts from './BankAccounts'
// import Documents from './Documents'
// import { accountsAPI } from '../api/api'
// import { validateCreateAccountForm } from '../utils/validation'

// export default function CreateAccountPage({ loginData, onBackToLogin, onSuccess }) {

//   const generateAccountCode = () => {
//     const uuid = crypto.randomUUID()
//     const numericPart = uuid.replace(/\D/g, '')
//     const randomThreeDigits = numericPart.slice(0, 3).padEnd(3, '0')
//     return `CUS_SVS_${randomThreeDigits}`
//   }

//   const [formData, setFormData] = useState({
//     account_type: '',
//     account_code: generateAccountCode(),
//     first_name: '',
//     last_name: '',
//     contact_person: '',
//     mobile: loginData.mobile || '',
//     phone: '',
//     email: loginData.email || '',
//     gender: '',
//     date_of_birth: '',
//     aadhar_no: '',
//     yearly_income: '',
//     occupation: '',
//     gst_no: '',
//     pan_no: '',
//     source: '',
//     owner: '',
//     state: '',
//     district: '',
//     city: '',
//     pincode: '',
//     address_text: '',
//     addresses: [],
//     bank_accounts: [],
//     documents: []
//   })

//   const [openSections, setOpenSections] = useState({
//     account: true,
//     address: true,
//     bank: false,
//     documents: true   // Documents always visible
//   })

//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')
//   const [validationErrors, setValidationErrors] = useState({})

//   const toggleSection = (section) => {
//     setOpenSections(prev => ({
//       ...prev,
//       [section]: !prev[section]
//     }))
//   }

//   const handleDataChange = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     if (loading) return

//     const { errors, isValid } = validateCreateAccountForm(
//       formData,
//       formData.addresses,
//       formData.bank_accounts,
//       formData.documents
//     )

//     if (!isValid) {
//       setValidationErrors(errors)
//       setError('Please fix all validation errors before submitting.')
//       window.scrollTo({ top: 0, behavior: 'smooth' })
//       return
//     }

//     setValidationErrors({})
//     setLoading(true)
//     setError('')
//     setSuccess('')

//     try {
//       const accountPayload = {
//         account_type: formData.account_type || '',
//         account_code: formData.account_code || '',
//         first_name: formData.first_name || '',
//         last_name: formData.last_name || '',
//         contact_person: '',
//         mobile: formData.mobile || '',
//         phone: formData.phone || '',
//         email: formData.email || '',
//         gender: formData.gender || '',
//         date_of_birth: formData.date_of_birth || '',
//         aadhar_no: formData.aadhar_no || '',
//         yearly_income: 0,
//         occupation: formData.occupation || '',
//         gst_no: '',
//         pan_no: formData.pan_no || '',
//         source: 'web',
//         owner: 'admin',
//         state: formData.state || '',
//         district: formData.district || '',
//         city: formData.city || '',
//         pincode: formData.pincode || '',
//         address_text: formData.address_text || ''
//       }

//       const accountResponse = await accountsAPI.createAccount(accountPayload)

//       if (formData.addresses && formData.addresses.length > 0) {
//         for (const address of formData.addresses) {
//           if (!address.address_line?.trim()) continue
//           const addressPayload = {
//             address_type: address.address_type || '',
//             address_line: address.address_line || '',
//             street: address.street || '',
//             city: address.city || '',
//             state: address.state || '',
//             country: 'India',
//             pincode: address.pincode || ''
//           }
//           await accountsAPI.addAddress(formData.mobile, addressPayload)
//         }
//       }

//       if (formData.bank_accounts && formData.bank_accounts.length > 0) {
//         for (const bank of formData.bank_accounts) {
//           const bankPayload = {
//             bank_name: bank.bank_name || '',
//             branch: bank.branch || '',
//             account_number: bank.account_number || '',
//             ifsc_code: bank.ifsc_code || '',
//             account_holder_name: bank.account_holder_name || '',
//             account_holder_type: bank.account_holder_type || 'Self',
//             is_primary: bank.is_primary || false
//           }
//           await accountsAPI.addBankAccount(formData.mobile, bankPayload)
//         }
//       }

//       if (formData.documents && formData.documents.length > 0) {
//         for (const doc of formData.documents) {
//           if (!doc.file_name) continue
//           const docPayload = {
//             document_type: doc.document_type || '',
//             document_number: doc.document_number || '',
//             file_path: doc.file_path || '',
//             file_name: doc.file_name || '',
//             file_size_mb: doc.file_size_mb || 0
//           }
//           await accountsAPI.addDocument(formData.mobile, docPayload)
//         }
//       }

//       setSuccess('Account created successfully!')

//       setTimeout(() => {
//         onSuccess(accountResponse.data)
//       }, 1500)
//     } catch (err) {
//       console.error('[CreateAccountPage] Error creating account:', err)
//       setError(err.response?.data?.message || 'Error creating account. Please try again.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda, #fdf8f0)' }}>
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="mb-8 flex items-start gap-6">
//           <button
//             onClick={onBackToLogin}
//             className="p-3 hover:bg-white/80 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
//           >
//             <ChevronLeft size={24} style={{ color: '#a36e24' }} />
//           </button>
//           <div className="flex-1">
//             <h1 className="text-4xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
//               Create New Account
//             </h1>
//             <p className="text-gray-600">Complete all sections to set up the customer account</p>
//           </div>
//         </div>

//         {/* Error and Success Messages */}
//         {error && (
//           <div className="mb-6 flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl shadow-md">
//             <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
//             <span className="text-sm text-red-800 font-medium">{error}</span>
//           </div>
//         )}

//         {success && (
//           <div className="mb-6 flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl shadow-md">
//             <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
//             <span className="text-sm text-green-800 font-medium">{success}</span>
//           </div>
//         )}

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <AccountInformation
//             isOpen={openSections.account}
//             onToggle={() => toggleSection('account')}
//             data={formData}
//             onDataChange={handleDataChange}
//             errors={validationErrors}
//           />

//           <AddressInformation
//             isOpen={openSections.address}
//             onToggle={() => toggleSection('address')}
//             data={formData}
//             onDataChange={handleDataChange}
//             errors={validationErrors}
//           />

//           <BankAccounts
//             isOpen={openSections.bank}
//             onToggle={() => toggleSection('bank')}
//             data={formData}
//             onDataChange={handleDataChange}
//             errors={validationErrors}
//           />

//           <Documents
//             isOpen={openSections.documents}
//             onToggle={() => toggleSection('documents')}
//             data={formData}
//             onDataChange={handleDataChange}
//             errors={validationErrors}
//           />

//           {/* Submit Buttons */}
//           <div className="flex gap-4 pt-8 bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
//             <button
//               type="button"
//               onClick={onBackToLogin}
//               className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
//             >
//               Back
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="flex-1 py-3 px-6 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
//               style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', boxShadow: '0 4px 14px 0 rgba(163, 110, 36, 0.3)' }}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   Creating Account...
//                 </span>
//               ) : (
//                 'Complete & Finish'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   )
// }

import React, { useState } from 'react'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import AccountInformation from './AccountInformation'
import AddressInformation from './AddressInformation'
import BankAccounts from './BankAccounts'
import Documents from './Documents'
import { accountsAPI } from '../api/api'
import { validateCreateAccountForm } from '../utils/validation'

export default function CreateAccountPage({ loginData, onBackToLogin, onSuccess }) {

  const generateAccountCode = () => {
    const uuid = crypto.randomUUID()
    const numericPart = uuid.replace(/\D/g, '')
    const randomThreeDigits = numericPart.slice(0, 3).padEnd(3, '0')
    return `CUS_SVS_${randomThreeDigits}`
  }

  const [formData, setFormData] = useState({
    account_type: '',
    account_code: generateAccountCode(),
    first_name: '',
    last_name: '',
    contact_person: '',
    mobile: loginData.mobile || '',
    phone: '',
    email: loginData.email || '',
    gender: '',
    date_of_birth: '',
    aadhar_no: '',
    yearly_income: '',
    occupation: '',
    gst_no: '',
    pan_no: '',
    source: '',
    owner: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
    address_text: '',
    addresses: [],
    bank_accounts: [],
    documents: []
  })

  const [openSections, setOpenSections] = useState({
    account: true,
    address: true,
    bank: false,
    documents: true   // Documents always visible
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    const { errors, isValid } = validateCreateAccountForm(
      formData,
      formData.addresses,
      formData.bank_accounts,
      formData.documents
    )

    if (!isValid) {
      setValidationErrors(errors)
      setError('Please fix all validation errors before submitting.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setValidationErrors({})
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const accountPayload = {
        account_type: formData.account_type || '',
        account_code: formData.account_code || '',
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        contact_person: '',
        mobile: formData.mobile || '',
        phone: formData.phone || '',
        email: formData.email || '',
        gender: formData.gender || '',
        date_of_birth: formData.date_of_birth || '',
        aadhar_no: formData.aadhar_no || '',
        yearly_income: 0,
        occupation: formData.occupation || '',
        gst_no: '',
        pan_no: formData.pan_no || '',
        source: 'web',
        owner: 'admin',
        state: formData.state || '',
        district: formData.district || '',
        city: formData.city || '',
        pincode: formData.pincode || '',
        address_text: formData.address_text || ''
      }

      const accountResponse = await accountsAPI.createAccount(accountPayload)

      if (formData.addresses && formData.addresses.length > 0) {
        for (const address of formData.addresses) {
          if (!address.address_line?.trim()) continue
          const addressPayload = {
            address_type: address.address_type || '',
            address_line: address.address_line || '',
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            country: 'India',
            pincode: address.pincode || ''
          }
          await accountsAPI.addAddress(formData.mobile, addressPayload)
        }
      }

      if (formData.bank_accounts && formData.bank_accounts.length > 0) {
        for (const bank of formData.bank_accounts) {
          const bankPayload = {
            bank_name: bank.bank_name || '',
            branch: bank.branch || '',
            account_number: bank.account_number || '',
            ifsc_code: bank.ifsc_code || '',
            account_holder_name: bank.account_holder_name || '',
            account_holder_type: bank.account_holder_type || 'Self',
            is_primary: bank.is_primary || false
          }
          await accountsAPI.addBankAccount(formData.mobile, bankPayload)
        }
      }

      if (formData.documents && formData.documents.length > 0) {
        for (const doc of formData.documents) {
          if (!doc.file_name) continue
          const docPayload = {
            document_type: doc.document_type || '',
            document_number: doc.document_number || '',
            file_path: doc.file_path || '',
            file_name: doc.file_name || '',
            file_size_mb: doc.file_size_mb || 0
          }
          await accountsAPI.addDocument(formData.mobile, docPayload)
        }
      }

      setSuccess('Account created successfully!')

      // Save customer info to localStorage for ApplicationForm pre-fill
      localStorage.setItem('svs_customer_info', JSON.stringify({
        name: [formData.first_name, formData.last_name].filter(Boolean).join(' '),
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        mobile: formData.mobile || '',
        email: formData.email || '',
        gender: formData.gender || '',
        date_of_birth: formData.date_of_birth || '',
        aadhar_no: formData.aadhar_no || '',
        pan_no: formData.pan_no || '',
        occupation: formData.occupation || '',
        addresses: formData.addresses || []
      }))

      setTimeout(() => {
        onSuccess(accountResponse.data)
      }, 1500)
    } catch (err) {
      console.error('[CreateAccountPage] Error creating account:', err)
      setError(err.response?.data?.message || 'Error creating account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda, #fdf8f0)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start gap-6">
          <button
            onClick={onBackToLogin}
            className="p-3 hover:bg-white/80 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <ChevronLeft size={24} style={{ color: '#a36e24' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Create New Account
            </h1>
            <p className="text-gray-600">Complete all sections to set up the customer account</p>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl shadow-md">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <span className="text-sm text-red-800 font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl shadow-md">
            <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <span className="text-sm text-green-800 font-medium">{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AccountInformation
            isOpen={openSections.account}
            onToggle={() => toggleSection('account')}
            data={formData}
            onDataChange={handleDataChange}
            errors={validationErrors}
          />

          <AddressInformation
            isOpen={openSections.address}
            onToggle={() => toggleSection('address')}
            data={formData}
            onDataChange={handleDataChange}
            errors={validationErrors}
          />

          <BankAccounts
            isOpen={openSections.bank}
            onToggle={() => toggleSection('bank')}
            data={formData}
            onDataChange={handleDataChange}
            errors={validationErrors}
          />

          <Documents
            isOpen={openSections.documents}
            onToggle={() => toggleSection('documents')}
            data={formData}
            onDataChange={handleDataChange}
            errors={validationErrors}
          />

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-8 bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', boxShadow: '0 4px 14px 0 rgba(163, 110, 36, 0.3)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </span>
              ) : (
                'Complete & Finish'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}