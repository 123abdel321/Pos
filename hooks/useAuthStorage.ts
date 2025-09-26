'use client';
import { useLocalStorage } from './useLocalStorage';

export interface AuthData {
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    expiresAt?: number;
}

export const useAuthStorage = () => {
    const [authData, setAuthData, removeAuthData] = useLocalStorage<AuthData | null>('authData', null);

    const setAuth = (token: string, user: AuthData['user'], expiresInHours = 24) => {
        const expiresAt = Date.now() + (expiresInHours * 60 * 60 * 1000);
        
        const newAuthData: AuthData = {
            token,
            user,
            expiresAt
        };

        setAuthData(newAuthData);
        
        // Sincronizar con localStorage directo para el interceptor
        if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', token);
        }
    };

    const getToken = (): string | null => {
        // 🔥 ESTRATEGIA DOBLE: Primero intentar con localStorage directo
        if (typeof window !== 'undefined') {
            try {
                // Intentar leer directamente de localStorage como fallback
                const directToken = localStorage.getItem('authToken');
                if (directToken) {
                    console.log('🔑 Token encontrado en localStorage directo');
                    return directToken;
                }
            } catch (error) {
                console.error('Error leyendo localStorage directo:', error);
            }
        }
        
        // Luego intentar con el hook useLocalStorage
        if (!authData) {
            console.log('❌ No hay authData en el hook');
            return null;
        }
        
        // Verificar si el token ha expirado
        if (authData.expiresAt && Date.now() > authData.expiresAt) {
            console.log('❌ Token expirado');
            removeAuthData();
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
            }
            return null;
        }

        console.log('✅ Token encontrado en authData:', authData.token ? `${authData.token.substring(0, 10)}...` : 'null');
        return authData.token;
    };

    const getUser = () => {
        return authData?.user || null;
    };

    const isAuthenticated = (): boolean => {
        return !!getToken();
    };

    const clearAuth = () => {
        removeAuthData();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
        }
    };

    return {
        authData,
        setAuth,
        getToken,
        getUser,
        isAuthenticated,
        clearAuth
    };
};