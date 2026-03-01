import React, { useState } from 'react'
import { ChevronDown, Plus, Trash2, AlertCircle } from 'lucide-react'
import { validatePincode } from '../utils/validation'
import {
  getAllStates,
  getDistrictsByState,
  getCitiesByStateAndDistrict,
  getStateByPincode
} from '../utils/locationData'

export default function AddressInformation({ isOpen, onToggle, data, onDataChange }) {
  const [addresses, setAddresses] = useState(data.addresses || [])
  const [sameAsBilling, setSameAsBilling] = useState(false)
  const [errors, setErrors] = useState({})

  const states = getAllStates()
  const addressTypes = ['Shipping', 'Billing', 'Residential', 'Office']

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

    // Auto-populate state/district/city when pincode is entered
    if (field === 'pincode' && value.length === 6) {
      const locationData = getStateByPincode(value)
      if (locationData) {
        newAddresses[index] = {
          ...newAddresses[index],
          state: locationData.state,
          district: locationData.district,
          city: locationData.city
        }
      }
    }

    // Auto-populate first city when state is selected (reset district first)
    if (field === 'state') {
      newAddresses[index] = {
        ...newAddresses[index],
        district: '',
        city: '',
        pincode: ''
      }
    }

    // Auto-populate first city when district is selected
    if (field === 'district') {
      const state = newAddresses[index].state
      const cities = getCities(state, value)
      if (cities.length > 0) {
        newAddresses[index] = {
          ...newAddresses[index],
          city: cities[0],
          pincode: ''
        }
      } else {
        newAddresses[index] = {
          ...newAddresses[index],
          city: '',
          pincode: ''
        }
      }
    }

    setAddresses(newAddresses)
    onDataChange('addresses', newAddresses)
    validateAddressField(index, field, value)
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

  const addNewAddress = () => {
    const newAddress = {
      id: Date.now(),
      address_type: 'Shipping',
      address_line: '',
      street: '',
      city: '',
      district: '',
      state: '',
      country: 'India',
      pincode: ''
    }
    setAddresses([...addresses, newAddress])
  }

  const removeAddress = (index) => {
    const newAddresses = addresses.filter((_, i) => i !== index)
    setAddresses(newAddresses)
    onDataChange('addresses', newAddresses)
  }

  const handleSameBillingChange = (index) => {
    if (sameAsBilling) {
      setSameAsBilling(false)
    } else {
      const shippingAddress = addresses[index]
      const newAddresses = [...addresses]

      const billingIndex = newAddresses.findIndex(a => a.address_type === 'Billing')

      if (billingIndex >= 0) {
        newAddresses[billingIndex] = {
          ...newAddresses[billingIndex],
          address_line: shippingAddress.address_line,
          street: shippingAddress.street,
          city: shippingAddress.city,
          district: shippingAddress.district,
          state: shippingAddress.state,
          country: shippingAddress.country,
          pincode: shippingAddress.pincode
        }
      } else {
        newAddresses.push({
          id: Date.now(),
          address_type: 'Billing',
          address_line: shippingAddress.address_line,
          street: shippingAddress.street,
          city: shippingAddress.city,
          district: shippingAddress.district,
          state: shippingAddress.state,
          country: shippingAddress.country,
          pincode: shippingAddress.pincode
        })
      }

      setAddresses(newAddresses)
      onDataChange('addresses', newAddresses)
      setSameAsBilling(true)
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300"
      >
        <span className="text-lg font-semibold text-gray-800">Address Information</span>
        <div className="p-2 bg-indigo-50 rounded-lg">
          <ChevronDown
            size={24}
            className={`text-indigo-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="accordion-content space-y-6 px-6 py-6 bg-gradient-to-b from-white/50 to-indigo-50/30 border-t border-white/50">
          {addresses.length === 0 ? (
            <button
              onClick={addNewAddress}
              className="w-full py-3 border-2 border-dashed border-indigo-400 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add First Address
            </button>
          ) : (
            addresses.map((address, index) => (
              <div key={address.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border-2 border-indigo-100/50 space-y-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{address.address_type} Address {index + 1}</h3>
                  <button
                    onClick={() => removeAddress(index)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-800 transition-all duration-300"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Address Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Address Type
                  </label>
                  <select
                    value={address.address_type}
                    onChange={(e) => handleAddressChange(index, 'address_type', e.target.value)}
                    className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300"
                  >
                    {addressTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Pincode (moved to top for smart auto-population) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Pincode (6 digits) - Auto-fills State, District & City
                  </label>
                  <input
                    type="text"
                    value={address.pincode}
                    onChange={(e) => handleAddressChange(index, 'pincode', e.target.value.slice(0, 6))}
                    maxLength="6"
                    placeholder="Enter pincode to auto-populate location"
                    className={`w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md ${errors[`address_${index}_pincode`] ? 'border-red-500 focus:border-red-500' : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500'}`}
                  />
                  {errors[`address_${index}_pincode`] && (
                    <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors[`address_${index}_pincode`]}
                    </p>
                  )}
                </div>

                {/* State, District, City */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      State
                    </label>
                    <select
                      value={address.state}
                      onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300"
                    >
                      <option value="">Select State</option>
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      District
                    </label>
                    <select
                      value={address.district || ''}
                      onChange={(e) => handleAddressChange(index, 'district', e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300 disabled:opacity-50"
                      disabled={!address.state}
                    >
                      <option value="">Select District</option>
                      {getDistricts(address.state).map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      City
                    </label>
                    <select
                      value={address.city}
                      onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300 disabled:opacity-50"
                      disabled={!address.district}
                    >
                      <option value="">Select City</option>
                      {getCities(address.state, address.district).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address Line and Street */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Address Line *
                    </label>
                    <textarea
                      value={address.address_line}
                      onChange={(e) => handleAddressChange(index, 'address_line', e.target.value)}
                      placeholder="House/Flat no., Building name"
                      rows="3"
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300 resize-none"
                    />
                    {errors[`address_${index}_address_line`] && (
                      <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors[`address_${index}_address_line`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Street
                    </label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                      placeholder="Street name/Road name"
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300"
                    />
                  </div>
                </div>

                {/* Country (always India) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Country
                  </label>
                  <input
                    type="text"
                    value={address.country}
                    className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300 opacity-60"
                    disabled
                  />
                </div>

                {/* Same as Shipping Address Checkbox */}
                {address.address_type === 'Shipping' && (
                  <div className="flex items-center gap-3 pt-4 border-t border-indigo-100/50">
                    <input
                      type="checkbox"
                      id={`same-billing-${index}`}
                      checked={sameAsBilling}
                      onChange={() => handleSameBillingChange(index)}
                      className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor={`same-billing-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                      Use same address for billing
                    </label>
                  </div>
                )}
              </div>
            ))
          )}

          {addresses.length > 0 && (
            <button
              onClick={addNewAddress}
              className="w-full py-3 border-2 border-dashed border-indigo-400 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add Another Address
            </button>
          )}
        </div>
      )}
    </div>
  )
}
