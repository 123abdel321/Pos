'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
        const tokenParam = searchParams.get('token');
        
        if (errorParam === 'invalid_token' && tokenParam) {
            setError('Token inválido o expirado. Por favor, solicite un nuevo enlace.');
        } else if (errorParam === 'validation_error') {
            setError('Error de validación. Intente nuevamente.');
        }
    }, [isAuthenticated, authLoading, router, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = searchParams.get('token');
            
            if (token) {
                const result = await login(token);
                if (result.success) {
                    router.push('/');
                } else {
                    setError(result.error || 'Error de autenticación');
                }
            } else {
                setError('No se encontró token en la URL');
            }
        } catch (error) {
            setError('Error inesperado. Intente nuevamente.');
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
                    <CardDescription>Ingrese con su token de autenticación</CardDescription>
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
                                type="text"
                                placeholder="Token de autenticación"
                                value={searchParams.get('token') || ''}
                                readOnly
                                className="text-center font-mono text-sm"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loading || !searchParams.get('token')}
                        >
                            {loading ? 'Validando token...' : 'Ingresar al Sistema'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}