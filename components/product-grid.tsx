// components/product-grid.tsx

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Barcode } from "lucide-react" 
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
  const searchInputRef = useRef<HTMLInputElement>(null) 

  // Focus automático
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        const familiasResponse = await apiClient.get('/familia/combo-familia')
        const familiasData = familiasResponse.data.data || familiasResponse.data
        setFamilias(Array.isArray(familiasData) ? familiasData : [])
        
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
        
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus()
          }
        }, 100)
      }
    }

    loadInitialData()
  }, [])

  // Lógica de búsqueda con debounce
  useEffect(() => {
    const searchProducts = async () => {
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

  // Lógica de filtrado por categoría
  useEffect(() => {
    let filtered = productos

    if (selectedCategory !== "todos") {
      filtered = filtered.filter((product) =>
        product.familia.nombre.toLowerCase().includes(selectedCategory.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [productos, selectedCategory])
  
  // Handlers y Helpers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key === '/') { 
      e.preventDefault()
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }
    
    if (e.key === 'Escape') {
      setSearchTerm("")
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }
  }

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

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { color: "destructive", text: "Sin stock" }
    if (quantity <= 5 && quantity > 0) return { color: "warning", text: "Poco stock" }
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

  // 🔥 FIX DE SINTAXIS APLICADO: El paréntesis de apertura se coloca
  // en la misma línea que 'return' para evitar el error de ASI.
  return ( 
    <div className="p-3 sm:p-4"> {/* Menos padding en móvil */}
      {/* Search MEJORADO para código de barras */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2">
          <Barcode className="h-5 w-5 text-primary" />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Escanear código de barras o buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10 text-base py-2 h-10 sm:text-lg sm:h-12" 
              autoFocus
            />
            {(searching || (searchTerm === "" && loading)) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Indicador de shortcuts */}
        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
          <span>Presiona Esc para limpiar</span>
          <span>Ctrl + / para focus</span>
        </div>
      </div>

      {/* Categorías */}
      <div className="flex flex-wrap gap-1 mb-4 max-h-16 overflow-y-auto">
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
        {categories.slice(1, 15).map((category) => ( 
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
        {categories.length > 15 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
            +{categories.length - 15}
          </span>
        )}
      </div>

      {/* Products Count */}
      <div className="mb-4 flex justify-between items-center border-b pb-2">
        <p className="text-sm font-semibold text-foreground">
          Productos encontrados: {filteredProducts.length}
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

      {/* Products Grid - CLASES RESPONSIVAS AJUSTADAS */}
      {loading || searching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"> {/* Ajustes de columnas */}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"> {/* AJUSTE DE RESPONSIVIDAD */}
          {filteredProducts.map((product) => {
            const totalStock = getTotalStock(product.inventarios)
            const stockStatus = getStockStatus(totalStock)
            
            return (
              <Card
                key={product.id}
                className="cursor-pointer transition-all hover:shadow-lg group border overflow-hidden grid grid-rows-[100px_1fr] h-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onProductSelect(product)
                  
                  setTimeout(() => {
                    searchInputRef.current?.focus()
                  }, 100)
                }}
              >
                {/* Header con Imagen, Familia y Código */}
                <div className="h-24 bg-muted relative overflow-hidden"> 
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
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-2 grid grid-rows-[auto_1fr_auto] gap-1 h-full"> 
                  <h3 className="font-bold text-xs line-clamp-2 leading-snug text-center min-h-[2rem] flex items-center justify-center"> 
                    {product.nombre}
                  </h3>

                  {/* Ajuste de precio mejorado */}
                  <div className="text-center flex items-center justify-center py-1">
                    {(() => {
                      const precioNumber = Number(product.precio);
                      const formattedPrice = formatPrice(`${precioNumber}`);
                      const isHighPrice = precioNumber >= 1000000;

                      return (
                        <div
                          className={`${
                            isHighPrice ? "text-base" : "text-lg" 
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
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded"> 
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