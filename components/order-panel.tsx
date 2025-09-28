"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  CreditCard, 
  X, 
  Edit, 
  User,
  Search,
  ChevronDown,
  Warehouse // 🔥 Nuevo icono para bodega
} from "lucide-react"
import { ProductEditModal } from "./product-edit-modal"
import type { Order, OrderItem, Cliente, Bodega } from "@/app/page"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import apiClient from "@/app/api/apiClient"

interface OrderPanelProps {
  currentOrder: Order | null
  onCompleteOrder: () => void
  onNewOrder: () => void
  onUpdateQuantity: (productId: number, newQuantity: number) => void
  onRemoveProduct: (productId: number) => void
  onCancelOrder: () => void
  onUpdateProduct?: (updatedProduct: OrderItem) => void
  onUpdateCliente?: (cliente: Cliente | null) => void
  onUpdateBodega?: (bodega: Bodega | null) => void
}

export function OrderPanel({
  currentOrder,
  onCompleteOrder,
  onNewOrder,
  onUpdateQuantity,
  onRemoveProduct,
  onCancelOrder,
  onUpdateProduct,
  onUpdateCliente,
  onUpdateBodega,
}: OrderPanelProps) {
  const [editingProduct, setEditingProduct] = useState<OrderItem | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [bodegas, setBodegas] = useState<Bodega[]>([])
  const [searchCliente, setSearchCliente] = useState("")
  const [searchBodega, setSearchBodega] = useState("")
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loadingBodegas, setLoadingBodegas] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null)

  // Cargar clientes
  useEffect(() => {
    const loadClientes = async () => {
      try {
        setLoadingClientes(true)
        const response = await apiClient.get('/nit/combo-nit')
        const data = response.data.data || response.data
        setClientes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error loading clientes:', error)
        setClientes([])
      } finally {
        setLoadingClientes(false)
      }
    }

    loadClientes()
  }, [])

  // Cargar bodegas
  useEffect(() => {
    const loadBodegas = async () => {
      try {
        setLoadingBodegas(true)
        const response = await apiClient.get('/bodega/combo-bodega')
        const data = response.data.data || response.data
        setBodegas(Array.isArray(data) ? data : [])
        
        // Seleccionar la primera bodega por defecto
        if (data.length > 0 && !selectedBodega) {
          setSelectedBodega(data[0])
          if (onUpdateBodega) {
            onUpdateBodega(data[0])
          }
        }
      } catch (error) {
        console.error('Error loading bodegas:', error)
        setBodegas([])
      } finally {
        setLoadingBodegas(false)
      }
    }

    loadBodegas()
  }, [])

  // Filtrar clientes basado en búsqueda
  const filteredClientes = clientes.filter(cliente =>
    cliente.text.toLowerCase().includes(searchCliente.toLowerCase()) ||
    cliente.nombre_completo.toLowerCase().includes(searchCliente.toLowerCase())
  )

  // Filtrar bodegas basado en búsqueda
  const filteredBodegas = bodegas.filter(bodega =>
    bodega.text.toLowerCase().includes(searchBodega.toLowerCase()) ||
    bodega.nombre.toLowerCase().includes(searchBodega.toLowerCase())
  )

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setSearchCliente("")
    if (onUpdateCliente) {
      onUpdateCliente(cliente)
    }
  }

  const handleRemoveCliente = () => {
    setSelectedCliente(null)
    if (onUpdateCliente) {
      onUpdateCliente(null)
    }
  }

  const handleSelectBodega = async (bodega: Bodega) => {
    setSelectedBodega(bodega)
    setSearchBodega("")
    if (onUpdateBodega) {
      onUpdateBodega(bodega)
    }
  }

  const handleRemoveBodega = () => {
    setSelectedBodega(null)
    if (onUpdateBodega) {
      onUpdateBodega(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleEditProduct = (product: OrderItem) => {
    setEditingProduct(product)
  }

  const handleSaveProduct = (updatedProduct: OrderItem) => {
    if (onUpdateProduct) {
      onUpdateProduct(updatedProduct)
    }
    setEditingProduct(null)
  }

  if (!currentOrder) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Pedido Actual</h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No hay pedido activo</h3>
            <p className="text-muted-foreground mb-6">Selecciona una ubicación o inicia una venta rápida</p>
            <Button onClick={onNewOrder} className="gap-2 btn-bg-info">
              <Plus className="h-4 w-4" />
              Nuevo Pedido
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-2 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Pedido</h2>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] px-1 py-[1px]">
                {currentOrder.estado}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancelOrder}
                className="h-4 w-4 p-0 text-destructive hover:text-destructive btn-bg-danger"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground mt-1 leading-tight">
            <div>{currentOrder.ubicacion_nombre}</div>
            <div>{formatDateTime(currentOrder.fecha)}</div>
          </div>

          {/* Selector de Bodega y Cliente en grid */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {/* Bodega */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium">Bodega</label>
              {selectedBodega ? (
                <div className="flex items-center justify-between p-1 border rounded bg-muted/30">
                  <div className="flex items-center gap-1">
                    <Warehouse className="h-3 w-3 text-muted-foreground" />
                    <div className="text-[11px] leading-tight">
                      <div className="font-medium">{selectedBodega.codigo}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                        {selectedBodega.nombre}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveBodega}
                    className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-7 px-2 text-[11px]">
                      <div className="flex items-center gap-1">
                        <Warehouse className="h-3 w-3" />
                        <span>Bodega</span>
                      </div>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-1">
                    <div className="relative mb-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Buscar bodega..."
                        value={searchBodega}
                        onChange={(e) => setSearchBodega(e.target.value)}
                        className="pl-6 h-6 text-xs"
                      />
                    </div>
                    <div className="max-h-44 overflow-auto">
                      {loadingBodegas ? (
                        <div className="text-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                          <p className="text-[10px] mt-1">Cargando...</p>
                        </div>
                      ) : filteredBodegas.length > 0 ? (
                        filteredBodegas.map((bodega) => (
                          <DropdownMenuItem
                            key={bodega.id}
                            onClick={() => handleSelectBodega(bodega)}
                            className="flex flex-col items-start p-2 mb-1 hover:bg-accent rounded"
                          >
                            <div className="font-medium text-[11px] leading-tight">
                              {bodega.codigo} - {bodega.nombre}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{bodega.ubicacion}</div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="text-center py-2 text-muted-foreground text-[11px]">
                          Sin resultados
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Cliente */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium">Cliente</label>
              {selectedCliente ? (
                <div className="flex items-center justify-between p-1 border rounded bg-muted/30">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <div className="text-[11px] leading-tight">
                      <div className="font-medium truncate max-w-[80px]">{selectedCliente.nombre_completo}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                        {selectedCliente.text}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveCliente}
                    className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-7 px-2 text-[11px]">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Cliente</span>
                      </div>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-1">
                    <div className="relative mb-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Buscar cliente..."
                        value={searchCliente}
                        onChange={(e) => setSearchCliente(e.target.value)}
                        className="pl-6 h-6 text-xs"
                      />
                    </div>
                    <div className="max-h-44 overflow-auto">
                      {loadingClientes ? (
                        <div className="text-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                          <p className="text-[10px] mt-1">Cargando...</p>
                        </div>
                      ) : filteredClientes.length > 0 ? (
                        filteredClientes.map((cliente) => (
                          <DropdownMenuItem
                            key={cliente.id}
                            onClick={() => handleSelectCliente(cliente)}
                            className="flex flex-col items-start p-2 mb-1 hover:bg-accent rounded"
                          >
                            <div className="font-medium text-[11px] leading-tight">
                              {cliente.nombre_completo}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{cliente.text}</div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="text-center py-2 text-muted-foreground text-[11px]">
                          Sin resultados
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-auto p-2">
          {currentOrder.productos.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">No hay productos en este pedido</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentOrder.productos.map((item) => (
                <Card key={item.consecutivo} className="p-2">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <h4 className="font-medium text-xs leading-tight">{item.nombre}</h4>
                      <div className="text-[11px] text-muted-foreground">
                        {formatPrice(item.costo)} c/u
                      </div>
                      {(item.descuento_porcentaje > 0 || item.descuento_valor > 0) && (
                        <div className="text-[11px] text-orange-600 leading-tight">
                          Desc: {item.descuento_porcentaje > 0 && `${item.descuento_porcentaje}%`}
                          {item.descuento_porcentaje > 0 && item.descuento_valor > 0 && " + "}
                          {item.descuento_valor > 0 && formatPrice(item.descuento_valor)}
                        </div>
                      )}
                      {item.concepto && (
                        <div className="text-[11px] text-muted-foreground italic leading-tight">
                          {item.concepto}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditProduct(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        onClick={() => onRemoveProduct(item.id_producto)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5 p-0 btn-bg-danger bg-transparent"
                        onClick={() => onUpdateQuantity(item.id_producto, item.cantidad - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-medium w-6 text-center">{item.cantidad}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5 p-0 btn-bg-excel bg-transparent"
                        onClick={() => onUpdateQuantity(item.id_producto, item.cantidad + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs font-semibold">{formatPrice(item.total)}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="border-t border-border p-2">
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>{formatPrice(currentOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>IVA (19%):</span>
              <span>{formatPrice(currentOrder.iva)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-bold">
              <span>Total:</span>
              <span>{formatPrice(currentOrder.total)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <Button
              onClick={onCompleteOrder}
              disabled={currentOrder.productos.length === 0}
              className="w-full gap-1 btn-bg-gold h-8"
            >
              <CreditCard className="h-4 w-4" />
              Pagar
            </Button>
            <Button
              variant="outline"
              onClick={onNewOrder}
              className="w-full gap-1 btn-bg-info bg-transparent h-8"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>
      </div>

      {/* Product Edit Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}
    </>
  )
}