'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from "@/app/api/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState({ email: false, password: false });

    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (isAuthenticated && !authLoading) router.push('/');

        const errorParam = searchParams.get('error');
        if (errorParam === 'validation_error') setError('Error de validación. Intente nuevamente.');
    }, [isAuthenticated, authLoading, router, searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.email || !formData.password) {
            setError('Por favor, complete todos los campos');
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.post('/pos/login', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                const result = await login(response.data.access_token);
                if (result.success) router.push('/');
                else setError(result.error || 'Error de autenticación');
            } else {
                setError(response.data.message || 'Error en el login');
            }
        } catch (err: any) {
            if (err.response?.data?.message) setError(err.response.data.message);
            else if (err.response?.status === 401) setError('Credenciales incorrectas');
            else if (err.response?.status === 422) setError('Datos de entrada inválidos');
            else setError('Error de conexión. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-700 font-medium">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    const hasError = (field: keyof typeof formData) => touched[field] && !formData[field];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-xl border rounded-2xl overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-6">
                    <div className="flex justify-center mb-4">
                        <img
                            src="https://app.portafolioerp.com/img/logo_contabilidad.png"
                            alt="Logo Sistema POS"
                            className="mx-auto w-20 h-20 rounded-full shadow-lg"
                        />
                    </div>
                    <CardTitle className="text-3xl font-bold">Sistema POS</CardTitle>
                    <CardDescription className="text-blue-100 mt-1">Ingrese sus credenciales para continuar</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md animate-fadeIn">
                                <AlertTriangle className="w-5 h-5" /> {error}
                            </div>
                        )}

                        <div className="relative">
                            <Input
                                type="email"
                                name="email"
                                placeholder="Correo electrónico"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={loading}
                                className={clsx('transition-all', hasError('email') && 'border-red-500')}
                                required
                            />
                            {hasError('email') && <p className="text-xs text-red-500 mt-1">Ingrese su correo electrónico</p>}
                        </div>

                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Contraseña"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={loading}
                                className={clsx('pr-10 transition-all', hasError('password') && 'border-red-500')}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                            {hasError('password') && <p className="text-xs text-red-500 mt-1">Ingrese su contraseña</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
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
