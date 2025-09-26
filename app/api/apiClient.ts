import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api', // 🔥 Verifica que esta URL sea correcta
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000, // 🔥 Agregar timeout para evitar requests colgadas
});

// Interceptor para añadir el token a las peticiones
apiClient.interceptors.request.use((config) => {
    // Verificar que estamos en el cliente antes de acceder a localStorage
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
            // Solo redirigir en el cliente
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;