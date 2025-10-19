"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- TIPOS ---
interface ConfirmationOptions {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'ghost';
    key?: string; 
}

interface ConfirmationContextValue {
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

// --- CONTEXTO ---
const ConfirmationContext = createContext<ConfirmationContextValue | undefined>(undefined)

export function useConfirmation() {
    const context = useContext(ConfirmationContext)
    if (!context) {
        throw new Error("useConfirmation must be used within a ConfirmationProvider")
    }
    return context
}

// --- ESTADO DEL MODAL ---
interface ConfirmationState extends ConfirmationOptions {
    isOpen: boolean;
    resolvePromise: ((value: boolean) => void) | null;
}

// --- COMPONENTE MODAL GENÉRICO ---
function ConfirmationModal({ state, onClose, onConfirm, onCancel }: { 
    state: ConfirmationState, 
    onClose: () => void, 
    onConfirm: () => void, 
    onCancel: () => void 
}) {
    if (!state.isOpen) return null;

    const { 
        title = "¿Estás seguro?", 
        message = "Esta acción es irreversible. ¿Deseas continuar?", 
        confirmText = "Confirmar", 
        cancelText = "Cancelar",
        confirmButtonVariant = 'destructive'
    } = state;

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 slide-in-from-top-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {title}
                        </h2>
                    </div>
                    <button 
                        onClick={onCancel} 
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200"
                        aria-label="Cerrar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 py-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer - Botones */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-8 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl border-t border-slate-200 dark:border-slate-700">
                    <Button 
                        variant="outline" 
                        onClick={onCancel}
                        className="w-full sm:w-auto px-8 py-2.5 text-sm font-medium"
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        variant={confirmButtonVariant}
                        onClick={onConfirm}
                        className={`w-full sm:w-auto px-8 py-2.5 text-sm font-medium transition-all duration-200 ${
                            confirmButtonVariant === 'destructive' 
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg' 
                                : ''
                        }`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- PROVIDER ---
export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ConfirmationState>({
        isOpen: false,
        resolvePromise: null,
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;

            setState({
                ...options,
                isOpen: true,
                resolvePromise: resolve,
            });
        });
    }, []);

    const handleClose = useCallback((result: boolean) => {
        if (resolveRef.current) {
            resolveRef.current(result);
        }
        
        setState(prev => ({ 
            ...prev, 
            isOpen: false, 
            resolvePromise: null,
        }));
        resolveRef.current = null;
    }, []);

    const handleConfirm = () => handleClose(true);
    const handleCancel = () => handleClose(false);

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}
            <ConfirmationModal 
                state={state} 
                onClose={handleCancel}
                onConfirm={handleConfirm} 
                onCancel={handleCancel}
            />
        </ConfirmationContext.Provider>
    );
}