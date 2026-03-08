import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import Dashboard from './pages/Dashboard'
import EstimationPage from './pages/EstimationPage'
import PaymentPage from './pages/Paymentpage'
import InvoicePreviewPage from './pages/InvoicePreviewPage'

export default function App() {
  const navigate = useNavigate()
  const [loginData, setLoginData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore login data on mount
  useEffect(() => {
    try {
      const storedLoginData = localStorage.getItem('svs_gold_login_data')
      if (storedLoginData) {
        const parsedData = JSON.parse(storedLoginData)
        // Only restore if it's an admin session
        if (parsedData.isAdmin) {
          setLoginData(parsedData)
        } else {
          localStorage.removeItem('svs_gold_login_data')
        }
      }
    } catch (error) {
      localStorage.removeItem('svs_gold_login_data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleLoginSuccess = (data) => {
    setLoginData(data)
    localStorage.setItem('svs_gold_login_data', JSON.stringify(data))
    navigate('/dashboard')
  }

  const handleLogout = () => {
    setLoginData(null)
    localStorage.removeItem('svs_gold_login_data')
    localStorage.removeItem('user_mobile')
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#f0d5a8', borderTopColor: '#a36e24' }}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>

      {/* Default → Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin Login */}
      <Route
        path="/login"
        element={
          loginData?.isAdmin
            ? <Navigate to="/dashboard" replace />
            : <LoginPage onLoginSuccess={handleLoginSuccess} />
        }
      />

      {/* Dashboard — admin must be logged in */}
      <Route
        path="/dashboard"
        element={
          loginData?.isAdmin
            ? <Dashboard loginData={loginData} onLogout={handleLogout} />
            : <Navigate to="/login" replace />
        }
      />

      {/* Estimation */}
      <Route
        path="/estimation"
        element={
          loginData?.isAdmin
            ? <EstimationPage />
            : <Navigate to="/login" replace />
        }
      />

      {/* Payment */}
      <Route
        path="/payment"
        element={
          loginData?.isAdmin
            ? <PaymentPage />
            : <Navigate to="/login" replace />
        }
      />

      {/* Invoice Preview */}
      <Route
        path="/payment-preview"
        element={
          loginData?.isAdmin
            ? <InvoicePreviewPage />
            : <Navigate to="/login" replace />
        }
      />

    </Routes>
  )
}