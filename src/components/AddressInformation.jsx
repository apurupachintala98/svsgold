import React, { useState, useEffect } from 'react'
import { ChevronDown, AlertCircle, Copy } from 'lucide-react'
import { validatePincode } from '../utils/validation'
import {
  getAllStates,
  getDistrictsByState,
  getCitiesByStateAndDistrict,
  getStateByPincode
} from '../utils/locationData'

const ADDRESS_TYPES = ['Present', 'Permanent']

export default function AddressInformation({ isOpen, onToggle, data, onDataChange }) {
  // Always initialize with both Present and Permanent addresses
  const initAddresses = () => {
    const existing = data.addresses || []
    const present = existing.find(a => a.address_type === 'Present') || {
      id: Date.now(),
      address_type: 'Present',
      address_line: '',
      street: '',
      city: '',
      district: '',
      state: '',
      country: 'India',
      pincode: ''
    }
    const permanent = existing.find(a => a.address_type === 'Permanent') || {
      id: Date.now() + 1,
      address_type: 'Permanent',
      address_line: '',
      street: '',
      city: '',
      district: '',
      state: '',
      country: 'India',
      pincode: ''
    }
    return [present, permanent]
  }

  const [addresses, setAddresses] = useState(initAddresses)
  const [sameAsPermanent, setSameAsPermanent] = useState(false)
  const [errors, setErrors] = useState({})

  const states = getAllStates()

  // Sync to parent on mount
  useEffect(() => {
    onDataChange('addresses', addresses)
  }, [])

  const getDistricts = (state) => {
    return state ? getDistrictsByState(state) : []
  }

  const getCities = (state, district) => {
    return getCitiesByStateAndDistrict(state, district)
  }

  const handleAddressChange = (index, field, value) => {
    const newAddresses = [...addresses]
    newAddresses[index] = {
      ...newAddresses[index],
      [field]: value
    }

    // Auto-populate state/district/city when pincode is entered (6 digits)
    if (field === 'pincode' && value.length === 6) {
      const locationData = getStateByPincode(value)
      if (locationData) {
        newAddresses[index] = {
          ...newAddresses[index],
          pincode: value,
          state: locationData.state,
          district: locationData.district,
          city: locationData.city
        }
      }
    }

    // Reset district/city when state changes
    if (field === 'state') {
      newAddresses[index] = {
        ...newAddresses[index],
        district: '',
        city: ''
      }
    }

    // Auto-populate first city when district changes
    if (field === 'district') {
      const st = newAddresses[index].state
      const cities = getCities(st, value)
      newAddresses[index] = {
        ...newAddresses[index],
        city: cities.length > 0 ? cities[0] : ''
      }
    }

    setAddresses(newAddresses)
    onDataChange('addresses', newAddresses)
    validateAddressField(index, field, value)

    // If "same as permanent" is checked and we're editing Present, mirror to Permanent
    if (sameAsPermanent && index === 0) {
      const mirrored = [...newAddresses]
      mirrored[1] = {
        ...mirrored[1],
        address_line: mirrored[0].address_line,
        street: mirrored[0].street,
        city: mirrored[0].city,
        district: mirrored[0].district,
        state: mirrored[0].state,
        country: mirrored[0].country,
        pincode: mirrored[0].pincode
      }
      setAddresses(mirrored)
      onDataChange('addresses', mirrored)
    }
  }

  const validateAddressField = (index, field, value) => {
    const newErrors = { ...errors }
    const key = `address_${index}_${field}`
    if (field === 'pincode') {
      newErrors[key] = value && !validatePincode(value) ? 'Invalid 6-digit pincode' : ''
    } else if (field === 'address_line') {
      newErrors[key] = !value?.trim() ? 'Address line is required' : ''
    }
    setErrors(newErrors)
  }

  const handleSameAsPermanent = () => {
    const newVal = !sameAsPermanent
    setSameAsPermanent(newVal)

    if (newVal) {
      // Copy Present → Permanent
      const newAddresses = [...addresses]
      newAddresses[1] = {
        ...newAddresses[1],
        address_line: newAddresses[0].address_line,
        street: newAddresses[0].street,
        city: newAddresses[0].city,
        district: newAddresses[0].district,
        state: newAddresses[0].state,
        country: newAddresses[0].country,
        pincode: newAddresses[0].pincode
      }
      setAddresses(newAddresses)
      onDataChange('addresses', newAddresses)
    }
  }

  const inputClass = 'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300'
  const selectClass = 'w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'

  const renderAddressBlock = (address, index) => {
    const isPermanent = address.address_type === 'Permanent'
    const isDisabled = isPermanent && sameAsPermanent

    return (
      <div key={address.id || index} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border-2 border-amber-100/50 space-y-4 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 text-lg">
            {address.address_type} Address
            <span className="text-red-500 ml-1">*</span>
          </h3>
          {isPermanent && (
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${sameAsPermanent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {sameAsPermanent ? 'Copied from Present' : 'Fill separately'}
            </span>
          )}
        </div>

        {/* Pincode — first for auto-fill */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pincode (6 digits) — Auto-fills State, District & City
          </label>
          <input
            type="text"
            value={address.pincode || ''}
            onChange={(e) => handleAddressChange(index, 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength="6"
            placeholder="Enter 6-digit pincode"
            disabled={isDisabled}
            className={`${inputClass} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${errors[`address_${index}_pincode`] ? 'border-red-500' : ''}`}
          />
          {errors[`address_${index}_pincode`] && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors[`address_${index}_pincode`]}
            </p>
          )}
        </div>

        {/* State, District, City */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
            <select
              value={address.state || ''}
              onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
              disabled={isDisabled}
              className={`${selectClass} ${isDisabled ? 'opacity-60' : ''}`}
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
            <select
              value={address.district || ''}
              onChange={(e) => handleAddressChange(index, 'district', e.target.value)}
              disabled={isDisabled || !address.state}
              className={`${selectClass} ${isDisabled ? 'opacity-60' : ''}`}
            >
              <option value="">Select District</option>
              {getDistricts(address.state).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <select
              value={address.city || ''}
              onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
              disabled={isDisabled || !address.district}
              className={`${selectClass} ${isDisabled ? 'opacity-60' : ''}`}
            >
              <option value="">Select City</option>
              {getCities(address.state, address.district).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Address Line and Street */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address Line <span className="text-red-500">*</span>
            </label>
            <textarea
              value={address.address_line || ''}
              onChange={(e) => handleAddressChange(index, 'address_line', e.target.value)}
              placeholder="House/Flat no., Building name"
              rows="3"
              disabled={isDisabled}
              className={`${inputClass} resize-none ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            {errors[`address_${index}_address_line`] && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors[`address_${index}_address_line`]}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Street</label>
            <input
              type="text"
              value={address.street || ''}
              onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
              placeholder="Street name / Road name"
              disabled={isDisabled}
              className={`${inputClass} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
          <input type="text" value="India" disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
        </div>

        {/* "Same as Present" checkbox — show only after Present address block */}
        {index === 0 && (
          <div className="flex items-center gap-3 pt-4 border-t border-amber-100/50">
            <input
              type="checkbox"
              id="same-as-permanent"
              checked={sameAsPermanent}
              onChange={handleSameAsPermanent}
              className="w-5 h-5 rounded border-amber-300 text-amber-700 focus:ring-2 focus:ring-amber-600 cursor-pointer"
            />
            <label htmlFor="same-as-permanent" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
              <Copy size={14} />
              Permanent address is same as Present address
            </label>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-amber-50/50 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-800">Address Information</span>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">2 required</span>
        </div>
        <div className="p-2 bg-amber-50 rounded-lg">
          <ChevronDown
            size={24}
            className={`text-amber-700 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="accordion-content space-y-6 px-6 py-6 bg-gradient-to-b from-white/50 to-amber-50/30 border-t border-white/50">
          {addresses.map((address, index) => renderAddressBlock(address, index))}
        </div>
      )}
    </div>
  )
}