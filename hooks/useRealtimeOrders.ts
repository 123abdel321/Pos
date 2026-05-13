import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

interface UseRealtimeOrdersProps {
    empresaToken: string | null;
    onEvent: (data: any) => void;
}

export function useRealtimeOrders({ empresaToken, onEvent }: UseRealtimeOrdersProps) {
    const pusherRef = useRef<Pusher | null>(null);
    const channelRef = useRef<any>(null);
    const isSubscribedRef = useRef(false);
    const onEventRef = useRef(onEvent);

    // Mantener la referencia más actualizada de onEvent
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    

    useEffect(() => {
        if (!empresaToken) return;
        if (isSubscribedRef.current) return; // ya suscrito, evitar duplicados
        console.log('isSubscribedRef:', isSubscribedRef);
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;

        if (!pusherKey || !cluster) {
            console.error('Faltan variables de entorno de Pusher');
            return;
        }

        // Si ya hay una instancia de Pusher y está conectada, no crear otra
        if (pusherRef.current && pusherRef.current.connection.state === 'connected') {
            return;
        }

        // Desconectar cualquier instancia previa
        if (pusherRef.current) {
            pusherRef.current.disconnect();
        }

        pusherRef.current = new Pusher(pusherKey, {
            cluster
        });

        const channelName = `pedidos-${empresaToken}`;
        channelRef.current = pusherRef.current.subscribe(channelName);

        const handler = (data: any) => {
            // Si quieres filtrar por usuario propio, puedes agregar lógica aquí
            // if (data.usuario_id === currentUserId) return;
            onEventRef.current(data);
        };
        
        channelRef.current.bind('notificaciones', handler);
        isSubscribedRef.current = true;

        return () => {
            if (channelRef.current) {
                try {
                    channelRef.current.unbind('notificaciones', handler);
                    pusherRef.current?.unsubscribe(channelName);
                } catch (e) {
                    console.warn('Error al desuscribir canal', e);
                }
            }
            if (pusherRef.current) {
                pusherRef.current.disconnect();
                pusherRef.current = null;
            }
            isSubscribedRef.current = false;
        };
    }, [empresaToken]); // Solo depende de empresaToken
}