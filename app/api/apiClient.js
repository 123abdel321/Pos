import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor para añadir el token a las peticiones
apiClient.interceptors.request.use((config) => {
    // Obtener token del localStorage (funciona en cliente)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado o inválido
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;