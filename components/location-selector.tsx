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
  occupiedLocationIds: number[]
}

export function LocationSelector({
  selectedLocation,
  onLocationSelect,
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
    <div className="space-y-2 text-xs">
      {/* Top bar: Title + Search */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Ubicaciones</span>
          <span className="bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
            {ubicaciones.length}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => {
              setShowSearch(!showSearch)
              if (showSearch) setSearchTerm("")
            }}
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {showSearch && (
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="h-6 text-xs pl-7 pr-6"
          />
          <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
          {searching ? (
            <div className="absolute right-2 top-1.5 h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : searchTerm ? (
            <button
              className="absolute right-2 top-1.5 text-muted-foreground"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto pr-1">
        {loading || searching ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-6 px-2 w-25 bg-muted rounded animate-pulse"
            ></div>
          ))
        ) : ubicaciones.length > 0 ? (
          ubicaciones.map((location) => (
            <button
              key={location.id}
              onClick={() => onLocationSelect(location)}
              className={`flex items-center gap-1 h-6 px-2 rounded border transition-all ${
                selectedLocation?.id === location.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted hover:bg-muted/70 border-transparent text-muted-foreground"
              }`}
            >
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{location.nombre}</span>

              {occupiedLocationIds.includes(location.id) && (
                <div className="ml-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))
        ) : (
          <p className="text-muted-foreground mt-1">
            {searchTerm
              ? `No hay resultados para "${searchTerm}"`
              : "No hay ubicaciones disponibles"}
          </p>
        )}
      </div>
    </div>
  )
}