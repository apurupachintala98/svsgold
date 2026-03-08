export const validateMobile = (mobile) => {
  const phoneRegex = /^[0-9]{10}$/
  return phoneRegex.test(mobile)
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateAadhar = (aadhar) => {
  const aadharRegex = /^[0-9]{12}$/
  return aadharRegex.test(aadhar)
}

export const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

export const validatePincode = (pincode) => {
  const pincodeRegex = /^[0-9]{6}$/
  return pincodeRegex.test(pincode)
}

export const validateIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return ifscRegex.test(ifsc)
}

export const validateAccountNumber = (accountNumber) => {
  return accountNumber && accountNumber.length >= 9 && accountNumber.length <= 18
}

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/
  return phoneRegex.test(phone)
}

export const validateDateOfBirth = (dob) => {
  const date = new Date(dob)
  return date instanceof Date && !isNaN(date) && date < new Date()
}

// Document validations
export const validateDocumentFile = (file) => {
  if (!file) return { valid: false, error: 'File is required' }
  
  const maxSizeMB = 5
  const fileSizeMB = file.size / (1024 * 1024)
  
  if (fileSizeMB > maxSizeMB) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` }
  }
  
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
  
  const hasValidType = allowedTypes.includes(file.type)
  const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  
  if (!hasValidType && !hasValidExtension) {
    return { valid: false, error: 'File type must be PDF, JPG, PNG, DOC, or DOCX' }
  }
  
  return { valid: true }
}

// Comprehensive form validation
export const validateCreateAccountForm = (formData, addresses, bankAccounts, documents) => {
  const errors = {}
  
  // === Account Information (required fields only) ===
  if (!formData.first_name?.trim()) {
    errors.first_name = 'First name is required'
  }
  
  if (!formData.last_name?.trim()) {
    errors.last_name = 'Last name is required'
  }
  
  if (!formData.mobile?.trim()) {
    errors.mobile = 'Mobile number is required'
  } else if (!validateMobile(formData.mobile)) {
    errors.mobile = 'Mobile number must be 10 digits'
  }
  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format'
  }
  
  // === Optional field validation (only if a value is provided) ===
  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = 'Phone must be 10 digits'
  }
  
  if (formData.aadhar_no && !validateAadhar(formData.aadhar_no)) {
    errors.aadhar_no = 'Aadhar must be 12 digits'
  }
  
  if (formData.pan_no && !validatePAN(formData.pan_no)) {
    errors.pan_no = 'PAN must be in format: ABCDE1234F'
  }
  
  if (formData.date_of_birth && !validateDateOfBirth(formData.date_of_birth)) {
    errors.date_of_birth = 'Date of birth must be in the past'
  }

  // === Address validation ===
  // Only validate addresses that have some content filled in
  addresses.forEach((address, index) => {
    const hasAnyContent = address.address_line?.trim() || address.pincode?.trim() || address.state?.trim()
    
    // If it's Present or Permanent, address_line is required
    if (address.address_type === 'Present' || address.address_type === 'Permanent') {
      if (!address.address_line?.trim()) {
        errors[`address_${index}_line`] = `${address.address_type} address line is required`
      }
    } else if (hasAnyContent) {
      // For any other address type, only validate if partially filled
      if (!address.address_line?.trim()) {
        errors[`address_${index}_line`] = 'Address line is required'
      }
    }

    // Only validate pincode if one was entered
    if (address.pincode?.trim() && !validatePincode(address.pincode)) {
      errors[`address_${index}_pincode`] = 'Pincode must be 6 digits'
    }
  })
  
  // === Bank Account validation — only if bank accounts were added ===
  bankAccounts.forEach((bank, index) => {
    if (!bank.bank_name?.trim()) {
      errors[`bank_${index}_name`] = 'Bank name is required'
    }
    
    if (!bank.account_number?.trim()) {
      errors[`bank_${index}_account_number`] = 'Account number is required'
    } else if (!validateAccountNumber(bank.account_number)) {
      errors[`bank_${index}_account_number`] = 'Account number must be 9-18 digits'
    }
    
    if (!bank.ifsc_code?.trim()) {
      errors[`bank_${index}_ifsc_code`] = 'IFSC code is required'
    } else if (!validateIFSC(bank.ifsc_code)) {
      errors[`bank_${index}_ifsc_code`] = 'IFSC format: ABCD0123456'
    }
    
    if (!bank.account_holder_name?.trim()) {
      errors[`bank_${index}_holder`] = 'Account holder name is required'
    }
  })
    
  return { errors, isValid: Object.keys(errors).length === 0 }
}