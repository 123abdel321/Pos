"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Plus, Search, X } from "lucide-react"
import { Ubicacion } from '@/types/ubicacion'
import apiClient from "@/app/api/apiClient"

interface LocationSelectorProps {
  selectedLocation: Ubicacion | null
  onLocationSelect: (location: Ubicacion) => void
  onNewOrder: (locationId?: number, locationName?: string) => void
}

export function LocationSelector({ selectedLocation, onLocationSelect, onNewOrder }: LocationSelectorProps) {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false) // 🔥 Nuevo estado para búsqueda
  const [showSearch, setShowSearch] = useState(false)

  // Búsqueda en backend
  useEffect(() => {
    const searchLocations = async () => {
      try {
        setSearching(true) // 🔥 Solo indicar que está buscando
        const response = await apiClient.get('/ubicaciones-combo-general', {
          params: { search: searchTerm }
        })
        
        const data = response.data
        if (data.data && Array.isArray(data.data)) {
          setUbicaciones(data.data)
        } else {
          setUbicaciones([])
        }
      } catch (error) {
        console.error('Error searching ubicaciones:', error)
        setUbicaciones([])
      } finally {
        setLoading(false)
        setSearching(false) // 🔥 Fin de búsqueda
      }
    }

    const timeoutId = setTimeout(() => {
      // Solo hacer búsqueda si hay término o si es la carga inicial
      if (searchTerm || ubicaciones.length === 0) {
        searchLocations()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Loading inicial (solo primera vez)
  if (loading && ubicaciones.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-2 animate-pulse">
              <div className="h-12 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Ubicaciones</h2>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {ubicaciones.length}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowSearch(!showSearch)
              if (showSearch) setSearchTerm("")
            }}
            className="h-8 w-8 p-0 rounded-full"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <Button size="sm" onClick={() => onNewOrder()} className="gap-2">
          <Plus className="h-4 w-4" />
          Venta Rápida
        </Button>
      </div>

      {showSearch && (
        <div className="relative animate-in fade-in-50">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
            autoFocus
          />
          {/* 🔥 Icono de loading en la búsqueda */}
          {searching ? (
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : searchTerm ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      )}

      {/* Grid SIN scroll bar */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 overflow-hidden">
        {/* 🔥 Muestra skeleton solo durante búsqueda */}
        {searching ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-2 animate-pulse">
              <div className="flex flex-col items-center gap-1">
                <div className="h-4 w-4 bg-muted rounded"></div>
                <div className="h-3 w-full bg-muted rounded"></div>
              </div>
            </Card>
          ))
        ) : ubicaciones.length > 0 ? (
          ubicaciones.map((location) => (
            <Card
              key={location.id}
              className={`p-2 cursor-pointer transition-all duration-200 text-center group relative ${
                selectedLocation?.id === location.id
                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                  : "bg-card border-border hover:bg-accent hover:shadow-sm hover:border-muted-foreground/30"
              }`}
              onClick={() => onLocationSelect(location)}
            >
              <div className="flex flex-col items-center gap-1">
                <MapPin className={`h-4 w-4 transition-colors ${
                  selectedLocation?.id === location.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                }`} />
                
                <div className={`text-xs font-medium truncate w-full ${
                  selectedLocation?.id === location.id ? "text-primary-foreground" : "text-foreground"
                }`}>
                  {location.nombre}
                </div>
                
                {location.pedido && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-background shadow-sm"></div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-4 bg-muted/30 rounded-lg border border-dashed">
            {searchTerm ? (
              <div>
                <p>No se encontraron ubicaciones para "{searchTerm}"</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  Limpiar búsqueda
                </Button>
              </div>
            ) : (
              <p>No hay ubicaciones disponibles</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}