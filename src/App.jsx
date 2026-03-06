// import React, { useState, useEffect } from 'react'
// import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
// import HomePage from './pages/HomePage'
// import LoginPage from './components/LoginPage'
// import CreateAccountPage from './components/CreateAccountPage'
// import Dashboard from './pages/Dashboard'
// import EstimationPage from './pages/EstimationPage'

// export default function App() {
//   const navigate = useNavigate()
//   const [loginData, setLoginData] = useState(null)
//   const [isLoading, setIsLoading] = useState(true)

//   // Restore login data ONLY (no auto redirect)
//   useEffect(() => {
//     try {
//       const storedLoginData = localStorage.getItem('svs_gold_login_data')
//       if (storedLoginData) {
//         const parsedData = JSON.parse(storedLoginData)
//         setLoginData(parsedData)
//       }
//     } catch (error) {
//       localStorage.removeItem('svs_gold_login_data')
//     } finally {
//       setIsLoading(false)
//     }
//   }, [])

//   const handleLoginSuccess = (data) => {
//     setLoginData(data)
//     localStorage.setItem('svs_gold_login_data', JSON.stringify(data))

//     if (data.accountExists) {
//       navigate('/dashboard')
//     } else {
//       navigate('/create-account')
//     }
//   }

//   const handleBackToLogin = () => {
//     navigate('/login')
//   }

//   const handleLogout = () => {
//     setLoginData(null)
//     localStorage.removeItem('svs_gold_login_data')
//     navigate('/login')
//   }

//   const handleCreateSuccess = () => {
//     const updatedData = {
//       ...loginData,
//       accountExists: true,
//       goToCreateAccount: false
//     }

//     setLoginData(updatedData)
//     localStorage.setItem('svs_gold_login_data', JSON.stringify(updatedData))
//     navigate('/dashboard')
//   }

//   if (isLoading) {
//     return <div className="min-h-screen flex items-center justify-center">Loading...</div>
//   }

//   return (
//     <Routes>

//       {/* Always show login as default */}
//       <Route path="/" element={<Navigate to="/login" replace />} />

//       {/* Login Page */}
//       <Route
//         path="/login"
//         element={
//           <LoginPage onLoginSuccess={handleLoginSuccess} />
//         }
//       />

//       {/* Create Account */}
//       <Route
//         path="/create-account"
//         element={
//           loginData && !loginData.accountExists
//             ? (
//               <CreateAccountPage
//                 loginData={loginData}
//                 onBackToLogin={handleBackToLogin}
//                 onSuccess={handleCreateSuccess}
//               />
//             )
//             : <Navigate to="/login" replace />
//         }
//       />

//       {/* Dashboard */}
//       <Route
//         path="/dashboard"
//         element={
//           loginData && loginData.accountExists
//             ? <Dashboard loginData={loginData} onLogout={handleLogout} />
//             : <Navigate to="/login" replace />
//         }
//       />

//       <Route path="/estimation" element={<EstimationPage />} />
//     </Routes>
//   )
// }


import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './components/LoginPage'
import CreateAccountPage from './components/CreateAccountPage'
import Dashboard from './pages/Dashboard'
import EstimationPage from './pages/EstimationPage'
import PaymentPage from './pages/Paymentpage'
import InvoicePreviewPage from './pages/InvoicePreviewPage'

export default function App() {
  const navigate = useNavigate()
  const [loginData, setLoginData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore login data ONLY (no auto redirect)
  useEffect(() => {
    try {
      const storedLoginData = localStorage.getItem('svs_gold_login_data')
      if (storedLoginData) {
        const parsedData = JSON.parse(storedLoginData)
        setLoginData(parsedData)
      }
    } catch (error) {
      localStorage.removeItem('svs_gold_login_data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // const handleLoginSuccess = (data) => {
  //   setLoginData(data)
  //   localStorage.setItem('svs_gold_login_data', JSON.stringify(data))
  //   localStorage.setItem("user_mobile", data.mobile)
  //   if (data.accountExists) {
  //     navigate('/dashboard')
  //   } else {
  //     navigate('/create-account')
  //   }
  // }

  const handleLoginSuccess = (data) => {
  setLoginData(data)

  localStorage.setItem('svs_gold_login_data', JSON.stringify(data))

  const mobileNumber = data?.mobile || data?.account?.mobile || ''

  if (mobileNumber) {
    localStorage.setItem("user_mobile", mobileNumber)
  } else {
    console.error("Mobile number missing in login response", data)
  }

  if (data.accountExists) {
    navigate('/dashboard')
  } else {
    navigate('/create-account')
  }
}

  const handleBackToLogin = () => {
    navigate('/login')
  }

  const handleLogout = () => {
    setLoginData(null)
    localStorage.removeItem('svs_gold_login_data')
    navigate('/login')
  }

  const handleCreateSuccess = () => {
    const updatedData = {
      ...loginData,
      accountExists: true,
      goToCreateAccount: false
    }

    setLoginData(updatedData)
    localStorage.setItem('svs_gold_login_data', JSON.stringify(updatedData))
    navigate('/dashboard')
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <Routes>

      {/* Always show login as default */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login Page */}
      <Route
        path="/login"
        element={
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        }
      />

      {/* Create Account */}
      <Route
        path="/create-account"
        element={
          loginData && !loginData.accountExists
            ? (
              <CreateAccountPage
                loginData={loginData}
                onBackToLogin={handleBackToLogin}
                onSuccess={handleCreateSuccess}
              />
            )
            : <Navigate to="/login" replace />
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          loginData && loginData.accountExists
            ? <Dashboard loginData={loginData} onLogout={handleLogout} />
            : <Navigate to="/login" replace />
        }
      />

      {/* Estimation */}
      <Route path="/estimation" element={<EstimationPage />} />

      {/* Payment */}
      <Route path="/payment" element={<PaymentPage />} />

      {/* Invoice Preview */}
      <Route path="/payment-preview" element={<InvoicePreviewPage />} />

    </Routes>
  )
}