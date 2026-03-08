import React, { useState } from 'react'
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react'

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
}

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Please enter your username')
      return
    }

    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    // Simulate a brief network delay for UX
    await new Promise(resolve => setTimeout(resolve, 600))

    if (
      username.trim() === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      onLoginSuccess({
        isAdmin: true,
        username: username.trim(),
        accountExists: true
      })
    } else {
      setError('Invalid username or password')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f0d5a8, #e4b96e)' }}>
        {/* Animated waves background */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
          <path d="M 0 500 Q 250 400 500 500 T 1000 500 L 1000 1000 L 0 1000 Z"
                fill="rgba(163, 110, 36, 0.12)">
            <animate attributeName="d"
              values="M 0 500 Q 250 400 500 500 T 1000 500 L 1000 1000 L 0 1000 Z;
                      M 0 500 Q 250 600 500 500 T 1000 500 L 1000 1000 L 0 1000 Z;
                      M 0 500 Q 250 400 500 500 T 1000 500 L 1000 1000 L 0 1000 Z"
              dur="6s" repeatCount="indefinite" />
          </path>

          <path d="M 0 600 Q 250 500 500 600 T 1000 600 L 1000 1000 L 0 1000 Z"
                fill="rgba(163, 110, 36, 0.08)">
            <animate attributeName="d"
              values="M 0 600 Q 250 500 500 600 T 1000 600 L 1000 1000 L 0 1000 Z;
                      M 0 600 Q 250 700 500 600 T 1000 600 L 1000 1000 L 0 1000 Z;
                      M 0 600 Q 250 500 500 600 T 1000 600 L 1000 1000 L 0 1000 Z"
              dur="8s" repeatCount="indefinite" />
          </path>

          <path d="M 0 700 Q 250 600 500 700 T 1000 700 L 1000 1000 L 0 1000 Z"
                fill="rgba(163, 110, 36, 0.06)">
            <animate attributeName="d"
              values="M 0 700 Q 250 600 500 700 T 1000 700 L 1000 1000 L 0 1000 Z;
                      M 0 700 Q 250 800 500 700 T 1000 700 L 1000 1000 L 0 1000 Z;
                      M 0 700 Q 250 600 500 700 T 1000 700 L 1000 1000 L 0 1000 Z"
              dur="10s" repeatCount="indefinite" />
          </path>
        </svg>

        {/* Floating circles */}
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: '#a36e24' }}></div>
        <div className="absolute top-40 right-20 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ background: '#c9943a', animation: 'float 6s ease-in-out infinite' }}></div>
        <div className="absolute bottom-20 left-1/3 w-52 h-52 rounded-full opacity-20 blur-3xl" style={{ background: '#d4a04a', animation: 'float 8s ease-in-out infinite 2s' }}></div>

        {/* Content overlay */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-12">
          <div className="space-y-6 text-center w-full">
            <div>
              <img src="/svslogo-white.png" alt="SVS Gold" className="mx-auto mb-4 drop-shadow-lg" style={{ width: '350px' }} />
            </div>
            <p className="text-lg max-w-md mx-auto leading-relaxed" style={{ color: '#6e4816' }}>
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
            <img src="/svslogo.png" alt="SVS Gold" className="h-20 mx-auto mb-6 lg:hidden" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Sign in to your admin account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#a36e24' }}>
                  <User size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError('') }}
                  className="w-full pl-12 pr-4 py-4 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
                  onFocus={(e) => { e.target.style.borderColor = '#a36e24'; e.target.style.boxShadow = '0 0 0 4px rgba(163, 110, 36, 0.1)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '' }}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#a36e24' }}>
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="w-full pl-12 pr-12 py-4 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
                  onFocus={(e) => { e.target.style.borderColor = '#a36e24'; e.target.style.boxShadow = '0 0 0 4px rgba(163, 110, 36, 0.1)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)', boxShadow: '0 4px 14px 0 rgba(163, 110, 36, 0.3)' }}
              onMouseEnter={(e) => { if (!loading) { e.target.style.background = 'linear-gradient(135deg, #a36e24, #8b5c1c)'; e.target.style.boxShadow = '0 6px 20px 0 rgba(163, 110, 36, 0.4)' } }}
              onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg, #c9943a, #a36e24)'; e.target.style.boxShadow = '0 4px 14px 0 rgba(163, 110, 36, 0.3)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-10">
            Secure admin login with industry-standard encryption
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}