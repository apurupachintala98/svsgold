import React from 'react'

export default function HomePage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl"></div>
      </div>

      {/* Home Content */}
      <div className="relative text-center max-w-2xl">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">Gold CRM</h1>
        <p className="text-2xl text-gray-600 mb-8">Professional Account Management System</p>
        <p className="text-lg text-gray-600 mb-12">
          Manage your accounts, addresses, bank details, and documents all in one place
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            onClick={() => onNavigate('/login')}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            Admin Login
          </button>
          <button
            onClick={() => onNavigate('/create-account')}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
