'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '@/app/api/apiClient';
import { useAuthStorage } from '@/hooks/useAuthStorage';

interface User {
	id: number;
	name: string;
	email: string;
}

interface AuthContextType {
	isAuthenticated: boolean;
	user: User | null;
	loading: boolean;
	login: (token: string) => Promise<{ success: boolean; error?: string }>;
	logout: () => void;
	checkToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth debe ser usado dentro de un AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [validating, setValidating] = useState(false);
	
	const { getToken, setAuth, clearAuth } = useAuthStorage();

	useEffect(() => {
		// 🔥 Pequeño delay para asegurar que localStorage esté disponible
		const timer = setTimeout(() => {
			checkToken();
		}, 100);
		
		return () => clearTimeout(timer);
	}, []);

	const checkToken = async () => {
		console.log('🔍 Iniciando checkToken, validating:', validating);
		if (validating) {
			console.log('⏳ Validación en curso, skipping...');
			return;
		}
		
		setValidating(true);
		try {
			const token = getToken();
			console.log('🔑 Token obtenido:', token ? `${token.substring(0, 10)}...` : 'NULL');
			
			if (token) {
				console.log('🚀 Haciendo petición a /pos-validate...');
				
				// Asegurar que el token esté en localStorage para el interceptor
				if (typeof window !== 'undefined') {
					localStorage.setItem('authToken', token);
				}
				
				const response = await apiClient.get('/pos-validate', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});
				
				console.log('✅ Respuesta del servidor:', response.data);
				if (response.data.success) {
					setIsAuthenticated(true);
					setUser(response.data.user);
					setAuth(token, response.data.user);
					console.log('🎉 Usuario autenticado correctamente');
				} else {
					console.log('❌ Servidor respondió con success: false');
					clearAuth();
					setIsAuthenticated(false);
					setUser(null);
				}
			} else {
				console.log('💡 No hay token, usuario no autenticado');
				setIsAuthenticated(false);
				setUser(null);
			}
		} catch (error: any) {
			console.error('💥 Error en checkToken:', error);
			console.error('📋 Detalles del error:', {
				message: error.message,
				status: error.response?.status,
				data: error.response?.data
			});
			
			if (error.response?.status === 401) {
				console.log('🔒 Error 401 - Token inválido, limpiando...');
				clearAuth();
			}
			setIsAuthenticated(false);
			setUser(null);
		} finally {
			setLoading(false);
			setValidating(false);
			console.log('🏁 checkToken finalizado');
		}
	};

	const login = async (token: string) => {
		if (validating) return { success: false, error: 'Validación en curso' };
		
		setValidating(true);
		try {
			console.log('🔐 Iniciando login con token...');
			
			// Guardar el token inmediatamente
			setAuth(token, { id: 0, name: '', email: '' });
			
			const response = await apiClient.get('/pos-validate', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			
			console.log('✅ Login response:', response.data);
			if (response.data.success) {
				setAuth(token, response.data.user);
				setIsAuthenticated(true);
				setUser(response.data.user);
				return { success: true };
			} else {
				clearAuth();
				return { success: false, error: 'Token inválido' };
			}
		} catch (error: any) {
			console.error('❌ Error en login:', error);
			clearAuth();
			
			if (error.code === 'NETWORK_ERROR' || !error.response) {
				return { success: false, error: 'Error de conexión con el servidor' };
			} else if (error.response.status === 401) {
				return { success: false, error: 'Token inválido o expirado' };
			} else {
				return { success: false, error: 'Error del servidor' };
			}
		} finally {
			setValidating(false);
		}
	};

	const logout = () => {
		console.log('👋 Cerrando sesión...');
		clearAuth();
		setIsAuthenticated(false);
		setUser(null);
	};

	const value: AuthContextType = {
		isAuthenticated,
		user,
		loading: loading || validating,
		login,
		logout,
		checkToken
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};