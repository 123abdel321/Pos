"use client"

import { useState, useEffect, useRef } from "react" // 🔥 Agregar useRef
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Barcode } from "lucide-react" // 🔥 Agregar Barcode
import { Producto, Familia } from '@/types/producto'
import apiClient from "@/app/api/apiClient"

interface ProductGridProps {
  onProductSelect: (product: Producto, quantity?: number) => void
}

export function ProductGrid({ onProductSelect }: ProductGridProps) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([])
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null) // 🔥 Ref para el input

  // 🔥 Focus automático al cargar el componente
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // 🔥 Focus cuando se hace clic en cualquier parte del grid (backup)
  const handleGridClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Cargar familias y productos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Cargar familias
        const familiasResponse = await apiClient.get('/familia/combo-familia')
        const familiasData = familiasResponse.data.data || familiasResponse.data
        setFamilias(Array.isArray(familiasData) ? familiasData : [])
        
        // Cargar productos
        const productosResponse = await apiClient.get('/producto/combo-producto')
        const productosData = productosResponse.data.data || productosResponse.data
        setProductos(Array.isArray(productosData) ? productosData : [])
        setFilteredProducts(Array.isArray(productosData) ? productosData : [])
        
      } catch (error) {
        console.error('Error loading data:', error)
        setProductos([])
        setFamilias([])
        setFilteredProducts([])
      } finally {
        setLoading(false)
        
        // 🔥 Focus después de cargar
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus()
          }
        }, 100)
      }
    }

    loadInitialData()
  }, [])

  // Búsqueda en tiempo real - MODIFICADO
  useEffect(() => {
    const searchProducts = async () => {
      // Si no hay término, cargar TODOS los productos
      if (!searchTerm.trim()) {
        setSearching(true)
        try {
          const response = await apiClient.get('/producto/combo-producto')
          const data = response.data.data || response.data
          setProductos(Array.isArray(data) ? data : [])
        } catch (error) {
          console.error('Error loading all products:', error)
          setProductos([])
        } finally {
          setSearching(false)
        }
        return
      }

      // Si hay término de búsqueda
      try {
        setSearching(true)
        const response = await apiClient.get('/producto/combo-producto', {
          params: { search: searchTerm }
        })
        
        const data = response.data.data || response.data
        setProductos(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error searching products:', error)
      } finally {
        setSearching(false)
      }
    }

    const timeoutId = setTimeout(() => {
      searchProducts()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // 🔥 Manejar el evento keydown para shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl + / para focus (común en muchos sistemas)
    console.log('e.ctrlKey: ',e.ctrlKey);
    console.log('e.key: ',e.key);
    if (e.ctrlKey && e.key === 'b') {
      console.log('si??');
      e.preventDefault()
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }
    
    // Escape para limpiar búsqueda
    if (e.key === 'Escape') {
      setSearchTerm("")
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }
  }

  // Filtrar productos por categoría
  useEffect(() => {
    let filtered = productos

    if (selectedCategory !== "todos") {
      filtered = filtered.filter((product) =>
        product.familia.nombre.toLowerCase().includes(selectedCategory.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [productos, selectedCategory])

  // Generar categorías desde las familias
  const categories = [
    { id: "todos", name: "TODOS", active: true },
    ...familias.map(familia => ({
      id: familia.nombre.toLowerCase(),
      name: familia.nombre.toUpperCase()
    }))
  ]

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number.parseFloat(price))
  }

  const getStockStatus = (quantity: string) => {
    const stock = Number.parseFloat(quantity)
    if (stock <= 0) return { color: "destructive", text: "Sin stock" }
    if (stock <= 5 && stock > 0) return { color: "warning", text: "Poco stock" }
    return { color: "success", text: "En stock" }
  }

  const getImageUrl = (imagenPath: string | null) => {
    if (!imagenPath) return null
    if (imagenPath.startsWith('http')) return imagenPath
    return 'https://porfaolioerpbucket.nyc3.digitaloceanspaces.com/' + imagenPath.replace(/^\//, '')
  }

  const getTotalStock = (inventarios: any[]) => {
    return inventarios.reduce((total, inv) => total + Number.parseFloat(inv.cantidad), 0)
  }

  return (
    <div className="p-4"> {/* 🔥 Click en grid para focus */}
      {/* Search MEJORADO para código de barras */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2">
          <Barcode className="h-5 w-5 text-primary" /> {/* 🔥 Icono de código de barras */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef} // 🔥 Ref para auto-focus
              placeholder="Escanear código de barras o buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown} // 🔥 Shortcuts de teclado
              className="pl-10 pr-10 text-lg py-2" // 🔥 Texto más grande para mejor visibilidad
              autoFocus // 🔥 Auto-focus nativo
            />
            {(searching || (searchTerm === "" && loading)) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* 🔥 Indicador de shortcuts */}
        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
          <span>Presiona Esc para limpiar</span>
          <span>Ctrl + / para focus</span>
        </div>
      </div>

      {/* Resto del código permanece igual */}
      <div className="flex flex-wrap gap-1 mb-4">
        <span
          onClick={() => setSelectedCategory("todos")}
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
            selectedCategory === "todos" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          TODOS
        </span>
        {categories.slice(1, 12).map((category) => (
          <span
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
              selectedCategory === category.id 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {category.name.split(' ')[0]}
          </span>
        ))}
        {categories.length > 12 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
            +{categories.length - 12}
          </span>
        )}
      </div>

      {/* Products Count */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Productos: {filteredProducts.length}
        </p>
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearchTerm("")
              if (searchInputRef.current) {
                searchInputRef.current.focus()
              }
            }}
            className="text-xs"
          >
            Limpiar búsqueda
          </Button>
        )}
      </div>

      {/* Products Grid */}
      {loading || searching ? (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-24 bg-muted rounded mb-3"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filteredProducts.map((product) => {
            const totalStock = getTotalStock(product.inventarios)
            const stockStatus = getStockStatus(totalStock)
            
            return (
              <Card
                key={product.id}
                className="cursor-pointer transition-all hover:shadow-lg group border overflow-hidden grid grid-rows-[120px_1fr] h-full"
                onClick={(e) => {
                  e.stopPropagation() // ← ESTO ES IMPORTANTE
                  onProductSelect(product)
                  // Re-focus al input después de seleccionar producto
                  setTimeout(() => {
                    searchInputRef.current?.focus()
                  }, 100)
                }}
              >
                {/* Header con Imagen, Familia y Código */}
                <div className="h-32 bg-muted relative overflow-hidden">
                  {product.familia?.nombre && (
                    <div className="absolute top-1 left-1 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-sm z-10 font-medium uppercase tracking-wider backdrop-blur-[1px]">
                      {product.familia.nombre}
                    </div>
                  )}

                  <div className="absolute top-1 right-1 text-xs text-white bg-black/40 px-2 py-0.5 rounded-sm z-10 font-mono backdrop-blur-[1px]">
                    {product.codigo}
                  </div>

                  {product.imagen ? (
                    <img 
                      src={`${getImageUrl(product.imagen)}`} 
                      alt={product.nombre}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-3 grid grid-rows-[auto_1fr_auto] gap-1 h-full">
                  <h3 className="font-bold text-sm line-clamp-2 leading-snug text-center min-h-[2.5rem] flex items-center justify-center">
                    {product.nombre}
                  </h3>

                  {/* Ajuste de precio mejorado */}
                  <div className="text-center flex items-center justify-center py-1">
                    {(() => {
                      const precioNumber = Number(product.precio); // Aseguramos número
                      const formattedPrice = formatPrice(`${precioNumber}`);
                      const isHighPrice = precioNumber >= 1000000; // Más de un millón

                      return (
                        <div
                          className={`${
                            isHighPrice ? "text-base" : "text-xl"
                          } font-bold text-primary/90 transition-opacity duration-300 group-hover:text-primary`}
                        >
                          {formattedPrice}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2 mt-auto border-t pt-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        stockStatus.color === "destructive"
                          ? "bg-destructive"
                          : stockStatus.color === "warning"
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                    ></div>
                    <span className="text-xs text-muted-foreground flex-1">
                      {stockStatus.text}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {totalStock}
                    </span>
                  </div>
                </div>
              </Card>
            );

          })}
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && !loading && !searching && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No se encontraron productos</p>
          {searchTerm && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSearchTerm("")
                if (searchInputRef.current) {
                  searchInputRef.current.focus()
                }
              }}
            >
              Ver todos los productos
            </Button>
          )}
        </div>
      )}
    </div>
  )
}