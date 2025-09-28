// API Service Layer for AutoPrint Student Portal
// This connects to the backend API endpoints

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('student_token');
};

// Helper function to make authenticated requests
const makeRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses (like file downloads)
    if (endpoint.includes('/download/') || response.headers.get('content-type')?.includes('application/')) {
      if (response.ok) {
        return { success: true, data: await response.blob() };
      } else {
        return { success: false, error: 'Download failed' };
      }
    }

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Request failed' };
    }
  } catch (error) {
    console.error('API Request Error:', error);
    return { success: false, error: 'Network error' };
  }
};

// Print Job Service
export const printJobService = {
  // Create new print job
  create: async (formData) => {
    return makeRequest('/student/print-jobs', {
      method: 'POST',
      body: formData, // FormData with files and print options
    });
  },

  // Get current user's print jobs
  getMyJobs: async () => {
    return makeRequest('/student/print-jobs/my-jobs');
  },

  // Get queue status and position
  getQueueStatus: async () => {
    return makeRequest('/student/print-jobs/queue-status');
  },

  // Confirm job pickup
  confirmPickup: async (jobId) => {
    return makeRequest(`/student/print-jobs/${jobId}/confirm-pickup`, {
      method: 'POST',
    });
  },

  // Get print job history with filters
  getHistory: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        if (key === 'startDate' || key === 'endDate') {
          queryParams.append(key, filters[key].toISOString());
        } else {
          queryParams.append(key, filters[key]);
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/student/print-jobs/history${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(endpoint);
  },

  // Create reprint job from existing job
  reprint: async (jobId) => {
    return makeRequest(`/student/print-jobs/${jobId}/reprint`, {
      method: 'POST',
    });
  },

  // Download receipt for completed job
  downloadReceipt: async (jobId) => {
    return makeRequest(`/student/print-jobs/${jobId}/receipt/download`);
  },
};

// Payment Service
export const paymentService = {
  // Generate bKash QR code for payment
  generateQR: async ({ jobId, amount }) => {
    return makeRequest('/student/payments/generate-qr', {
      method: 'POST',
      body: JSON.stringify({ jobId, amount }),
    });
  },

  // Verify payment with transaction ID
  verify: async ({ jobId, transactionId }) => {
    return makeRequest('/student/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ jobId, transactionId }),
    });
  },

  // Get payment status
  getPaymentStatus: async (jobId) => {
    return makeRequest(`/student/payments/${jobId}/status`);
  },
};

// User Service
export const userService = {
  // Update user profile
  updateProfile: async (formData) => {
    return makeRequest('/student/profile', {
      method: 'PUT',
      body: formData, // FormData with profile data and optional avatar
    });
  },

  // Change password
  changePassword: async ({ currentPassword, newPassword }) => {
    return makeRequest('/student/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Delete user account
  deleteAccount: async () => {
    return makeRequest('/student/profile', {
      method: 'DELETE',
    });
  },

  // Get user profile data
  getProfile: async () => {
    return makeRequest('/student/profile');
  },
};

// Auth Service
export const authService = {
  // Login user
  login: async (email, password) => {
    return makeRequest('/student/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Register new user
  register: async (name, email, password) => {
    return makeRequest('/student/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  // Logout user (optional backend call)
  logout: async () => {
    return makeRequest('/student/auth/logout', {
      method: 'POST',
    });
  },

  // Verify token and get user data
  verifyToken: async () => {
    return makeRequest('/student/auth/verify');
  },

  // Refresh token
  refreshToken: async () => {
    return makeRequest('/student/auth/refresh', {
      method: 'POST',
    });
  },
};

// Export all services
export default {
  printJobService,
  paymentService,
  userService,
  authService,
};