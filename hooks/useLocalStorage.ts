'use client';
import { useState, useEffect, useCallback } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Leer el valor del localStorage solo en el cliente
    useEffect(() => {
        if (!isClient) return;

        try {
            const item = window.localStorage.getItem(key);
            console.log(`📖 Leyendo localStorage key "${key}":`, item);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.error(`❌ Error reading localStorage key "${key}":`, error);
        }
    }, [key, isClient]);

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        if (!isClient) return;

        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            console.log(`💾 Guardando en localStorage key "${key}":`, valueToStore);
        } catch (error) {
            console.error(`❌ Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue, isClient]);

    const removeValue = useCallback(() => {
        if (!isClient) return;

        try {
            setStoredValue(initialValue);
            window.localStorage.removeItem(key);
            console.log(`🗑️ Eliminando localStorage key "${key}"`);
        } catch (error) {
            console.error(`❌ Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue, isClient]);

    return [storedValue, setValue, removeValue] as const;
};