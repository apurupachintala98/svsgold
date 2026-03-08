import React, { useState } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import {
  validateMobile,
  validateEmail,
  validateAadhar,
  validatePAN,
  validatePincode,
  validatePhone,
  validateDateOfBirth
} from '../utils/validation'

export default function AccountInformation({ isOpen, onToggle, data, onDataChange }) {
  const [errors, setErrors] = useState({})

  const handleFieldChange = (field, value) => {
    onDataChange(field, value)
    validateField(field, value)
  }

  const validateField = (field, value) => {
    let isValid = true
    const newErrors = { ...errors }

    switch (field) {
      case 'mobile':
        isValid = !value || validateMobile(value)
        newErrors.mobile = isValid ? '' : 'Invalid 10-digit mobile number'
        break
      case 'phone':
        isValid = !value || validatePhone(value)
        newErrors.phone = isValid ? '' : 'Invalid 10-digit phone number'
        break
      case 'email':
        isValid = !value || validateEmail(value)
        newErrors.email = isValid ? '' : 'Invalid email address'
        break
      case 'aadhar_no':
        isValid = !value || validateAadhar(value)
        newErrors.aadhar_no = isValid ? '' : 'Invalid 12-digit Aadhar number'
        break
      case 'pan_no':
        isValid = !value || validatePAN(value)
        newErrors.pan_no = isValid ? '' : 'Invalid PAN format (e.g., ABCDE1234F)'
        break
      case 'date_of_birth':
        isValid = !value || validateDateOfBirth(value)
        newErrors.date_of_birth = isValid ? '' : 'Invalid date of birth'
        break
      default:
        break
    }

    setErrors(newErrors)
  }

  const accountTypes = ['Individual', 'Business', 'Partnership', 'HUF']
  const genders = ['Male', 'Female', 'Other']

  const inputClass = 'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300'
  const inputErrorClass = (fieldName) =>
    `w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-amber-600/10 transition-all duration-300 shadow-sm hover:shadow-md ${errors[fieldName] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 hover:border-gray-300 focus:border-amber-600'}`

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-amber-50/50 transition-all duration-300"
      >
        <span className="text-lg font-semibold text-gray-800">Account Information</span>
        <div className="p-2 bg-amber-50 rounded-lg">
          <ChevronDown
            size={24}
            className={`text-amber-700 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="accordion-content space-y-6 px-6 py-6 bg-gradient-to-b from-white/50 to-amber-50/30 border-t border-white/50">

          {/* Account Type and Account Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Account Type</label>
              <select
                value={data.account_type || ''}
                onChange={(e) => handleFieldChange('account_type', e.target.value)}
                className={inputClass}
              >
                <option value="">Select Account Type</option>
                {accountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Account Code</label>
              <input
                type="text"
                value={data.account_code}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-900 opacity-70 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated account code</p>
            </div>
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.first_name || ''}
                onChange={(e) => handleFieldChange('first_name', e.target.value)}
                placeholder="Enter first name"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.last_name || ''}
                onChange={(e) => handleFieldChange('last_name', e.target.value)}
                placeholder="Enter last name"
                className={inputClass}
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Mobile <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select className="w-20 flex-shrink-0 px-3 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-600 transition-all duration-300">
                  <option>+91</option>
                </select>
                <input
                  type="tel"
                  value={data.mobile || ''}
                  onChange={(e) => handleFieldChange('mobile', e.target.value.slice(0, 10))}
                  placeholder="10-digit number"
                  maxLength="10"
                  className={inputErrorClass('mobile')}
                />
              </div>
              {errors.mobile && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.mobile}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="Email address"
                className={inputErrorClass('email')}
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Gender and Date of Birth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Gender</label>
              <select
                value={data.gender || ''}
                onChange={(e) => handleFieldChange('gender', e.target.value)}
                className={inputClass}
              >
                <option value="">Select Gender</option>
                {genders.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Date of Birth</label>
              <input
                type="date"
                value={data.date_of_birth || ''}
                onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                className={inputErrorClass('date_of_birth')}
              />
              {errors.date_of_birth && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.date_of_birth}
                </p>
              )}
            </div>
          </div>

          {/* Aadhar and PAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Aadhar No (12 digits)</label>
              <input
                type="text"
                value={data.aadhar_no || ''}
                onChange={(e) => handleFieldChange('aadhar_no', e.target.value.slice(0, 12))}
                maxLength="12"
                placeholder="12-digit Aadhar number"
                className={inputErrorClass('aadhar_no')}
              />
              {errors.aadhar_no && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.aadhar_no}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">PAN No</label>
              <input
                type="text"
                value={data.pan_no || ''}
                onChange={(e) => handleFieldChange('pan_no', e.target.value.toUpperCase())}
                placeholder="e.g., ABCDE1234F"
                maxLength="10"
                className={inputErrorClass('pan_no')}
              />
              {errors.pan_no && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.pan_no}
                </p>
              )}
            </div>
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Occupation</label>
            <input
              type="text"
              value={data.occupation || ''}
              onChange={(e) => handleFieldChange('occupation', e.target.value)}
              placeholder="Enter occupation"
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  )
}