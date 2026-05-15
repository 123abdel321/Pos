"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, X } from "lucide-react";
import { Ubicacion } from "@/types/ubicacion";
import apiClient from "@/app/api/apiClient";
import { cn } from "@/lib/utils";

interface LocationSelectorProps {
    selectedLocation: Ubicacion | null;
    onLocationSelect: (location: Ubicacion) => void;
    occupiedLocationIds: number[];
}

export function LocationSelector({
    selectedLocation,
    onLocationSelect,
    occupiedLocationIds,
}: LocationSelectorProps) {
    const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setSearching(true);
                const response = await apiClient.get("/ubicaciones-combo-general", {
                    params: { search: searchTerm },
                });
                setUbicaciones(response.data.data || []);
            } catch {
                setUbicaciones([]);
            } finally {
                setLoading(false);
                setSearching(false);
            }
        };

        const timeout = setTimeout(fetchData, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    if (ubicaciones.length === 0 && !loading && !searchTerm) return null;

    return (
        <div className="space-y-1.5">
            {/* Encabezado compacto */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium">Ubicaciones</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded-full text-[10px]">
                        {ubicaciones.length}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                        setShowSearch(!showSearch);
                        if (showSearch) setSearchTerm("");
                    }}
                >
                    <Search className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Campo de búsqueda (opcional) */}
            {showSearch && (
                <div className="relative">
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar ubicación..."
                        className="h-7 text-xs pl-7 pr-6"
                    />
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                    {searching ? (
                        <div className="absolute right-2 top-1.5 h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : searchTerm ? (
                        <button
                            className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground"
                            onClick={() => setSearchTerm("")}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    ) : null}
                </div>
            )}

            {/* Lista de ubicaciones (wrap responsivo con scroll horizontal si es necesario) */}
            <div className="flex flex-wrap gap-1.5 max-h-12 overflow-y-auto">
                {loading || searching ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-6 w-16 rounded-md bg-muted animate-pulse"
                        ></div>
                    ))
                ) : ubicaciones.length > 0 ? (
                    ubicaciones.map((location) => {
                        const isSelected = selectedLocation?.id === location.id;
                        const isOccupied = occupiedLocationIds.includes(location.id);
                        return (
                            <button
                                key={location.id}
                                onClick={() => onLocationSelect(location)}
                                className={cn(
                                    "inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-medium transition-all",
                                    isSelected
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/80 hover:bg-muted text-foreground border border-transparent hover:border-border",
                                    isOccupied && !isSelected && "border-l-2 border-l-amber-500"
                                )}
                            >
                                <MapPin className="h-2.5 w-2.5" />
                                <span className="max-w-[100px] truncate">{location.nombre}</span>
                                {isOccupied && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                )}
                            </button>
                        );
                    })
                ) : (
                    <p className="text-xs text-muted-foreground py-1">
                        {searchTerm
                            ? `Sin resultados para "${searchTerm}"`
                            : "No hay ubicaciones"}
                    </p>
                )}
            </div>
        </div>
    );
}