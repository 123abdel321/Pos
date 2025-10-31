import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://app.portafolioerp.com/api', // 🔥 Verifica que esta URL sea correcta
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
    if (typeof window !== "undefined") {
      const errorData = error.response?.data
      if (errorData) {
        let errorMessage = ''
        
        // Función recursiva para extraer mensajes de error
        const extractErrorMessages = (obj: any, prefix: string = ''): void => {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              const value = obj[key];
              const currentPath = prefix ? `${prefix}` : key;
              
              if (typeof value === 'string') {
                // Es un mensaje de error final
                errorMessage += `${currentPath}: ${value}\n`;
              } else if (Array.isArray(value)) {
                // Es un array de errores
                value.forEach((error: string) => {
                  errorMessage += `${currentPath}: ${error}\n`;
                });
              } else if (typeof value === 'object' && value !== null) {
                // Es un objeto anidado, llamar recursivamente
                extractErrorMessages(value, currentPath);
              }
            }
          }
        }
        
        // Formatear el mensaje de error
        if (typeof errorData.message === 'object') {
          extractErrorMessages(errorData.message);
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }
        
        console.log('errorMessage: ', errorMessage);
        
        // Disparar evento con tipo de error
        if (errorMessage) {
          window.dispatchEvent(new CustomEvent('showError', {
            detail: { 
              message: errorMessage,
              type: 'error',
              autoClose: true,
              duration: 5000
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