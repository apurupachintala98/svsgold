// import React, { useState, useEffect } from 'react'
// import { LogOut, Menu, X, FileText, Plus, Settings, Home, Search, Phone, Mail, AlertCircle, UserPlus, Loader }
//   from 'lucide-react'
// import { useNavigate } from 'react-router-dom'
// import ApplicationForm from '../components/ApplicationForm'
// import ApplicationsView from '../components/ApplicationsView'
// import CreateAccountPage from '../components/CreateAccountPage'
// import { applicationsAPI, accountsAPI } from '../api/api'

// export default function Dashboard({ loginData, onLogout }) {

//   const navigate = useNavigate()

//   const [sidebarOpen, setSidebarOpen] = useState(true)
//   const [currentPage, setCurrentPage] = useState('applications')

//   /* ---- Customer Search State ---- */
//   const [searchType, setSearchType] = useState('mobile')
//   const [searchValue, setSearchValue] = useState('')
//   const [searching, setSearching] = useState(false)
//   const [searchError, setSearchError] = useState('')
//   const [customerFound, setCustomerFound] = useState(null)   // null = not searched, true/false = result
//   const [customerMobile, setCustomerMobile] = useState('')    // the active customer mobile
//   const [showCreateAccount, setShowCreateAccount] = useState(false)

//   /* ---- Applications State ---- */
//   const [applications, setApplications] = useState([])
//   const [showCreateForm, setShowCreateForm] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')

//   /* ================================================================ */
//   /*  CUSTOMER SEARCH                                                 */
//   /* ================================================================ */
//   const handleSearchCustomer = async (e) => {
//     e.preventDefault()
//     setSearchError('')
//     setCustomerFound(null)
//     setApplications([])
//     setError('')

//     if (!searchValue.trim()) {
//       setSearchError('Please enter a mobile number or email')
//       return
//     }

//     if (searchType === 'mobile' && !/^[0-9]{10}$/.test(searchValue.trim())) {
//       setSearchError('Please enter a valid 10-digit mobile number')
//       return
//     }

//     setSearching(true)
//     try {
//       const payload = searchType === 'mobile'
//         ? { mobile: searchValue.trim() }
//         : { email: searchValue.trim() }

//       const response = await accountsAPI.checkAccount(payload)

//       if (response.data.exists) {
//         setCustomerFound(true)
//         const mobile = searchType === 'mobile' ? searchValue.trim() : (response.data.mobile || searchValue.trim())
//         setCustomerMobile(mobile)
//         localStorage.setItem('user_mobile', mobile)
//         localStorage.setItem('svs_gold_login_data', JSON.stringify({
//           ...loginData,
//           mobile,
//           accountExists: true
//         }))
//         // Fetch applications for this customer
//         fetchApplications(mobile)
//       } else {
//         setCustomerFound(false)
//       }
//     } catch (err) {
//       console.error('Error searching customer:', err)
//       setCustomerFound(false)
//     } finally {
//       setSearching(false)
//     }
//   }

//   const fetchApplications = async (mobile) => {
//     try {
//       setLoading(true)
//       setError('')
//       const response = await applicationsAPI.getApplicationsByUser(mobile)
//       if (!response?.data?.applications) {
//         setApplications([])
//       } else {
//         setApplications(response.data.applications)
//       }
//     } catch (err) {
//       if (err.response?.status === 404) {
//         setApplications([])
//       } else {
//         setError('Failed to load applications')
//         setApplications([])
//       }
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleClearCustomer = () => {
//     setCustomerFound(null)
//     setCustomerMobile('')
//     setSearchValue('')
//     setApplications([])
//     setShowCreateForm(false)
//     setShowCreateAccount(false)
//     setError('')
//     setSearchError('')
//     localStorage.removeItem('user_mobile')
//   }

//   const handleCreateAccountForCustomer = () => {
//     setShowCreateAccount(true)
//   }

//   const handleCreateAccountSuccess = () => {
//     setShowCreateAccount(false)
//     setCustomerFound(true)
//     setCustomerMobile(searchValue.trim())
//     localStorage.setItem('user_mobile', searchValue.trim())
//     localStorage.setItem('svs_gold_login_data', JSON.stringify({
//       ...loginData,
//       mobile: searchValue.trim(),
//       accountExists: true
//     }))
//     fetchApplications(searchValue.trim())
//   }

//   const handleApplicationSuccess = (newApplication) => {
//     setShowCreateForm(false)
//     setApplications(prev => [newApplication, ...prev])
//   }

//   /* ================================================================ */
//   /*  MENU                                                            */
//   /* ================================================================ */
//   const menuItems = [
//     { id: 'applications', label: 'Applications', icon: FileText, color: 'text-amber-700' },
//     { id: 'profile', label: 'Profile', icon: Settings, color: 'text-amber-700' }
//   ]

//   /* ================================================================ */
//   /*  CREATE ACCOUNT VIEW                                             */
//   /* ================================================================ */
//   if (showCreateAccount) {
//     const fakeLoginData = {
//       mobile: searchType === 'mobile' ? searchValue.trim() : '',
//       email: searchType === 'email' ? searchValue.trim() : ''
//     }
//     return (
//       <CreateAccountPage
//         loginData={fakeLoginData}
//         onBackToLogin={() => setShowCreateAccount(false)}
//         onSuccess={handleCreateAccountSuccess}
//       />
//     )
//   }

//   /* ================================================================ */
//   /*  RENDER                                                          */
//   /* ================================================================ */
//   return (
//     <div className="flex h-screen" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda, #fdf8f0)' }}>

//       {/* Sidebar */}
//       <aside
//         className={`${sidebarOpen ? 'w-64' : 'w-20'}
//         text-white transition-all duration-300 shadow-2xl overflow-hidden`}
//         style={{ background: 'linear-gradient(180deg, #a36e24, #8b5c1c)' }}
//       >
//         <div className="h-full flex flex-col">

//           {/* Logo */}
//           <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
//             <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
//               <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
//                 <img src="/svslogo-white.png" alt="SVS Gold" className="w-8 h-8 object-contain" />
//               </div>
//               {sidebarOpen && <span className="font-bold text-lg">SVS Gold</span>}
//             </div>
//           </div>

//           {/* Menu */}
//           <nav className="flex-1 p-4 space-y-2">
//             {menuItems.map(item => {
//               const Icon = item.icon
//               return (
//                 <button
//                   key={item.id}
//                   onClick={() => setCurrentPage(item.id)}
//                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
//                   ${currentPage === item.id ? 'shadow-lg' : 'hover:bg-white/10'}`}
//                   style={currentPage === item.id ? { background: 'rgba(255,255,255,0.2)' } : {}}
//                 >
//                   <Icon size={20} className="text-amber-200" />
//                   {sidebarOpen && <span className="font-medium">{item.label}</span>}
//                 </button>
//               )
//             })}
//           </nav>

//           {/* Toggle */}
//           <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
//             <button
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200"
//             >
//               {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
//               {sidebarOpen && <span className="text-sm">Collapse</span>}
//             </button>
//           </div>

//         </div>
//       </aside>

//       {/* Main */}
//       <div className="flex-1 flex flex-col overflow-hidden">

//         {/* Top Bar */}
//         <header className="bg-white shadow-md px-8 py-5 flex items-center justify-between border-b border-gray-200">
//           <div>
//             <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
//               SVS Gold CRM
//             </h1>
//             <p className="text-gray-500 text-sm mt-1">
//               Logged in as: <span className="font-medium text-gray-700">{loginData.username || 'Admin'}</span>
//               {customerMobile && (
//                 <span className="ml-3 text-amber-700 font-medium">• Customer: {customerMobile}</span>
//               )}
//             </p>
//           </div>

//           <div className="flex items-center gap-4">
//             <button onClick={() => navigate('/')} className="p-3 rounded-lg hover:bg-gray-100 transition-colors">
//               <Home size={20} className="text-gray-600" />
//             </button>
//             <button
//               onClick={onLogout}
//               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
//             >
//               <LogOut size={18} />
//               Logout
//             </button>
//           </div>
//         </header>

//         {/* Content */}
//         <main className="flex-1 overflow-auto p-8">
//           {currentPage === 'applications' && (
//             <div className="space-y-6">

//               {/* ============================================================ */}
//               {/*  CUSTOMER SEARCH PANEL                                       */}
//               {/* ============================================================ */}
//               {!customerFound && !showCreateForm && (
//                 <div className="bg-white rounded-2xl shadow-lg p-8">
//                   <div className="mb-6">
//                     <h2 className="text-2xl font-bold text-gray-900 mb-1">Search Customer</h2>
//                     <p className="text-gray-500 text-sm">Enter customer's mobile number or email to load their applications</p>
//                   </div>

//                   {/* Search Type Selector */}
//                   <div className="flex gap-3 mb-6">
//                     <button
//                       onClick={() => { setSearchType('mobile'); setSearchValue(''); setSearchError(''); setCustomerFound(null) }}
//                       className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
//                         searchType === 'mobile' ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                       }`}
//                       style={searchType === 'mobile' ? { background: 'linear-gradient(135deg, #c9943a, #a36e24)' } : {}}
//                     >
//                       <Phone size={18} />
//                       Mobile
//                     </button>
//                     <button
//                       onClick={() => { setSearchType('email'); setSearchValue(''); setSearchError(''); setCustomerFound(null) }}
//                       className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
//                         searchType === 'email' ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                       }`}
//                       style={searchType === 'email' ? { background: 'linear-gradient(135deg, #c9943a, #a36e24)' } : {}}
//                     >
//                       <Mail size={18} />
//                       Email
//                     </button>
//                   </div>

//                   {/* Search Input */}
//                   <form onSubmit={handleSearchCustomer} className="flex gap-4">
//                     <div className="relative flex-1">
//                       <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#a36e24' }}>
//                         {searchType === 'mobile' ? <Phone size={20} /> : <Mail size={20} />}
//                       </div>
//                       <input
//                         type={searchType === 'mobile' ? 'tel' : 'email'}
//                         placeholder={searchType === 'mobile' ? 'Enter 10-digit mobile number' : 'Enter email address'}
//                         value={searchValue}
//                         onChange={(e) => { setSearchValue(e.target.value); setSearchError(''); setCustomerFound(null) }}
//                         maxLength={searchType === 'mobile' ? 10 : undefined}
//                         className="w-full pl-12 pr-4 py-4 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
//                         onFocus={(e) => { e.target.style.borderColor = '#a36e24'; e.target.style.boxShadow = '0 0 0 4px rgba(163, 110, 36, 0.1)' }}
//                         onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '' }}
//                       />
//                     </div>
//                     <button
//                       type="submit"
//                       disabled={searching || !searchValue.trim()}
//                       className="px-8 py-4 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                       style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', boxShadow: '0 4px 14px 0 rgba(163, 110, 36, 0.3)' }}
//                     >
//                       {searching ? <Loader size={20} className="animate-spin" /> : <Search size={20} />}
//                       {searching ? 'Searching...' : 'Search'}
//                     </button>
//                   </form>

//                   {/* Search Error */}
//                   {searchError && (
//                     <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl mt-4">
//                       <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
//                       <span className="text-sm text-red-700">{searchError}</span>
//                     </div>
//                   )}

//                   {/* Customer Not Found */}
//                   {customerFound === false && (
//                     <div className="mt-6 p-6 border-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda)', borderColor: '#e4b96e' }}>
//                       <div className="flex items-start gap-3 mb-4">
//                         <AlertCircle size={20} style={{ color: '#a36e24' }} className="flex-shrink-0 mt-0.5" />
//                         <div>
//                           <p className="text-sm font-medium" style={{ color: '#6e4816' }}>
//                             No account found for this {searchType === 'mobile' ? 'mobile number' : 'email'}.
//                           </p>
//                           <p className="text-xs mt-1" style={{ color: '#8b5c1c' }}>
//                             Would you like to create a new customer account?
//                           </p>
//                         </div>
//                       </div>
//                       <button
//                         onClick={handleCreateAccountForCustomer}
//                         className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all"
//                         style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', boxShadow: '0 4px 14px 0 rgba(163, 110, 36, 0.3)' }}
//                       >
//                         <UserPlus size={18} />
//                         Create New Account
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* ============================================================ */}
//               {/*  CUSTOMER FOUND — Show applications                          */}
//               {/* ============================================================ */}
//               {customerFound === true && (
//                 <>
//                   {/* Active Customer Bar */}
//                   <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-amber-200">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0d5a8, #e4b96e)' }}>
//                         <Phone size={18} style={{ color: '#6e4816' }} />
//                       </div>
//                       <div>
//                         <p className="text-sm font-semibold text-gray-800">Active Customer</p>
//                         <p className="text-xs text-gray-500">{customerMobile}</p>
//                       </div>
//                     </div>
//                     <button
//                       onClick={handleClearCustomer}
//                       className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
//                     >
//                       Change Customer
//                     </button>
//                   </div>

//                   {showCreateForm && (
//                     <ApplicationForm
//                       userIdentifier={customerMobile}
//                       onSuccess={handleApplicationSuccess}
//                       onCancel={() => setShowCreateForm(false)}
//                     />
//                   )}

//                   {!showCreateForm && (
//                     <>
//                       {/* Create Button */}
//                       <div className="flex justify-end">
//                         <button
//                           onClick={() => setShowCreateForm(true)}
//                           className="flex items-center gap-2 px-6 py-3 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
//                           style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}
//                         >
//                           <Plus size={18} />
//                           Create Application
//                         </button>
//                       </div>

//                       {/* Loading */}
//                       {loading && (
//                         <div className="text-center py-20">
//                           <div className="w-10 h-10 border-4 border-t-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#f0d5a8', borderTopColor: '#a36e24' }}></div>
//                           <p className="text-gray-600">Loading applications...</p>
//                         </div>
//                       )}

//                       {/* Error */}
//                       {!loading && error && (
//                         <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
//                           <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Applications</h3>
//                           <p className="text-red-600">{error}</p>
//                         </div>
//                       )}

//                       {/* Empty State */}
//                       {!loading && !error && applications.length === 0 && (
//                         <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
//                           <FileText size={60} className="mx-auto mb-6" style={{ color: '#c9943a' }} />
//                           <h2 className="text-2xl font-bold text-gray-800 mb-4">No Existing Applications Found</h2>
//                           <p className="text-gray-600">This customer doesn't have any existing applications yet.</p>
//                         </div>
//                       )}

//                       {/* Applications List */}
//                       {!loading && !error && applications.length > 0 && (
//                         <ApplicationsView
//                           userIdentifier={customerMobile}
//                           applications={applications}
//                           loading={loading}
//                           error={error}
//                           onApplicationsUpdate={setApplications}
//                         />
//                       )}
//                     </>
//                   )}
//                 </>
//               )}

//             </div>
//           )}

//           {currentPage === 'profile' && (
//             <div className="bg-white rounded-2xl shadow-lg p-8">
//               <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
//               <div className="space-y-6">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-3">Admin Username</label>
//                   <input
//                     type="text"
//                     value={loginData.username || 'admin'}
//                     disabled
//                     className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-900 opacity-60"
//                   />
//                 </div>
//                 <p className="text-gray-600 text-sm">
//                   More profile features coming soon...
//                 </p>
//               </div>
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   )
// }

import React, { useState, useEffect, useCallback } from 'react'
import { LogOut, Menu, X, FileText, Plus, Settings, Home, Search, Phone, Mail, AlertCircle, UserPlus, Loader }
  from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApplicationForm from '../components/ApplicationForm'
import ApplicationsView from '../components/ApplicationsView'
import CreateAccountPage from '../components/CreateAccountPage'
import { applicationsAPI, accountsAPI } from '../api/api'

export default function Dashboard({ loginData, onLogout }) {

  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState('applications')

  /* ---- Customer Search State ---- */
  const [searchType, setSearchType] = useState('mobile')
  const [searchValue, setSearchValue] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [customerFound, setCustomerFound] = useState(null)
  const [customerMobile, setCustomerMobile] = useState('')
  const [showCreateAccount, setShowCreateAccount] = useState(false)

  /* ---- Applications State ---- */
  const [applications, setApplications] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* ---- A key we bump to force ApplicationsView to re-mount & re-fetch ---- */
  const [refreshKey, setRefreshKey] = useState(0)

  /* ================================================================ */
  /*  FETCH APPLICATIONS                                              */
  /* ================================================================ */
  const fetchApplications = useCallback(async (mobile) => {
    if (!mobile) return
    try {
      setLoading(true)
      setError('')
      const response = await applicationsAPI.getApplicationsByUser(mobile)
      if (!response?.data?.applications) {
        setApplications([])
      } else {
        setApplications(response.data.applications)
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setApplications([])
      } else {
        setError('Failed to load applications')
        setApplications([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /* ================================================================ */
  /*  CUSTOMER SEARCH                                                 */
  /* ================================================================ */
  const handleSearchCustomer = async (e) => {
    e.preventDefault()
    setSearchError('')
    setCustomerFound(null)
    setApplications([])
    setError('')

    if (!searchValue.trim()) {
      setSearchError('Please enter a mobile number or email')
      return
    }

    if (searchType === 'mobile' && !/^[0-9]{10}$/.test(searchValue.trim())) {
      setSearchError('Please enter a valid 10-digit mobile number')
      return
    }

    setSearching(true)
    try {
      const payload = searchType === 'mobile'
        ? { mobile: searchValue.trim() }
        : { email: searchValue.trim() }

      const response = await accountsAPI.checkAccount(payload)

      if (response.data.exists) {
        const mobile = searchType === 'mobile' ? searchValue.trim() : (response.data.mobile || searchValue.trim())
        activateCustomer(mobile)
      } else {
        setCustomerFound(false)
      }
    } catch (err) {
      console.error('Error searching customer:', err)
      setCustomerFound(false)
    } finally {
      setSearching(false)
    }
  }

  /* ---- Helper: set a customer as active and fetch their apps ---- */
  const activateCustomer = useCallback((mobile) => {
    setCustomerFound(true)
    setCustomerMobile(mobile)
    setShowCreateAccount(false)
    setShowCreateForm(false)
    localStorage.setItem('user_mobile', mobile)
    localStorage.setItem('svs_gold_login_data', JSON.stringify({
      ...loginData,
      mobile,
      accountExists: true
    }))
    // Bump refresh key so ApplicationsView re-mounts with fresh data
    setRefreshKey(prev => prev + 1)
    fetchApplications(mobile)
  }, [loginData, fetchApplications])

  /* ================================================================ */
  /*  HANDLERS                                                        */
  /* ================================================================ */
  const handleClearCustomer = () => {
    setCustomerFound(null)
    setCustomerMobile('')
    setSearchValue('')
    setApplications([])
    setShowCreateForm(false)
    setShowCreateAccount(false)
    setError('')
    setSearchError('')
    localStorage.removeItem('user_mobile')
  }

  const handleCreateAccountForCustomer = () => {
    setShowCreateAccount(true)
  }

  const handleCreateAccountSuccess = () => {
    // Account was just created — activate customer and re-fetch
    const mobile = searchValue.trim()
    activateCustomer(mobile)
  }

  const handleApplicationSuccess = (newApplication) => {
    // Application was just created — close form and re-fetch from API for fresh data
    setShowCreateForm(false)
    // Re-fetch to get the complete, server-side application data
    setRefreshKey(prev => prev + 1)
    fetchApplications(customerMobile)
  }

  /* ================================================================ */
  /*  MENU                                                            */
  /* ================================================================ */
  const menuItems = [
    { id: 'applications', label: 'Applications', icon: FileText, color: 'text-amber-700' },
    { id: 'profile', label: 'Profile', icon: Settings, color: 'text-amber-700' }
  ]

  /* ================================================================ */
  /*  CREATE ACCOUNT VIEW                                             */
  /* ================================================================ */
  if (showCreateAccount) {
    const fakeLoginData = {
      mobile: searchType === 'mobile' ? searchValue.trim() : '',
      email: searchType === 'email' ? searchValue.trim() : ''
    }
    return (
      <CreateAccountPage
        loginData={fakeLoginData}
        onBackToLogin={() => setShowCreateAccount(false)}
        onSuccess={handleCreateAccountSuccess}
      />
    )
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="flex h-screen" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda, #fdf8f0)' }}>

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'}
        text-white transition-all duration-300 shadow-2xl overflow-hidden`}
        style={{ background: 'linear-gradient(180deg, #a36e24, #8b5c1c)' }}
      >
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

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${currentPage === item.id ? 'shadow-lg' : 'hover:bg-white/10'}`}
                  style={currentPage === item.id ? { background: 'rgba(255,255,255,0.2)' } : {}}
                >
                  <Icon size={20} className="text-amber-200" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              )
            })}
          </nav>

          {/* Toggle */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              {sidebarOpen && <span className="text-sm">Collapse</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="bg-white shadow-md px-8 py-5 flex items-center justify-between border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SVS Gold CRM
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Logged in as: <span className="font-medium text-gray-700">{loginData.username || 'Admin'}</span>
              {customerMobile && (
                <span className="ml-3 text-amber-700 font-medium">• Customer: {customerMobile}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <Home size={20} className="text-gray-600" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          {currentPage === 'applications' && (
            <div className="space-y-6">

              {/* ============================================================ */}
              {/*  CUSTOMER SEARCH PANEL                                       */}
              {/* ============================================================ */}
              {!customerFound && !showCreateForm && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Search Customer</h2>
                    <p className="text-gray-500 text-sm">Enter customer's mobile number or email to load their applications</p>
                  </div>

                  {/* Search Type Selector */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => { setSearchType('mobile'); setSearchValue(''); setSearchError(''); setCustomerFound(null) }}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                        searchType === 'mobile' ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={searchType === 'mobile' ? { background: 'linear-gradient(135deg, #c9943a, #a36e24)' } : {}}
                    >
                      <Phone size={18} />
                      Mobile
                    </button>
                    <button
                      onClick={() => { setSearchType('email'); setSearchValue(''); setSearchError(''); setCustomerFound(null) }}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                        searchType === 'email' ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={searchType === 'email' ? { background: 'linear-gradient(135deg, #c9943a, #a36e24)' } : {}}
                    >
                      <Mail size={18} />
                      Email
                    </button>
                  </div>

                  {/* Search Input */}
                  <form onSubmit={handleSearchCustomer} className="flex gap-4">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#a36e24' }}>
                        {searchType === 'mobile' ? <Phone size={20} /> : <Mail size={20} />}
                      </div>
                      <input
                        type={searchType === 'mobile' ? 'tel' : 'email'}
                        placeholder={searchType === 'mobile' ? 'Enter 10-digit mobile number' : 'Enter email address'}
                        value={searchValue}
                        onChange={(e) => { setSearchValue(e.target.value); setSearchError(''); setCustomerFound(null) }}
                        maxLength={searchType === 'mobile' ? 10 : undefined}
                        className="w-full pl-12 pr-4 py-4 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
                        onFocus={(e) => { e.target.style.borderColor = '#a36e24'; e.target.style.boxShadow = '0 0 0 4px rgba(163, 110, 36, 0.1)' }}
                        onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searching || !searchValue.trim()}
                      className="px-8 py-4 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', boxShadow: '0 4px 14px 0 rgba(163, 110, 36, 0.3)' }}
                    >
                      {searching ? <Loader size={20} className="animate-spin" /> : <Search size={20} />}
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </form>

                  {/* Search Error */}
                  {searchError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl mt-4">
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-sm text-red-700">{searchError}</span>
                    </div>
                  )}

                  {/* Customer Not Found */}
                  {customerFound === false && (
                    <div className="mt-6 p-6 border-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda)', borderColor: '#e4b96e' }}>
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle size={20} style={{ color: '#a36e24' }} className="flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6e4816' }}>
                            No account found for this {searchType === 'mobile' ? 'mobile number' : 'email'}.
                          </p>
                          <p className="text-xs mt-1" style={{ color: '#8b5c1c' }}>
                            Would you like to create a new customer account?
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCreateAccountForCustomer}
                        className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all"
                        style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', boxShadow: '0 4px 14px 0 rgba(163, 110, 36, 0.3)' }}
                      >
                        <UserPlus size={18} />
                        Create New Account
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/*  CUSTOMER FOUND — Show applications                          */}
              {/* ============================================================ */}
              {customerFound === true && (
                <>
                  {/* Active Customer Bar */}
                  <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0d5a8, #e4b96e)' }}>
                        <Phone size={18} style={{ color: '#6e4816' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Active Customer</p>
                        <p className="text-xs text-gray-500">{customerMobile}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleClearCustomer}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Change Customer
                    </button>
                  </div>

                  {showCreateForm && (
                    <ApplicationForm
                      userIdentifier={customerMobile}
                      onSuccess={handleApplicationSuccess}
                      onCancel={() => setShowCreateForm(false)}
                    />
                  )}

                  {!showCreateForm && (
                    <>
                      {/* Create Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="flex items-center gap-2 px-6 py-3 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                          style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}
                        >
                          <Plus size={18} />
                          Create Application
                        </button>
                      </div>

                      {/* Loading */}
                      {loading && (
                        <div className="text-center py-20">
                          <div className="w-10 h-10 border-4 border-t-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#f0d5a8', borderTopColor: '#a36e24' }}></div>
                          <p className="text-gray-600">Loading applications...</p>
                        </div>
                      )}

                      {/* Error */}
                      {!loading && error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Applications</h3>
                          <p className="text-red-600">{error}</p>
                        </div>
                      )}

                      {/* Empty State */}
                      {!loading && !error && applications.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                          <FileText size={60} className="mx-auto mb-6" style={{ color: '#c9943a' }} />
                          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Existing Applications Found</h2>
                          <p className="text-gray-600">This customer doesn't have any existing applications yet.</p>
                        </div>
                      )}

                      {/* Applications List — key forces re-mount on refresh */}
                      {!loading && !error && applications.length > 0 && (
                        <ApplicationsView
                          key={refreshKey}
                          userIdentifier={customerMobile}
                          applications={applications}
                          loading={loading}
                          error={error}
                          onApplicationsUpdate={setApplications}
                        />
                      )}
                    </>
                  )}
                </>
              )}

            </div>
          )}

          {currentPage === 'profile' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Admin Username</label>
                  <input
                    type="text"
                    value={loginData.username || 'admin'}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-900 opacity-60"
                  />
                </div>
                <p className="text-gray-600 text-sm">
                  More profile features coming soon...
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}