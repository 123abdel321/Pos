"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Plus, Search, X } from "lucide-react"
import { Ubicacion } from "@/types/ubicacion"
import apiClient from "@/app/api/apiClient"

interface LocationSelectorProps {
  selectedLocation: Ubicacion | null
  onLocationSelect: (location: Ubicacion) => void
  onNewOrder: (locationId?: number, locationName?: string) => void
  occupiedLocationIds: number[]
}

export function LocationSelector({
  selectedLocation,
  onLocationSelect,
  onNewOrder,
  occupiedLocationIds,
}: LocationSelectorProps) {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setSearching(true)
        const response = await apiClient.get("/ubicaciones-combo-general", {
          params: { search: searchTerm },
        })
        setUbicaciones(response.data.data || [])
      } catch {
        setUbicaciones([])
      } finally {
        setLoading(false)
        setSearching(false)
      }
    }

    const timeout = setTimeout(() => {
      fetchData()
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchTerm])

  return (
    <div className="space-y-2 text-sm">
      {/* Top bar: Title + Search + Rápida */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Ubicaciones</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            {ubicaciones.length}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setShowSearch(!showSearch)
              if (showSearch) setSearchTerm("")
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2 py-1 text-xs "
          onClick={() => onNewOrder()}
        >
          <Plus className="h-3 w-3 mr-0" />
          Venta Rápida
        </Button>
      </div>

      {/* Search input (inline) */}
      {showSearch && (
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="h-7 text-xs pl-8 pr-6"
          />
          <Search className="absolute left-2 top-1.5 h-4 w-4 text-muted-foreground" />
          {searching ? (
            <div className="absolute right-2 top-1.5 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : searchTerm ? (
            <button
              className="absolute right-2 top-1.5 text-muted-foreground"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      )}

      {/* Grid como "chips" */}
      <div className="flex flex-wrap gap-1 max-h-[110px] overflow-y-auto pr-1">
        {loading || searching ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-7 px-3 bg-muted rounded-md animate-pulse text-xs"
            ></div>
          ))
        ) : ubicaciones.length > 0 ? (
          ubicaciones.map((location) => (
            <button
              key={location.id}
              onClick={() => onLocationSelect(location)}
              className={`flex items-center gap-1 h-7 px-2 text-xs rounded-md border transition-all ${
                selectedLocation?.id === location.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted hover:bg-muted/70 border-transparent text-muted-foreground"
              }`}
            >
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{location.nombre}</span>

              {occupiedLocationIds.includes(location.id) && (
                <div className="ml-1 w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </button>
          ))
        ) : (
          <p className="text-xs text-muted-foreground mt-2">
            {searchTerm
              ? `No hay resultados para "${searchTerm}"`
              : "No hay ubicaciones disponibles"}
          </p>
        )}
      </div>
    </div>
  )
}
