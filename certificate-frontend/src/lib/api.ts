/**
 * API client for EduLedger Backend
 */

const API_BASE_URL = 'http://localhost:5000/api'

async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API request failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export const api = {
  // Authentication
  login: async (username: string, password: string) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },
  
  logout: async (username: string) => {
    return apiCall('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  },
  
  // Issuer endpoints
  addStudent: async (username: string, password: string, fullName: string) => {
    return apiCall('/issuer/students', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        full_name: fullName,
      }),
    })
  },
  
  getStudents: async () => {
    return apiCall('/issuer/students', { method: 'GET' })
  },
  
  issueCertificate: async (data: any) => {
    return apiCall('/issuer/certificates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  getIssuerWallet: async () => {
    return apiCall('/issuer/wallet', { method: 'GET' })
  },
  
  getBlockchain: async () => {
    return apiCall('/issuer/blockchain', { method: 'GET' })
  },
  
  // Student endpoints
  getStudentCertificates: async (username: string) => {
    return apiCall(`/student/certificates?username=${username}`, { method: 'GET' })
  },
  
  verifyCertificate: async (certificateId: string) => {
    return apiCall('/student/verify', {
      method: 'POST',
      body: JSON.stringify({ certificate_id: certificateId }),
    })
  },
  
  grantConsent: async (data: any) => {
    return apiCall('/student/consents/grant', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  revokeConsent: async (data: any) => {
    return apiCall('/student/consents/revoke', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  getConsents: async (username: string) => {
    return apiCall(`/student/consents?username=${username}`, { method: 'GET' })
  },
  
  downloadCertificate: (certificateId: string) => {
    return `${API_BASE_URL}/student/download-certificate?certificate_id=${certificateId}`
  },
  
  // HR endpoints
  viewCertificate: async (certificateId: string) => {
    return apiCall('/hr/view-certificate', {
      method: 'POST',
      body: JSON.stringify({ certificate_id: certificateId }),
    })
  },
  
  getAccessibleCertificates: async () => {
    return apiCall('/hr/accessible-certificates', { method: 'GET' })
  },
}


