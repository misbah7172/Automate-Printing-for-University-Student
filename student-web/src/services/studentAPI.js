import api from './authAPI';

// Document upload
export const uploadDocument = async (formData) => {
  const response = await api.post('/api/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get user's documents
export const getUserDocuments = async () => {
  const response = await api.get('/api/documents');
  return response.data;
};

// Delete document
export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/api/documents/${documentId}`);
  return response.data;
};

// Print job management
export const createPrintJob = async (printJobData) => {
  const response = await api.post('/api/print-jobs', printJobData);
  return response.data;
};

export const getUserPrintJobs = async () => {
  const response = await api.get('/api/print-jobs');
  return response.data;
};

export const getPrintJob = async (jobId) => {
  const response = await api.get(`/api/print-jobs/${jobId}`);
  return response.data;
};

export const cancelPrintJob = async (jobId) => {
  const response = await api.delete(`/api/print-jobs/${jobId}`);
  return response.data;
};

// Payment management
export const submitPayment = async (paymentData) => {
  const response = await api.post('/api/payments/submit', paymentData);
  return response.data;
};

export const getUserPayments = async () => {
  const response = await api.get('/api/payments/user');
  return response.data;
};

// Queue management
export const getQueueStatus = async () => {
  const response = await api.get('/api/queue/status');
  return response.data;
};

export const confirmPrintJob = async (upid) => {
  const response = await api.post(`/api/queue/confirm/${upid}`);
  return response.data;
};

export const getJobPosition = async (upid) => {
  const response = await api.get(`/api/queue/position/${upid}`);
  return response.data;
};

// User profile
export const updateProfile = async (userData) => {
  const response = await api.put('/api/users/profile', userData);
  return response.data;
};