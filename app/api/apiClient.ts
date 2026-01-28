import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://app.portafolioerp.com/api',
    // baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000, // 🔥 Agregar timeout para evitar requests colgadas
});

// Interceptor para añadir el token a las peticiones
apiClient.interceptors.request.use((config) => {
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
        if (typeof window !== "undefined") {
            const errorData = error.response?.data;
            
            if (errorData) {
                let messages: string[] = [];

                // Función ultra-limpia para extraer solo el contenido
                const collectMessages = (obj: any) => {
                    if (typeof obj === 'string') {
                        messages.push(obj);
                    } else if (Array.isArray(obj)) {
                        obj.forEach(item => collectMessages(item));
                    } else if (typeof obj === 'object' && obj !== null) {
                        // Iteramos solo los VALORES, ignorando las llaves técnicas como "Movimiento contable"
                        Object.values(obj).forEach(val => collectMessages(val));
                    }
                };

                // Extraemos de 'message' o de 'errors' (dependiendo de cómo responda tu API)
                collectMessages(errorData.message || errorData.errors || errorData);

                // Unimos con <br> por si hay varios errores, pero el HTML pasará puro
                const finalMessage = messages.join('<br>');

                if (finalMessage) {
                    window.dispatchEvent(new CustomEvent('showError', {
                        detail: { 
                            message: finalMessage, 
                            type: 'error',
                            html: true,
                            autoClose: true,
                            duration: 15000 // Más tiempo porque las tablas son largas
                        }
                    }));
                }
            }

            if (error.response?.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;