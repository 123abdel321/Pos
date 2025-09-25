"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, X, Edit } from "lucide-react"
import { ProductEditModal } from "./product-edit-modal"
import type { Order, OrderItem } from "@/app/page"

interface OrderPanelProps {
  currentOrder: Order | null
  onCompleteOrder: () => void
  onNewOrder: () => void
  onUpdateQuantity: (productId: number, newQuantity: number) => void
  onRemoveProduct: (productId: number) => void
  onCancelOrder: () => void
  onUpdateProduct?: (updatedProduct: OrderItem) => void
}

export function OrderPanel({
  currentOrder,
  onCompleteOrder,
  onNewOrder,
  onUpdateQuantity,
  onRemoveProduct,
  onCancelOrder,
  onUpdateProduct,
}: OrderPanelProps) {
  const [editingProduct, setEditingProduct] = useState<OrderItem | null>(null)

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
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">Pedido Actual</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentOrder.estado}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelOrder}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive btn-bg-danger"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div>{currentOrder.ubicacion_nombre}</div>
            <div>{formatDateTime(currentOrder.fecha)}</div>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-auto p-4">
          {currentOrder.productos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay productos en este pedido</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentOrder.productos.map((item) => (
                <Card key={item.consecutivo} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.nombre}</h4>
                      <div className="text-xs text-muted-foreground">{formatPrice(item.costo)} c/u</div>
                      {(item.descuento_porcentaje > 0 || item.descuento_valor > 0) && (
                        <div className="text-xs text-orange-600">
                          Desc: {item.descuento_porcentaje > 0 && `${item.descuento_porcentaje}%`}
                          {item.descuento_porcentaje > 0 && item.descuento_valor > 0 && " + "}
                          {item.descuento_valor > 0 && formatPrice(item.descuento_valor)}
                        </div>
                      )}
                      {item.concepto && <div className="text-xs text-muted-foreground italic">{item.concepto}</div>}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditProduct(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => onRemoveProduct(item.id_producto)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 btn-bg-danger bg-transparent"
                        onClick={() => onUpdateQuantity(item.id_producto, item.cantidad - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.cantidad}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 btn-bg-excel bg-transparent"
                        onClick={() => onUpdateQuantity(item.id_producto, item.cantidad + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-sm font-semibold">{formatPrice(item.total)}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="border-t border-border p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPrice(currentOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA (19%):</span>
              <span>{formatPrice(currentOrder.iva)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatPrice(currentOrder.total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={onCompleteOrder}
              disabled={currentOrder.productos.length === 0}
              className="w-full gap-2 btn-bg-gold"
            >
              <CreditCard className="h-4 w-4" />
              Procesar Pago
            </Button>
            <Button variant="outline" onClick={onNewOrder} className="w-full gap-2 btn-bg-info bg-transparent">
              <Plus className="h-4 w-4" />
              Nuevo Pedido
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
