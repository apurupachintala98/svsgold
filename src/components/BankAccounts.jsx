import React, { useState } from 'react'
import { ChevronDown, Plus, Trash2, AlertCircle } from 'lucide-react'
import { validateAccountNumber, validateIFSC } from '../utils/validation'

export default function BankAccounts({ isOpen, onToggle, data, onDataChange }) {
  const [bankAccounts, setBankAccounts] = useState(data.bank_accounts || [])
  const [errors, setErrors] = useState({})

  const accountHolderTypes = ['Self', 'Spouse', 'Business Partner', 'Parent', 'Child', 'Other']

  const handleBankChange = (index, field, value) => {
    const newAccounts = [...bankAccounts]
    newAccounts[index] = {
      ...newAccounts[index],
      [field]: value
    }
    setBankAccounts(newAccounts)
    onDataChange('bank_accounts', newAccounts)
    validateBankField(index, field, value)
  }

  const validateBankField = (index, field, value) => {
    const newErrors = { ...errors }
    const key = `bank_${index}_${field}`

    switch (field) {
      case 'account_number':
        newErrors[key] = value && !validateAccountNumber(value) ? 'Invalid account number (9-18 digits)' : ''
        break
      case 'ifsc_code':
        newErrors[key] = value && !validateIFSC(value) ? 'Invalid IFSC code format (e.g., SBIN0001234)' : ''
        break
      default:
        newErrors[key] = ''
    }

    setErrors(newErrors)
  }

  const addNewBank = () => {
    const newBank = {
      id: Date.now(),
      bank_name: '',
      branch: '',
      account_number: '',
      ifsc_code: '',
      account_holder_name: '',
      account_holder_type: 'Self',
      is_primary: bankAccounts.length === 0
    }
    setBankAccounts([...bankAccounts, newBank])
  }

  const removeBank = (index) => {
    const newAccounts = bankAccounts.filter((_, i) => i !== index)
    setBankAccounts(newAccounts)
    onDataChange('bank_accounts', newAccounts)
  }

  const togglePrimary = (index) => {
    const newAccounts = bankAccounts.map((acc, i) => ({
      ...acc,
      is_primary: i === index
    }))
    setBankAccounts(newAccounts)
    onDataChange('bank_accounts', newAccounts)
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300"
      >
        <span className="text-lg font-semibold text-gray-800">Bank Accounts</span>
        <div className="p-2 bg-indigo-50 rounded-lg">
          <ChevronDown
            size={24}
            className={`text-indigo-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="accordion-content space-y-6 px-6 py-6 bg-gradient-to-b from-white/50 to-indigo-50/30 border-t border-white/50">
          {bankAccounts.length === 0 ? (
            <button
              onClick={addNewBank}
              className="w-full py-3 border-2 border-dashed border-indigo-400 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add First Bank Account
            </button>
          ) : (
            bankAccounts.map((bank, index) => (
              <div key={bank.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border-2 border-indigo-100/50 space-y-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Bank Account {index + 1}
                      {bank.is_primary && <span className="ml-3 text-xs bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-3 py-1 rounded-full">Primary</span>}
                    </h3>
                  </div>
                  <button
                    onClick={() => removeBank(index)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-800 transition-all duration-300"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Bank Name and Branch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bank.bank_name}
                      onChange={(e) => handleBankChange(index, 'bank_name', e.target.value)}
                      placeholder="e.g., State Bank of India"
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={bank.branch}
                      onChange={(e) => handleBankChange(index, 'branch', e.target.value)}
                      placeholder="Branch name"
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300"
                    />
                  </div>
                </div>

                {/* Account Number and IFSC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bank.account_number}
                      onChange={(e) => handleBankChange(index, 'account_number', e.target.value)}
                      placeholder="9-18 digit account number"
                      className={`w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md ${errors[`bank_${index}_account_number`] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500'}`}
                    />
                    {errors[`bank_${index}_account_number`] && (
                      <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors[`bank_${index}_account_number`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={bank.ifsc_code}
                      onChange={(e) => handleBankChange(index, 'ifsc_code', e.target.value.toUpperCase())}
                      placeholder="e.g., SBIN0001234"
                      maxLength="11"
                      className={`w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md ${errors[`bank_${index}_ifsc_code`] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500'}`}
                    />
                    {errors[`bank_${index}_ifsc_code`] && (
                      <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors[`bank_${index}_ifsc_code`]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Account Holder Name and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={bank.account_holder_name}
                      onChange={(e) => handleBankChange(index, 'account_holder_name', e.target.value)}
                      placeholder="Full name of account holder"
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Account Holder Type
                    </label>
                    <select
                      value={bank.account_holder_type}
                      onChange={(e) => handleBankChange(index, 'account_holder_type', e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300"
                    >
                      {accountHolderTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Primary Account Checkbox */}
                <div className="flex items-center gap-3 pt-4 border-t border-indigo-100/50">
                  <input
                    type="checkbox"
                    id={`primary-${index}`}
                    checked={bank.is_primary}
                    onChange={() => togglePrimary(index)}
                    className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor={`primary-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                    Set as primary bank account
                  </label>
                </div>
              </div>
            ))
          )}

          {bankAccounts.length > 0 && (
            <button
              onClick={addNewBank}
              className="w-full py-3 border-2 border-dashed border-indigo-400 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add Another Bank Account
            </button>
          )}
        </div>
      )}
    </div>
  )
}
