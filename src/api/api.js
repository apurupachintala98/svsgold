// import axios from 'axios'

// const API_BASE_URL = 'https://svs-gold-1.onrender.com'

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   // timeout: 10000
// })

// // Add request interceptor for logging
// api.interceptors.request.use(
//   config => {
//     console.log(`[API] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`)
//     return config
//   },
//   error => Promise.reject(error)
// )

// // Add response interceptor for logging
// api.interceptors.response.use(
//   response => {
//     console.log(`[API] Response Success`)
//     return response
//   },
//   error => {
//     console.error(`[API Error] ${error.message}`)
//     return Promise.reject(error)
//   }
// )

// export const accountsAPI = {
//   checkAccount: (data) => api.post('/accounts/check', data),
//   createAccount: (data) => api.post('/accounts/create', data),
//   getAddresses: (mobile) => api.get(`/accounts/addresses?mobile=${mobile}`),
//   addAddress: (mobile, data) => api.post(`/accounts/addresses?mobile=${mobile}`, data),
//   getBankAccounts: (mobile) => api.get(`/accounts/bank-accounts?mobile=${mobile}`),
//   addBankAccount: (mobile, data) => api.post(`/accounts/bank-accounts?mobile=${mobile}`, data),
//   getDocuments: (mobile) => api.get(`/accounts/documents?mobile=${mobile}`),
//   addDocument: (mobile, data) => api.post(`/accounts/documents?mobile=${mobile}`, data),
// }

// export const applicationsAPI = {
//   getApplicationsByUser: (mobile) => api.get(`/applications/by-user?mobile=${mobile}`),
//   createApplication: (data) => api.post('/applications/create', data),
//   getPledgeDetails: (mobile) => api.get(`/applications/pledge-details?mobile=${mobile}`),
//   addPledgeDetails: (data) => api.post('/applications/pledge-details', data),
//   getOrnaments: (mobile) => api.get(`/applications/ornaments?mobile=${mobile}`),
//   addOrnaments: (data) => api.post('/applications/ornaments', data),
//   addEstimation: (data) => api.post('/estimations/items', data),
//   getFinalPreview: (mobile) => api.get(`/applications/final-preview?mobile=${mobile}`),
// }

// export default api


import axios from 'axios'

const API_BASE_URL = 'https://svs-gold-1.onrender.com'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000
})

api.interceptors.request.use(
  config => { console.log(`[API] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`); return config },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => { console.log('[API] Response Success'); return response },
  error => { console.error(`[API Error] ${error.message}`); return Promise.reject(error) }
)

export const accountsAPI = {
  checkAccount: (data) => api.post('/accounts/check', data),
  createAccount: (data) => api.post('/accounts/create', data),
  addAddress: (mobile, data) => api.post(`/accounts/addresses?mobile=${mobile}`, data),
  addBankAccount: (mobile, data) => api.post(`/accounts/bank-accounts?mobile=${mobile}`, data),
  addDocument: (mobile, data) => api.post(`/accounts/documents?mobile=${mobile}`, data),
}

export const applicationsAPI = {
  getApplicationsByUser: (mobile) => api.get(`/applications/by-user?mobile=${mobile}`),
  createApplication: (data) => api.post('/applications/create', data),
  addPledgeDetails: (data) => api.post('/applications/pledge-details', data),
  addOrnaments: (data) => api.post('/applications/ornaments', data),
  addEstimation: (data) => api.post('/estimations/items', data),
  getFinalPreview: (mobile) => api.get(`/applications/final-preview?mobile=${mobile}`),
}

export const paymentsAPI = {
  createInvoice: (data) => api.post('/payments/invoice/create', data),
  addInvoiceItem: (data) => api.post('/payments/invoice/item', data),
  addDeduction: (data) => api.post('/payments/deduction', data),
  addSettlement: (data) => api.post('/payments/settlement', data),
}

export default api