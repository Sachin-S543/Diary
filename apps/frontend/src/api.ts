import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized (e.g., redirect to login)
            // For now just reject
        }
        return Promise.reject(error);
    }
);

export default api;
