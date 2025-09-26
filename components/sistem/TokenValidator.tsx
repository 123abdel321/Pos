'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const TokenValidator: React.FC = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { login, isAuthenticated, loading } = useAuth();
	const [hasValidated, setHasValidated] = useState(false); // 🔥 Evitar múltiples validaciones

	useEffect(() => {
		const validateTokenFromURL = async () => {
		const token = searchParams.get('token');
		
		// 🔥 Prevenir loops: solo validar si hay token, no estamos autenticados, 
		// no está loading y no hemos validado ya
		if (token && !isAuthenticated && !loading && !hasValidated) {
			setHasValidated(true); // 🔥 Marcar como validado
			
			console.log('🔐 Validando token desde URL...');
			try {
				const result = await login(token);
				if (result.success) {
					console.log('✅ Token válido, redirigiendo...');
					router.replace('/');
				} else {
					console.log('❌ Token inválido:', result.error);
					router.replace(`/login?error=invalid_token&token=${encodeURIComponent(token)}`);
				}
			} catch (error) {
				console.error('❌ Error validando token:', error);
				router.replace('/login?error=validation_error');
			}
		}
		};

		validateTokenFromURL();
	}, [searchParams, isAuthenticated, loading, login, router, hasValidated]); // 🔥 Agregar hasValidated

	return null;
};

export default TokenValidator;