'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from "@/app/api/apiClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Si ya está autenticado, redirigir
        if (isAuthenticated && !authLoading) {
            router.push('/');
        }
        
        // Mostrar error si viene en los parámetros
        const errorParam = searchParams.get('error');
        
        if (errorParam === 'validation_error') {
            setError('Error de validación. Intente nuevamente.');
        }
    }, [isAuthenticated, authLoading, router, searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validación básica
        if (!formData.email || !formData.password) {
            setError('Por favor, complete todos los campos');
            setLoading(false);
            return;
        }

        try {
            // Hacer la petición POST al endpoint de login
            const response = await apiClient.post('/pos/login', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                // Usar el token recibido para hacer login
                const result = await login(response.data.access_token);
                if (result.success) {
                    router.push('/');
                } else {
                    setError(result.error || 'Error de autenticación');
                }
            } else {
                setError(response.data.message || 'Error en el login');
            }
        } catch (error: any) {
            // Manejar errores de la petición
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.response?.status === 401) {
                setError('Credenciales incorrectas');
            } else if (error.response?.status === 422) {
                setError('Datos de entrada inválidos');
            } else {
                setError('Error de conexión. Intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-foreground">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center">
                        <img
                            src="https://app.portafolioerp.com/img/logo_contabilidad.png"
                            alt="Logo Sistema POS"
                            className="mx-auto w-20 h-20"
                        />
                    </div>
                    <CardTitle className="text-2xl">Sistema POS</CardTitle>
                    <CardDescription>Ingrese sus credenciales</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Input
                                type="email"
                                name="email"
                                placeholder="Correo electrónico"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Input
                                type="password"
                                name="password"
                                placeholder="Contraseña"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loading || !formData.email || !formData.password}
                        >
                            {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}