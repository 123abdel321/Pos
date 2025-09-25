"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Clock, CheckCircle, MapPin, ShoppingCart, Trash2 } from "lucide-react"
import type { Order } from "@/app/page"

interface OrdersManagerProps {
  orders: Order[]
  onSelectOrder: (order: Order) => void
  onDeleteOrder: (orderId: string) => void
  onClose: () => void
}

export function OrdersManager({ orders, onSelectOrder, onDeleteOrder, onClose }: OrdersManagerProps) {
  const [selectedTab, setSelectedTab] = useState("pendiente")

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
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const pendingOrders = orders.filter((order) => order.estado === "pendiente")
  const completedOrders = orders.filter((order) => order.estado === "completado")

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="p-4 transition-all hover:bg-accent">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{order.ubicacion_nombre}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={order.estado === "pendiente" ? "default" : "secondary"} className="text-xs">
            {order.estado === "pendiente" ? (
              <>
                <Clock className="h-3 w-3 mr-1" />
                Pendiente
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Completado
              </>
            )}
          </Badge>
          {order.estado === "pendiente" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive btn-bg-danger"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteOrder(order.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="text-sm text-muted-foreground">{formatDateTime(order.fecha)}</div>
        <div className="flex items-center gap-2 text-sm">
          <ShoppingCart className="h-3 w-3" />
          <span>{order.productos.length} productos</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-lg font-bold text-primary">{formatPrice(order.total)}</div>
        <Button size="sm" variant="outline" className="btn-bg-info bg-transparent" onClick={() => onSelectOrder(order)}>
          {order.estado === "pendiente" ? "Continuar" : "Ver Detalles"}
        </Button>
      </div>
    </Card>
  )

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Gestión de Pedidos</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="btn-bg-danger">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pendiente" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendientes ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completado" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Completados ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendiente" className="mt-4">
            <div className="max-h-96 overflow-auto">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay pedidos pendientes</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completado" className="mt-4">
            <div className="max-h-96 overflow-auto">
              {completedOrders.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay pedidos completados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
