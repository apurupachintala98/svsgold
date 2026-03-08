import React from 'react'

export default function HomePage({ onNavigate }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #fdf8f0, #f9edda, #fdf8f0)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl" style={{ background: '#a36e24' }}></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full blur-3xl" style={{ background: '#c9943a' }}></div>
      </div>

      {/* Home Content */}
      <div className="relative text-center max-w-2xl">
        <img src="/svslogo.png" alt="SVS Gold" className="h-32 mx-auto mb-6 drop-shadow-lg" />
        <h1 className="text-6xl font-bold text-gray-900 mb-4">Gold CRM</h1>
        <p className="text-2xl text-gray-600 mb-8">Professional Account Management System</p>
        <p className="text-lg text-gray-600 mb-12">
          Manage your accounts, addresses, bank details, and documents all in one place
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            onClick={() => onNavigate('/login')}
            className="px-8 py-4 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #c9943a, #a36e24)' }}
          >
            Admin Login
          </button>
          <button
            onClick={() => onNavigate('/create-account')}
            className="px-8 py-4 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #a36e24, #8b5c1c)' }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}