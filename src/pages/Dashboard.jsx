import React, { useState, useEffect, useCallback } from 'react'
import { LogOut, Menu, X, FileText, Plus, Settings, Home, Search, Phone, Mail, AlertCircle, UserPlus, Loader, Save, DollarSign, Calculator }
  from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApplicationForm from '../components/ApplicationForm'
import ApplicationsView from '../components/ApplicationsView'
import CreateAccountPage from '../components/CreateAccountPage'
import { applicationsAPI, accountsAPI, transactionsAPI } from '../api/api'

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
  const [branchFilter, setBranchFilter] = useState('')
  const [branches, setBranches] = useState([])

  // Fetch branches from API
  useEffect(() => {
    (async () => {
      try {
        const res = await applicationsAPI.getBranches()
        const b = res.data?.branches || []
        if (b.length > 0) setBranches(b)
      } catch {}
    })()
  }, [])

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
    setCurrentPage('applications')
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
    setBranchFilter('')
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
    ...(customerFound ? [{ id: 'estimations', label: 'Estimations', icon: Calculator, color: 'text-amber-700' }] : []),
    { id: 'transactions', label: 'Transactions', icon: DollarSign, color: 'text-amber-700' },
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
                      {/* Branch Filter + Create Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-semibold text-gray-600">Filter by Branch:</label>
                          <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-amber-500 transition-all"
                          >
                            <option value="">All Branches</option>
                            {(() => {
                              // Merge: unique branch names from applications + API branches
                              const appBranches = [...new Set(applications.map(a => a.place).filter(Boolean))]
                              const apiBranches = branches.map(b => b.branch_name)
                              const allNames = [...new Set([...appBranches, ...apiBranches])]
                              return allNames.map(name => <option key={name} value={name}>{name}</option>)
                            })()}
                          </select>
                          {branchFilter && (
                            <button onClick={() => setBranchFilter('')} className="text-xs text-amber-700 hover:text-amber-800 font-medium underline">Clear</button>
                          )}
                        </div>
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
                      {!loading && !error && (() => {
                        const filtered = branchFilter
                          ? applications.filter(a => a.place === branchFilter)
                          : applications
                        return filtered.length === 0 ? (
                          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <FileText size={60} className="mx-auto mb-6" style={{ color: '#c9943a' }} />
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                              {branchFilter ? `No Applications for ${branchFilter}` : 'No Existing Applications Found'}
                            </h2>
                            <p className="text-gray-600">
                              {branchFilter ? 'Try selecting a different branch or clear the filter.' : "This customer doesn't have any existing applications yet."}
                            </p>
                          </div>
                        ) : (
                          <ApplicationsView
                            key={`${refreshKey}-${branchFilter}`}
                            userIdentifier={customerMobile}
                            applications={filtered}
                            loading={loading}
                            error={error}
                            onApplicationsUpdate={setApplications}
                          />
                        )
                      })()}
                    </>
                  )}
                </>
              )}

            </div>
          )}

          {currentPage === 'profile' && (
            <ProfileSection customerMobile={customerMobile} loginData={loginData} />
          )}

          {currentPage === 'transactions' && (
            <TransactionsSection customerMobile={customerMobile} />
          )}

          {currentPage === 'estimations' && customerFound && (
            <EstimationsSection customerMobile={customerMobile} />
          )}
        </main>
      </div>
    </div>
  )
}

/* ================================================================ */
/*  PROFILE SECTION — View & Edit Account Details                   */
/* ================================================================ */
function ProfileSection({ customerMobile, loginData }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({})
  const [editAddresses, setEditAddresses] = useState([])
  const [editBanks, setEditBanks] = useState([])
  const [editDocs, setEditDocs] = useState([])

  const isAdmin = loginData?.username === 'admin' || loginData?.isAdmin

  const loadData = async () => {
    setLoading(true); setError('')
    try {
      const res = await accountsAPI.searchCustomer(customerMobile)
      const d = res.data || {}
      setData(d)
      setForm({ ...(d.customer || {}) })
      setEditAddresses(JSON.parse(JSON.stringify(d.addresses || [])))
      setEditBanks(JSON.parse(JSON.stringify(d.bank_accounts || [])))
      setEditDocs(JSON.parse(JSON.stringify(d.documents || [])))
    } catch {
      try {
        const res2 = await accountsAPI.checkAccount({ mobile: customerMobile })
        const acc = res2.data?.account || res2.data || {}
        setData({ customer: acc, addresses: [], bank_accounts: [], documents: [] })
        setForm({ ...acc })
        setEditAddresses([]); setEditBanks([]); setEditDocs([])
      } catch { setError('Could not load account details') }
    } finally { setLoading(false) }
  }

  useEffect(() => { if (customerMobile) loadData() }, [customerMobile])

  const handleChange = (f, v) => { setForm(p => ({ ...p, [f]: v })); setSuccess('') }
  const handleAddrChange = (i, f, v) => { setEditAddresses(prev => { const u = [...prev]; u[i] = { ...u[i], [f]: v }; return u }) }
  const handleBankChange = (i, f, v) => { setEditBanks(prev => { const u = [...prev]; u[i] = { ...u[i], [f]: v }; return u }) }

  const handleDocUpload = (index, file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      setEditDocs(prev => {
        const u = [...prev]
        u[index] = { ...u[index], file_path: e.target.result, file_name: file.name, file_size_mb: (file.size / (1024 * 1024)).toFixed(2), _newFile: true }
        return u
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      // 1. Update account — ensure aadhar_no is string
      await accountsAPI.updateAccount({
        account_type: form.account_type || '', account_code: form.account_code || '',
        first_name: form.first_name || '', last_name: form.last_name || '',
        mobile: form.mobile || customerMobile, phone: form.phone || '',
        email: form.email || '', gender: form.gender || '',
        date_of_birth: form.date_of_birth || '',
        aadhar_no: String(form.aadhar_no || ''),
        occupation: form.occupation || '',
        pan_no: String(form.pan_no || ''),
        source: form.source || 'web', owner: form.owner || 'admin',
        state: form.state || '', district: form.district || '',
        city: form.city || '', pincode: form.pincode || '',
        address_text: form.address_text || ''
      })

      // 2. Re-save addresses (POST overwrites)
      for (const addr of editAddresses) {
        try {
          await accountsAPI.addAddress(customerMobile, {
            address_type: addr.address_type || '', address_line: addr.address_line || '',
            street: addr.street || '', city: addr.city || '',
            state: addr.state || '', country: addr.country || 'India',
            pincode: addr.pincode || ''
          })
        } catch (e) { console.log('Address save error:', e) }
      }

      // 3. Re-save bank accounts (POST overwrites)
      for (const bank of editBanks) {
        try {
          await accountsAPI.addBankAccount(customerMobile, {
            bank_name: bank.bank_name || '', branch: bank.branch || '',
            account_number: bank.account_number || '', ifsc_code: bank.ifsc_code || '',
            account_holder_name: bank.account_holder_name || '',
            account_holder_type: bank.account_holder_type || 'Self',
            is_primary: bank.is_primary || false
          })
        } catch (e) { console.log('Bank save error:', e) }
      }

      // 4. Re-save documents that were changed
      for (const doc of editDocs) {
        if (doc._newFile && doc.file_path) {
          try {
            await accountsAPI.addDocument(customerMobile, {
              document_type: doc.document_type || '',
              document_number: doc.document_number || '',
              file_path: doc.file_path || '',
              file_name: doc.file_name || '',
              file_size_mb: parseFloat(doc.file_size_mb) || 0
            })
          } catch (e) { console.log('Document save error:', e) }
        }
      }

      setEditing(false)
      setSuccess('All details updated successfully!')
      // Reload fresh data
      await loadData()
    } catch (err) { setError(err.response?.data?.message || 'Failed to update account') }
    finally { setSaving(false) }
  }

  const handleCancel = () => {
    setForm({ ...(data?.customer || {}) })
    setEditAddresses(JSON.parse(JSON.stringify(data?.addresses || [])))
    setEditBanks(JSON.parse(JSON.stringify(data?.bank_accounts || [])))
    setEditDocs(JSON.parse(JSON.stringify(data?.documents || [])))
    setEditing(false); setError('')
  }

  const ic = 'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all shadow-sm hover:shadow-md hover:border-gray-300'
  const rc = 'w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-700 font-medium'
  const lc = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide'

  if (!customerMobile) return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <Settings size={48} className="mx-auto mb-4 text-amber-300" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">No Customer Selected</h2>
      <p className="text-gray-500">Search for a customer first to view their profile.</p>
    </div>
  )
  if (loading) return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <Loader size={36} className="animate-spin mx-auto mb-4 text-amber-600" />
      <p className="text-gray-600">Loading customer details...</p>
    </div>
  )

  const cust = data?.customer || {}
  const addresses = editing ? editAddresses : (data?.addresses || [])
  const banks = editing ? editBanks : (data?.bank_accounts || [])
  const docs = data?.documents || []
  const d = editing ? form : cust

  const Field = ({ label, field, disabled, type }) => (
    <div>
      <label className={lc}>{label}</label>
      {editing && !disabled ? (
        <input type={type || 'text'} value={d[field] != null ? String(d[field]) : ''} onChange={e => handleChange(field, e.target.value)} className={ic} />
      ) : (
        <div className={rc}>{d[field] != null ? String(d[field]) : '—'}</div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Profile</h2>
          <p className="text-gray-500 text-sm mt-1">{cust.first_name} {cust.last_name} • {customerMobile}</p>
        </div>
        {isAdmin && !editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl text-sm" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}>
            <Settings size={16} /> Edit Details
          </button>
        )}
      </div>

      {success && <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-sm text-green-700 font-medium">{success}</div>}
      {error && <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>}

      {/* Account Info */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
        <h3 className="text-lg font-bold text-gray-800 pb-3 border-b border-gray-100">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Account Type" field="account_type" />
          <Field label="Account Code" field="account_code" disabled />
          <Field label="Mobile" field="mobile" disabled />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="First Name" field="first_name" />
          <Field label="Last Name" field="last_name" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Email" field="email" />
          <Field label="Gender" field="gender" />
          <Field label="Date of Birth" field="date_of_birth" type="date" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Aadhar No" field="aadhar_no" />
          <Field label="PAN No" field="pan_no" />
          <Field label="Occupation" field="occupation" />
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
        <h3 className="text-lg font-bold text-gray-800 pb-3 border-b border-gray-100">Addresses ({addresses.length})</h3>
        {addresses.length === 0 ? <p className="text-gray-400 text-sm">No addresses on file.</p> : (
          <div className="space-y-4">
            {addresses.map((addr, i) => (
              <div key={addr.address_id || i} className={`p-5 rounded-xl border ${editing ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{addr.address_type}</span>
                </div>
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className={lc}>Address Line</label>
                      <input value={addr.address_line || ''} onChange={e => handleAddrChange(i, 'address_line', e.target.value)} className={ic} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className={lc}>Street</label><input value={addr.street || ''} onChange={e => handleAddrChange(i, 'street', e.target.value)} className={ic} /></div>
                      <div><label className={lc}>Pincode</label><input value={addr.pincode || ''} onChange={e => handleAddrChange(i, 'pincode', e.target.value)} className={ic} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div><label className={lc}>City</label><input value={addr.city || ''} onChange={e => handleAddrChange(i, 'city', e.target.value)} className={ic} /></div>
                      <div><label className={lc}>State</label><input value={addr.state || ''} onChange={e => handleAddrChange(i, 'state', e.target.value)} className={ic} /></div>
                      <div><label className={lc}>Country</label><input value={addr.country || 'India'} disabled className={`${ic} opacity-60`} /></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-800 font-medium">{addr.address_line || '—'}</p>
                    {addr.street && <p className="text-sm text-gray-600">{addr.street}</p>}
                    <p className="text-sm text-gray-600">{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                    <p className="text-xs text-gray-400 mt-1">{addr.country || 'India'}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank Accounts */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
        <h3 className="text-lg font-bold text-gray-800 pb-3 border-b border-gray-100">Bank Accounts ({banks.length})</h3>
        {banks.length === 0 ? <p className="text-gray-400 text-sm">No bank accounts on file.</p> : (
          <div className="space-y-4">
            {banks.map((bank, i) => (
              <div key={bank.bank_account_id || i} className={`p-5 rounded-xl border ${editing ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{editing ? '' : (bank.bank_name || '—')}</span>
                    {bank.is_primary && <span className="text-xs text-white px-2 py-0.5 rounded-full font-medium" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}>Primary</span>}
                  </div>
                </div>
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className={lc}>Bank Name</label><input value={bank.bank_name || ''} onChange={e => handleBankChange(i, 'bank_name', e.target.value)} className={ic} /></div>
                      <div><label className={lc}>Branch</label><input value={bank.branch || ''} onChange={e => handleBankChange(i, 'branch', e.target.value)} className={ic} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className={lc}>Account Number</label><input value={bank.account_number || ''} onChange={e => handleBankChange(i, 'account_number', e.target.value)} className={ic} /></div>
                      <div><label className={lc}>IFSC Code</label><input value={bank.ifsc_code || ''} onChange={e => handleBankChange(i, 'ifsc_code', e.target.value.toUpperCase())} className={ic} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className={lc}>Account Holder Name</label><input value={bank.account_holder_name || ''} onChange={e => handleBankChange(i, 'account_holder_name', e.target.value)} className={ic} /></div>
                      <div><label className={lc}>Holder Type</label>
                        <select value={bank.account_holder_type || 'Self'} onChange={e => handleBankChange(i, 'account_holder_type', e.target.value)} className={ic}>
                          {['Self','Spouse','Business Partner','Parent','Child','Other'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-xs text-gray-400 block">Account No</span><span className="font-medium text-gray-700">{bank.account_number || '—'}</span></div>
                    <div><span className="text-xs text-gray-400 block">IFSC</span><span className="font-medium text-gray-700">{bank.ifsc_code || '—'}</span></div>
                    <div><span className="text-xs text-gray-400 block">Branch</span><span className="font-medium text-gray-700">{bank.branch || '—'}</span></div>
                    <div><span className="text-xs text-gray-400 block">Holder</span><span className="font-medium text-gray-700">{bank.account_holder_name || '—'}</span></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents (view only) */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
        <h3 className="text-lg font-bold text-gray-800 pb-3 border-b border-gray-100">Documents ({docs.length})</h3>
        {docs.length === 0 ? <p className="text-gray-400 text-sm">No documents uploaded.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc, i) => (
              <div key={doc.document_id || i} className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><FileText size={16} className="text-green-600" /></div>
                  <span className="font-semibold text-gray-800 text-sm">{doc.document_type}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-green-100">
                  <FileText size={12} className="text-green-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700 truncate flex-1">{doc.file_name || 'Uploaded'}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{doc.file_size_mb ? `${doc.file_size_mb}MB` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Actions */}
      {editing && (
        <div className="flex justify-center gap-4">
          <button onClick={handleCancel} className="px-8 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-10 py-2.5 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2 text-sm" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}>
            {saving ? <><Loader size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      )}
    </div>
  )
}

/* ================================================================ */
/*  TRANSACTIONS SECTION — Admin-only, all users                    */
/* ================================================================ */
function TransactionsSection({ customerMobile }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [days, setDays] = useState(30)
  const [mobileInput, setMobileInput] = useState(customerMobile || '')

  const loadTransactions = async (mobile, numDays) => {
    setLoading(true); setError('')
    try {
      let url = `https://svs-gold-1.onrender.com/transactions/all?days=${numDays}`
      if (mobile?.trim()) url += `&mobile=${mobile.trim()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) { setError('Failed to load transactions: ' + e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    setMobileInput(customerMobile || '')
    loadTransactions(customerMobile || '', days)
  }, [customerMobile])

  const handleSearch = () => loadTransactions(mobileInput, days)
  const cur = (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '₹0.00'

  const invoices = data?.invoices || []
  const invoiceItems = data?.invoice_items || []
  const settlements = data?.settlements || []
  const summary = data?.summary || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{customerMobile ? `Transactions — ${customerMobile}` : 'All Transactions'}</h2>
        <p className="text-gray-500 text-sm mt-1">{customerMobile ? 'Customer invoice history' : 'Admin view — all users\' invoices and settlements'}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Period</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))} className="px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-500">
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
          <button onClick={handleSearch} disabled={loading} className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}>
            {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="text-center py-16">
          <Loader size={36} className="animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0d5a8, #e4b96e)' }}>
                  <FileText size={20} style={{ color: '#6e4816' }} />
                </div>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Invoices</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.total_invoices || invoices.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c5e1f5, #7ab5e0)' }}>
                  <DollarSign size={20} className="text-blue-700" />
                </div>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Invoice Amount</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{cur(summary.total_invoice_amount)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c5f5d0, #6ddb8a)' }}>
                  <Save size={20} className="text-green-700" />
                </div>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Settled Amount</span>
              </div>
              <p className="text-3xl font-bold text-green-700">{cur(summary.total_settled_amount)}</p>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda)' }}>
              <h3 className="text-lg font-bold text-gray-800">Invoices ({invoices.length})</h3>
            </div>
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No invoices found for this period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">Invoice No</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">Date</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">App ID</th>
                      <th className="px-5 py-3 text-right font-semibold text-gray-500 uppercase tracking-wide text-xs">Total Amount</th>
                      <th className="px-5 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <tr key={inv.payment_invoice_id || i} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-800">{inv.invoice_no}</td>
                        <td className="px-5 py-4 text-gray-600">{inv.invoice_date}</td>
                        <td className="px-5 py-4 text-gray-600">{inv.application_id || '—'}</td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-800">{cur(inv.total_net_amount)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            inv.payment_status === 'PAID' ? 'bg-green-100 text-green-700 border border-green-200' :
                            inv.payment_status === 'PENDING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>{inv.payment_status || 'DRAFT'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          {invoiceItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #f0f6fb, #dce8f4)' }}>
                <h3 className="text-lg font-bold text-gray-800">Invoice Items ({invoiceItems.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">Item</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Wt Before</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Wt After</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Purity %</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Rate/gm</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-500 uppercase tracking-wide text-xs">Gross Amt</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Ded %</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-500 uppercase tracking-wide text-xs">Net Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((it, i) => (
                      <tr key={it.invoice_item_id || i} className="border-b border-gray-50 hover:bg-blue-50/20">
                        <td className="px-4 py-3 font-medium text-gray-800">{it.item_name}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{it.weight_before_melting}g</td>
                        <td className="px-4 py-3 text-center text-gray-600">{it.weight_after_melting}g</td>
                        <td className="px-4 py-3 text-center text-gray-600">{it.purity_after_melting}%</td>
                        <td className="px-4 py-3 text-center text-gray-600">{cur(it.gold_rate_per_gm)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{cur(it.gross_amount)}</td>
                        <td className="px-4 py-3 text-center text-red-600">{it.deduction_percentage}%</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{cur(it.net_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settlements */}
          {settlements.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
                <h3 className="text-lg font-bold text-gray-800">Settlements ({settlements.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">Payment Mode</th>
                      <th className="px-5 py-3 text-right font-semibold text-gray-500 uppercase tracking-wide text-xs">Paid Amount</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">Date</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((s, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800">{s.payment_mode}</td>
                        <td className="px-5 py-3 text-right font-semibold text-green-700">{cur(s.paid_amount)}</td>
                        <td className="px-5 py-3 text-gray-600">{s.payment_date}</td>
                        <td className="px-5 py-3 text-gray-600">{s.reference_no || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ================================================================ */
/*  ESTIMATIONS SECTION — Shows all estimations for a customer      */
/* ================================================================ */
function EstimationsSection({ customerMobile }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!customerMobile) return
    const load = async () => {
      setLoading(true); setError('')
      try {
        const res = await fetch(`https://svs-gold-1.onrender.com/estimations/by-user?mobile=${customerMobile}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (e) { setError('Failed to load estimations: ' + e.message) }
      finally { setLoading(false) }
    }
    load()
  }, [customerMobile])

  const cur = (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '₹0.00'

  if (!customerMobile) return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <Calculator size={48} className="mx-auto mb-4 text-amber-300" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">No Customer Selected</h2>
      <p className="text-gray-500">Search for a customer to view their estimations.</p>
    </div>
  )

  if (loading) return (
    <div className="text-center py-20">
      <Loader size={36} className="animate-spin mx-auto mb-4 text-amber-600" />
      <p className="text-gray-600">Loading estimations...</p>
    </div>
  )

  const estimations = data?.estimations || []
  const totalAmount = estimations.reduce((s, e) => s + (parseFloat(e.total_net_amount) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Estimations</h2>
          <p className="text-gray-500 text-sm mt-1">Customer: {customerMobile} — {estimations.length} estimation{estimations.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0d5a8, #e4b96e)' }}>
              <FileText size={20} style={{ color: '#6e4816' }} />
            </div>
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Estimations</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{estimations.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c5e1f5, #7ab5e0)' }}>
              <DollarSign size={20} className="text-blue-700" />
            </div>
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Estimated Value</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{cur(totalAmount)}</p>
        </div>
      </div>

      {/* Estimations List */}
      {estimations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-100">
          <Calculator size={48} className="mx-auto mb-4 text-amber-200" />
          <p className="text-gray-400">No estimations found for this customer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {estimations.map((est) => {
            const isExpanded = expandedId === est.estimation_id
            const items = est.items || []
            return (
              <div key={est.estimation_id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all">
                {/* Estimation Header */}
                <button onClick={() => setExpandedId(isExpanded ? null : est.estimation_id)} className="w-full flex items-center justify-between p-6 hover:bg-amber-50/30 transition-colors text-left">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f0d5a8, #e4b96e)' }}>
                      <Calculator size={22} style={{ color: '#6e4816' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">{est.estimation_no}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          est.status === 'ESTIMATED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>{est.status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
                        <span>{est.estimation_date}</span>
                        <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xl font-bold text-amber-800">{cur(est.total_net_amount)}</p>
                    <p className="text-xs text-gray-400 mt-1">{isExpanded ? '▲ Collapse' : '▼ View Items'}</p>
                  </div>
                </button>

                {/* Expanded Items */}
                {isExpanded && items.length > 0 && (
                  <div className="border-t border-gray-100 px-6 pb-6">
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs">Item</th>
                            <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Qty</th>
                            <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Gross Wt</th>
                            <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Stone Wt</th>
                            <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Net Wt</th>
                            <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Rate/gm</th>
                            <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Purity</th>
                            <th className="px-3 py-2.5 text-right font-semibold text-gray-500 uppercase tracking-wide text-xs">Gross Amt</th>
                            <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide text-xs">Ded %</th>
                            <th className="px-3 py-2.5 text-right font-semibold text-gray-500 uppercase tracking-wide text-xs">Net Amt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, i) => (
                            <tr key={it.estimation_item_id || i} className="border-b border-gray-50">
                              <td className="px-3 py-3 font-medium text-gray-800">{it.item_name}</td>
                              <td className="px-3 py-3 text-center text-gray-600">{it.quantity}</td>
                              <td className="px-3 py-3 text-center text-gray-600">{it.gross_weight_gms}g</td>
                              <td className="px-3 py-3 text-center text-gray-600">{it.stone_weight_gms || 0}g</td>
                              <td className="px-3 py-3 text-center text-gray-600">{it.net_weight_gms}g</td>
                              <td className="px-3 py-3 text-center text-gray-600">{cur(it.gold_rate_per_gm)}</td>
                              <td className="px-3 py-3 text-center text-gray-600">{it.purity_percentage}%</td>
                              <td className="px-3 py-3 text-right text-gray-700">{cur(it.gross_amount)}</td>
                              <td className="px-3 py-3 text-center text-red-600">{it.deduction_percentage}%</td>
                              <td className="px-3 py-3 text-right font-semibold text-gray-800">{cur(it.net_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}