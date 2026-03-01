import React, { useState } from 'react'
import { Mail, Phone, AlertCircle } from 'lucide-react'
import { validateMobile, validateEmail } from '../utils/validation'
import { accountsAPI } from '../api/api'

export default function LoginPage({ onLoginSuccess }) {
  const [loginType, setLoginType] = useState('mobile')
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accountExists, setAccountExists] = useState(null)

  const handleCheckAccount = async (e) => {
    e.preventDefault()
    setError('')
    setAccountExists(null)

    if (loginType === 'mobile' && !validateMobile(inputValue)) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    if (loginType === 'email' && !validateEmail(inputValue)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const data = loginType === 'mobile' 
        ? { mobile: inputValue }
        : { email: inputValue }
      
      const response = await accountsAPI.checkAccount(data)
      setAccountExists(response.data.exists || false)
      
      if (response.data.exists) {
        onLoginSuccess({
          [loginType]: inputValue,
          accountExists: true
        })
      }
    } catch (err) {
      console.error('Error checking account:', err)
      setError(err.response?.data?.message || 'Error checking account. Please try again.')
      setAccountExists(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = () => {
    onLoginSuccess({
      [loginType]: inputValue,
      accountExists: false,
      goToCreateAccount: true
    })
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side - Decorative Waves */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Animated waves background */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
          {/* Wave 1 */}
          <path d="M 0 500 Q 250 400 500 500 T 1000 500 L 1000 1000 L 0 1000 Z" 
                fill="rgba(99, 102, 241, 0.1)" 
                className="wave1">
            <animate attributeName="d" 
              values="M 0 500 Q 250 400 500 500 T 1000 500 L 1000 1000 L 0 1000 Z;
                      M 0 500 Q 250 600 500 500 T 1000 500 L 1000 1000 L 0 1000 Z;
                      M 0 500 Q 250 400 500 500 T 1000 500 L 1000 1000 L 0 1000 Z"
              dur="6s" repeatCount="indefinite" />
          </path>

          {/* Wave 2 */}
          <path d="M 0 600 Q 250 500 500 600 T 1000 600 L 1000 1000 L 0 1000 Z" 
                fill="rgba(147, 51, 234, 0.08)" 
                className="wave2">
            <animate attributeName="d" 
              values="M 0 600 Q 250 500 500 600 T 1000 600 L 1000 1000 L 0 1000 Z;
                      M 0 600 Q 250 700 500 600 T 1000 600 L 1000 1000 L 0 1000 Z;
                      M 0 600 Q 250 500 500 600 T 1000 600 L 1000 1000 L 0 1000 Z"
              dur="8s" repeatCount="indefinite" />
          </path>

          {/* Wave 3 */}
          <path d="M 0 700 Q 250 600 500 700 T 1000 700 L 1000 1000 L 0 1000 Z" 
                fill="rgba(59, 130, 246, 0.06)" 
                className="wave3">
            <animate attributeName="d" 
              values="M 0 700 Q 250 600 500 700 T 1000 700 L 1000 1000 L 0 1000 Z;
                      M 0 700 Q 250 800 500 700 T 1000 700 L 1000 1000 L 0 1000 Z;
                      M 0 700 Q 250 600 500 700 T 1000 700 L 1000 1000 L 0 1000 Z"
              dur="10s" repeatCount="indefinite" />
          </path>
        </svg>

        {/* Floating circles */}
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-indigo-200 opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-60 h-60 rounded-full bg-purple-200 opacity-20 blur-3xl" style={{ animation: 'float 6s ease-in-out infinite' }}></div>
        <div className="absolute bottom-20 left-1/3 w-52 h-52 rounded-full bg-blue-200 opacity-20 blur-3xl" style={{ animation: 'float 8s ease-in-out infinite 2s' }}></div>

        {/* Content overlay */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-12">
          <div className="space-y-6 text-center w-full">
            <div>
              <h2 className="text-6xl font-bold text-gray-800 mb-2">SVS Gold</h2>
              <p className="text-gray-600 text-sm font-medium">Your Gold, Our Promise.</p>
            </div>
            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
              Manage your accounts with elegance and efficiency
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your admin account</p>
          </div>

          {/* Login Type Selector */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => {
                setLoginType('mobile')
                setInputValue('')
                setError('')
                setAccountExists(null)
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loginType === 'mobile'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Phone size={20} />
              Mobile
            </button>
            <button
              onClick={() => {
                setLoginType('email')
                setInputValue('')
                setError('')
                setAccountExists(null)
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loginType === 'email'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail size={20} />
              Email
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleCheckAccount} className="space-y-6">
            {/* Input Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {loginType === 'mobile' ? 'Mobile Number' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  {loginType === 'mobile' ? <Phone size={20} /> : <Mail size={20} />}
                </div>
                <input
                  type={loginType === 'mobile' ? 'tel' : 'email'}
                  placeholder={loginType === 'mobile' ? '9876543210' : 'your@email.com'}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setError('')
                    setAccountExists(null)
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md"
                  maxLength={loginType === 'mobile' ? 10 : undefined}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Check Button */}
            <button
              type="submit"
              disabled={loading || !inputValue}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-600/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          {/* Account Not Found */}
          {accountExists === false && (
            <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 mb-4 font-medium">
                Account doesn't exist. Please create a new account to get started.
              </p>
              <button
                onClick={handleCreateAccount}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-amber-500/30"
              >
                Create New Account
              </button>
            </div>
          )}

          {/* Account Found */}
          {accountExists === true && (
            <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-green-800 font-medium">
                  Account verified! Proceeding to dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-10">
            Secure login with industry-standard encryption
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  )
}


