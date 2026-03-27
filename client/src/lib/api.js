import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to uniformly unpack ApiResponse format `{ status: 'success', data: ... }`
apiClient.interceptors.response.use(
    (response) => {
        // Obtenemos response.data.data si existe (backend refactorizado con ApiResponse)
        if (response.data && response.data.status === 'success') {
            return response.data.data;
        }
        return response.data;
    },
    (error) => {
        // Extraemos mensaje para devolver un throw limpio al frontend
        const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
        return Promise.reject(new Error(message));
    }
);

export const groupsApi = {
    create: (title, currency) => apiClient.post('/groups', { title, currency }),
    getById: (id) => apiClient.get(`/groups/${id}`),
    update: (id, title) => apiClient.put(`/groups/${id}`, { title }),
    addParticipant: (id, name) => apiClient.post(`/groups/${id}/participants`, { name }),
    removeParticipant: (id, name) => apiClient.delete(`/groups/${id}/participants`, { data: { name } }),
    getExpenses: (id) => apiClient.get(`/groups/${id}/expenses`),
    getBalance: (id) => apiClient.get(`/groups/${id}/balance`)
};

export const expensesApi = {
    create: (data) => apiClient.post('/expenses', data),
    update: (id, data) => apiClient.put(`/expenses/${id}`, data),
    delete: (id) => apiClient.delete(`/expenses/${id}`)
};

export default apiClient;
