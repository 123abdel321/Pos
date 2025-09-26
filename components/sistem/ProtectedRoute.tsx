'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import { useTheme } from '@/components/theme-provider';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const [showLoading, setShowLoading] = useState(true);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLoading(loading);
        }, 300);

        return () => clearTimeout(timer);
    }, [loading]);

    if (showLoading) {
        return (
            <div className={`min-h-screen ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
                {/* Header skeleton */}
                <div className={`border-b ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                } p-4`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            {/* Logo skeleton */}
                            <div className={`h-8 w-8 rounded-lg animate-pulse ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}></div>
                            {/* Título skeleton */}
                            <div className={`h-6 w-32 rounded animate-pulse ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}></div>
                            {/* Ubicación skeleton */}
                            <div className={`h-5 w-48 rounded animate-pulse ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}></div>
                        </div>
                        
                        {/* Botones del header skeleton */}
                        <div className="flex space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div 
                                    key={i}
                                    className={`h-9 w-9 rounded-md animate-pulse ${
                                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                                    }`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main content skeleton - Estructura del POS */}
                <div className="flex h-[calc(100vh-80px)]">
                    {/* Columna izquierda - Pedidos pendientes */}
                    <div className={`w-16 border-r ${
                        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    } p-2`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div 
                                key={i}
                                className={`h-12 w-12 rounded-lg animate-pulse mb-2 ${
                                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                                }`}
                                style={{ animationDelay: `${i * 0.1}s` }}
                            ></div>
                        ))}
                    </div>

                    {/* Área principal - Selector de ubicación y productos */}
                    <div className="flex-1 flex flex-col">
                        {/* Selector de ubicación skeleton */}
                        <div className={`p-4 border-b ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                            <div className={`h-10 w-64 rounded-lg animate-pulse ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}></div>
                        </div>
                        
                        {/* Grid de productos skeleton */}
                        <div className="flex-1 p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {[...Array(18)].map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`aspect-square rounded-lg animate-pulse ${
                                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                                        }`}
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Panel derecho - Orden actual */}
                    <div className={`w-96 border-l ${
                        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    } p-4`}>
                        {/* Título del panel */}
                        <div className={`h-8 w-32 rounded animate-pulse mb-6 ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                        }`}></div>
                        
                        {/* Items del pedido skeleton */}
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div 
                                    key={i}
                                    className={`h-16 rounded-lg animate-pulse ${
                                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                                    }`}
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                ></div>
                            ))}
                        </div>
                        
                        {/* Totales skeleton */}
                        <div className="mt-6 space-y-2">
                            <div className={`h-4 w-24 rounded animate-pulse ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}></div>
                            <div className={`h-4 w-20 rounded animate-pulse ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}></div>
                            <div className={`h-6 w-28 rounded animate-pulse ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}></div>
                        </div>
                        
                        {/* Botones de acción skeleton */}
                        <div className="mt-6 flex space-x-2">
                            <div className={`h-10 flex-1 rounded animate-pulse ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}></div>
                            <div className={`h-10 flex-1 rounded animate-pulse ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}></div>
                        </div>
                    </div>
                </div>

                {/* Loading indicator discreto en esquina */}
                <div className={`fixed bottom-4 right-4 flex items-center space-x-2 px-3 py-2 rounded-full ${
                    theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 shadow-lg'
                }`}>
                    <div className={`h-3 w-3 rounded-full animate-pulse ${
                        theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
                    }`}></div>
                    <span className="text-sm font-medium">Cargando...</span>
                </div>
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;