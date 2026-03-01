import React, { useState, useEffect } from 'react'
import { LogOut, Menu, X, FileText, Plus, Settings, Home }
  from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApplicationForm from '../components/ApplicationForm'
import ApplicationsView from '../components/ApplicationsView'
import { applicationsAPI } from '../api/api'

export default function Dashboard({ loginData, onLogout }) {

  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState('applications')
  const [applications, setApplications] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const userIdentifier = loginData.mobile || loginData.email

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await applicationsAPI.getApplicationsByUser(userIdentifier)

        if (!response?.data?.applications) {
          setApplications([])
        } else {
          setApplications(response.data.applications)
        }


      } catch (err) {
        console.error('Error fetching applications:', err)

        if (err.response?.status === 404) {
          setApplications([])
        } else {
          setError('Failed to load applications')
          setApplications([])
        }

      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [userIdentifier])

  const handleApplicationSuccess = (newApplication) => {
    setShowCreateForm(false)
    setApplications(prev => [newApplication, ...prev])
  }

  const menuItems = [
    {
      id: 'applications',
      label: 'Applications',
      icon: FileText,
      color: 'text-indigo-600'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: Settings,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'}
        bg-gradient-to-b from-indigo-600 to-indigo-700 text-white transition-all duration-300 shadow-2xl overflow-hidden`}
      >
        <div className="h-full flex flex-col">

          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-indigo-500/30">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText size={24} />
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
                  ${currentPage === item.id
                      ? 'bg-white/20 shadow-lg'
                      : 'hover:bg-white/10'
                    }`}
                >
                  <Icon size={20} className={item.color} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              )
            })}
          </nav>

          {/* Toggle */}
          <div className="p-4 border-t border-indigo-500/30">
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
        <header className="bg-white shadow-md px-8 py-6 flex items-center justify-between border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SVS Gold CRM
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {loginData.mobile && `Mobile: ${loginData.mobile}`}
              {loginData.email && `Email: ${loginData.email}`}
            </p>
          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate('/')}
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
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

              {showCreateForm && (
                <ApplicationForm
                  userIdentifier={userIdentifier}
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
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all"
                    >
                      <Plus size={18} />
                      Create Application
                    </button>
                  </div>

                  {/* Loading */}
                  {loading && (
                    <div className="text-center py-20">
                      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading applications...</p>
                    </div>
                  )}

                  {/* Error */}
                  {!loading && error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                      <h3 className="text-lg font-semibold text-red-700 mb-2">
                        Failed to Load Applications
                      </h3>
                      <p className="text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!loading && !error && applications.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                      <FileText size={60} className="mx-auto text-indigo-400 mb-6" />
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        No Existing Applications Found
                      </h2>
                      <p className="text-gray-600">
                        You don’t have any existing applications yet.
                      </p>
                    </div>
                  )}

                  {/* Applications List */}
                  {!loading && !error && applications.length > 0 && (
                    <ApplicationsView
                      userIdentifier={userIdentifier}
                      applications={applications}
                      loading={loading}
                      error={error}
                      onApplicationsUpdate={setApplications}
                    />
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
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {loginData.mobile ? 'Mobile Number' : 'Email Address'}
                  </label>
                  <input
                    type="text"
                    value={userIdentifier}
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
