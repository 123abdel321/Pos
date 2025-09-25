"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Plus, Search } from "lucide-react"

interface Location {
  id: number
  codigo: string
  nombre: string
  text: string
  pedido: any
}

interface LocationSelectorProps {
  selectedLocation: Location | null
  onLocationSelect: (location: Location) => void
  onNewOrder: (locationId?: number, locationName?: string) => void
}

export function LocationSelector({ selectedLocation, onLocationSelect, onNewOrder }: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data with more locations to demonstrate search functionality
    const mockLocations: Location[] = [
      { id: 1, codigo: "01", nombre: "MESA 1", text: "MESA 1", pedido: null },
      { id: 2, codigo: "02", nombre: "MESA 2", text: "MESA 2", pedido: null },
      { id: 3, codigo: "03", nombre: "MESA 3", text: "MESA 3", pedido: null },
      { id: 4, codigo: "04", nombre: "MESA 4", text: "MESA 4", pedido: null },
      { id: 5, codigo: "05", nombre: "MESA 5", text: "MESA 5", pedido: null },
      { id: 6, codigo: "06", nombre: "MESA 6", text: "MESA 6", pedido: null },
      { id: 7, codigo: "07", nombre: "MOSTRADOR", text: "MOSTRADOR", pedido: null },
      { id: 8, codigo: "08", nombre: "TERRAZA 1", text: "TERRAZA 1", pedido: null },
      { id: 9, codigo: "09", nombre: "TERRAZA 2", text: "TERRAZA 2", pedido: null },
      { id: 10, codigo: "10", nombre: "TERRAZA 3", text: "TERRAZA 3", pedido: null },
      { id: 11, codigo: "11", nombre: "BARRA 1", text: "BARRA 1", pedido: null },
      { id: 12, codigo: "12", nombre: "BARRA 2", text: "BARRA 2", pedido: null },
      { id: 13, codigo: "13", nombre: "VIP 1", text: "VIP 1", pedido: null },
      { id: 14, codigo: "14", nombre: "VIP 2", text: "VIP 2", pedido: null },
      { id: 15, codigo: "15", nombre: "SALON PRINCIPAL", text: "SALON PRINCIPAL", pedido: null },
    ]

    setLocations(mockLocations)
    setFilteredLocations(mockLocations)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredLocations(locations)
    } else {
      const filtered = locations.filter(
        (location) =>
          location.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.codigo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredLocations(filtered)
    }
  }, [searchTerm, locations])

  if (loading) {
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
        <h2 className="text-lg font-semibold text-foreground">Ubicaciones</h2>
        <Button size="sm" onClick={() => onNewOrder()} className="gap-2">
          <Plus className="h-4 w-4" />
          Venta Rápida
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-32 overflow-y-auto">
        {filteredLocations.map((location) => (
          <Card
            key={location.id}
            className={`p-2 cursor-pointer transition-all hover:bg-accent text-center ${
              selectedLocation?.id === location.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-accent"
            }`}
            onClick={() => {
              onLocationSelect(location)
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <MapPin className="h-4 w-4" />
              <div className="text-xs font-medium truncate w-full">{location.nombre}</div>
              {location.pedido && <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>}
            </div>
          </Card>
        ))}
      </div>

      {filteredLocations.length === 0 && searchTerm && (
        <div className="text-center text-muted-foreground py-4">
          No se encontraron ubicaciones que coincidan con "{searchTerm}"
        </div>
      )}
    </div>
  )
}
