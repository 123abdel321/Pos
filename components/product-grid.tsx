"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Package } from "lucide-react"
import type { Product } from "@/app/page"

interface ProductGridProps {
  onProductSelect: (product: Product, quantity?: number) => void
}

const categories = [
  { id: "todos", name: "TODOS", active: true },
  { id: "servicios", name: "SERVICIOS GENERALES" },
  { id: "electrico", name: "ELÉCTRICO" },
  { id: "frenos", name: "FRENOS" },
  { id: "mecanica", name: "MECÁNICA" },
  { id: "rodamientos", name: "RODAMIENTOS" },
  { id: "lubricantes", name: "LUBRICANTES" },
]

export function ProductGrid({ onProductSelect }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data based on the API structure
    const mockProducts: Product[] = [
      {
        id: 1,
        codigo: "01",
        nombre: "LIMPIEZA GENERAL",
        precio: "5500.00",
        inventarios: [{ cantidad: "10.00" }],
        familia: { nombre: "SERVICIOS" },
      },
      {
        id: 2,
        codigo: "02",
        nombre: "BOMBILLO HELLA H4 35/35W",
        precio: "14000.00",
        inventarios: [{ cantidad: "5.00" }],
        familia: { nombre: "ELÉCTRICO" },
      },
      {
        id: 3,
        codigo: "03",
        nombre: "BOMBILLO HELLA H51 M",
        precio: "14500.00",
        inventarios: [{ cantidad: "3.00" }],
        familia: { nombre: "ELÉCTRICO" },
      },
      {
        id: 4,
        codigo: "04",
        nombre: "BOMBILLO OSRAM H51 12V 35/35W",
        precio: "15000.00",
        inventarios: [{ cantidad: "8.00" }],
        familia: { nombre: "ELÉCTRICO" },
      },
      {
        id: 5,
        codigo: "05",
        nombre: "BOMBILLO SUPER BRIGHT 6A/55W",
        precio: "6000.00",
        inventarios: [{ cantidad: "12.00" }],
        familia: { nombre: "ELÉCTRICO" },
      },
      {
        id: 6,
        codigo: "06",
        nombre: "BOMBILLO NARVA S2 ESTÁNDAR",
        precio: "15000.00",
        inventarios: [{ cantidad: "6.00" }],
        familia: { nombre: "ELÉCTRICO" },
      },
    ]

    setProducts(mockProducts)
    setFilteredProducts(mockProducts)
    setLoading(false)
  }, [])

  useEffect(() => {
    let filtered = products

    if (selectedCategory !== "todos") {
      filtered = filtered.filter((product) =>
        product.familia.nombre.toLowerCase().includes(selectedCategory.toLowerCase()),
      )
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.codigo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredProducts(filtered)
  }, [products, selectedCategory, searchTerm])

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number.parseFloat(price))
  }

  const getStockStatus = (quantity: string) => {
    const stock = Number.parseFloat(quantity)
    if (stock === 0) return { color: "destructive", text: "Sin stock" }
    if (stock <= 5) return { color: "warning", text: "Poco stock" }
    return { color: "success", text: "En stock" }
  }

  return (
    <div className="p-4">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="text-xs"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Products Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">Productos: {filteredProducts.length}</p>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-32 bg-muted rounded mb-3"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => {
            const stock = product.inventarios[0]?.cantidad || "0"
            const stockStatus = getStockStatus(stock)

            return (
              <Card
                key={product.id}
                className="p-4 cursor-pointer transition-all hover:bg-accent group"
                onClick={() => onProductSelect(product)}
              >
                <div className="flex flex-col h-full">
                  {/* Product Image Placeholder */}
                  <div className="flex items-center justify-center h-24 bg-muted rounded mb-3 group-hover:bg-muted/80">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">{product.codigo}</div>
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.nombre}</h3>
                    <div className="text-lg font-bold text-primary mb-2">{formatPrice(product.precio)}</div>
                  </div>

                  {/* Stock Badge */}
                  <div className="flex justify-between items-center">
                    <Badge variant={stockStatus.color as any} className="text-xs">
                      {stockStatus.text}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Stock: {stock}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}
    </div>
  )
}
