import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('roadwatch_token')}`,
  },
});

export const engineerService = {
  getAll: () => api.get('/engineers'),
  create: (data) => api.post('/engineers', data),
  update: (id, data) => api.put(`/engineers/${id}`, data),
  delete: (id) => api.delete(`/engineers/${id}`),
  assignToProject: (projectId, engineerId) =>
    api.patch(`/projects/${projectId}/assign-engineer`, { engineerId }),
};
