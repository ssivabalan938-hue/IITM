import axios from 'axios';

const api = axios.create({
  baseURL: '', // Proxied through Vite server configuration
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Token on request header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('roadwatch_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  citizenRegister: async (formData: any) => {
    const response = await api.post('/api/auth/citizen/register', formData);
    return response.data;
  },
  citizenLogin: async (credentials: any) => {
    const response = await api.post('/api/auth/citizen/login', credentials);
    return response.data;
  },
  governmentRegister: async (formData: any) => {
    const response = await api.post('/api/auth/government/register', formData);
    return response.data;
  },
  governmentLogin: async (credentials: any) => {
    const response = await api.post('/api/auth/government/login', credentials);
    return response.data;
  },
  getPendingOfficials: async () => {
    const response = await api.get('/api/auth/government/pending');
    return response.data;
  },
  approveOfficial: async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const response = await api.put(`/api/auth/government/${id}/approve`, { status });
    return response.data;
  },
  autoApproveAllDebug: async () => {
    const response = await api.post('/api/auth/government/approve-all-debug');
    return response.data;
  }
};

// Complaint Services
export const complaintService = {
  submitComplaint: async (formData: FormData) => {
    const response = await api.post('/api/complaints/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getMyComplaints: async () => {
    const response = await api.get('/api/complaints/my-complaints');
    return response.data;
  },
  getComplaintQueue: async () => {
    const response = await api.get('/api/complaints/queue');
    return response.data;
  },
  updateThreshold: async (threshold: number) => {
    const response = await api.post('/api/complaints/threshold', { threshold });
    return response.data;
  },
  analyzeComplaint: async (id: string, auditData: any) => {
    const response = await api.post(`/api/complaints/${id}/analyze`, auditData);
    return response.data;
  }
};

// Prediction (Hotspots) Services
export const riskService = {
  getHotspots: async () => {
    const response = await api.get('/api/prediction/hotspots');
    return response.data;
  },
  getHotspotDetails: async (id: string) => {
    const response = await api.get(`/api/prediction/hotspots/${id}`);
    return response.data;
  },
  evaluateCustomRoad: async (segmentData: any) => {
    const response = await api.post('/api/prediction/evaluate-custom', segmentData);
    return response.data;
  }
};

// Intervention (Construction) Services
export const interventionService = {
  getConstructionList: async () => {
    const response = await api.get('/api/intervention/status-list');
    return response.data;
  },
  updateConstructionStatus: async (hotspotId: string, payload: any) => {
    const response = await api.put(`/api/intervention/${hotspotId}/update`, payload);
    return response.data;
  }
};

// Engineer Resource Services
export const engineerService = {
  getEngineers: async () => {
    const response = await api.get('/api/engineers');
    return response.data;
  },
  createEngineer: async (engineerData: any) => {
    const response = await api.post('/api/engineers', engineerData);
    return response.data;
  },
  updateEngineer: async (id: string, engineerData: any) => {
    const response = await api.put(`/api/engineers/${id}`, engineerData);
    return response.data;
  }
};

export default api;
