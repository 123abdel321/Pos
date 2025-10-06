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
    if (typeof window !== "undefined") {
      const errorData = error.response?.data
      console.log('error: ',error);
      if (errorData) {
        let errorMessage = ''
        
        // Formatear el mensaje de error
        if (typeof errorData.message === 'object') {
          for (const field in errorData.message) {
            const errores = errorData.message[field]
            if (Array.isArray(errores)) {
              errores.forEach((error: string) => {
                errorMessage += `${field}: ${error}\n`
              })
            }
          }
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message
        }
        
        // Disparar evento con tipo de error
        window.dispatchEvent(new CustomEvent('showError', {
          detail: { 
            message: errorMessage,
            type: 'error', // Puedes cambiar esto según el status code
            autoClose: true,
            duration: 5000
          }
        }))
      }
      
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient;