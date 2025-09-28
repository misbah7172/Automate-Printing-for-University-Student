import api from './authAPI';

// Payment API functions
export const getPendingPayments = async () => {
  const response = await api.get('/api/payments/pending');
  return response.data;
};

export const verifyPayment = async (paymentData) => {
  const response = await api.post('/api/payments/verify', paymentData);
  return response.data;
};

// Queue API functions
export const getQueueStatus = async () => {
  const response = await api.get('/api/queue/status');
  return response.data;
};

// Admin API functions
export const getDashboardStats = async () => {
  const response = await api.get('/api/admin/dashboard');
  return response.data;
};

export const getAllPrintJobs = async (params = {}) => {
  const response = await api.get('/api/admin/print-jobs', { params });
  return response.data;
};

export const updateUserBalance = async (userId, balanceData) => {
  const response = await api.put(`/api/admin/users/${userId}/balance`, balanceData);
  return response.data;
};

// Worker management
export const getWorkerStatus = async () => {
  const response = await api.get('/api/admin/workers/status');
  return response.data;
};

export const startQueueWorker = async () => {
  const response = await api.post('/api/admin/workers/queue/start');
  return response.data;
};

export const stopQueueWorker = async () => {
  const response = await api.post('/api/admin/workers/queue/stop');
  return response.data;
};

export const manualDocumentCleanup = async (documentId) => {
  const response = await api.post('/api/admin/workers/cleanup/manual', { documentId });
  return response.data;
};

export const triggerJobTimeout = async (jobId) => {
  const response = await api.post('/api/admin/workers/queue/timeout', { jobId });
  return response.data;
};