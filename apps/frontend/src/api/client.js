import axios from 'axios';

export function createApiClient({ getToken }) {
    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    });

    api.interceptors.request.use((config) => {
        const token = getToken?.();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    return api;
}
