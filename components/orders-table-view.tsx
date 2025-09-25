"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Eye, Trash2, X, MapPin, Calendar, DollarSign } from "lucide-react"
import type { Order } from "@/app/page"

interface OrdersTableViewProps {
  orders: Order[]
  onSelectOrder: (order: Order) => void
  onDeleteOrder: (orderId: string) => void
  onClose: () => void
}

export function OrdersTableView({ orders, onSelectOrder, onDeleteOrder, onClose }: OrdersTableViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("pendiente")

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.ubicacion_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedTab === "todos" || order.estado === selectedTab

    return matchesSearch && matchesStatus
  })

  const handleSelectOrder = (order: Order) => {
    onSelectOrder(order)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Gestión de Pedidos y Ventas</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ubicación o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs for order status */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="todos">Todos ({orders.length})</TabsTrigger>
              <TabsTrigger value="pendiente">
                Pendientes ({orders.filter((o) => o.estado === "pendiente").length})
              </TabsTrigger>
              <TabsTrigger value="completado">
                Completados ({orders.filter((o) => o.estado === "completado").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              <div className="border rounded-lg overflow-hidden">
                {/* Table header */}
                <div className="bg-muted/50 border-b">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm">
                    <div className="col-span-2">ID Pedido</div>
                    <div className="col-span-2">Ubicación</div>
                    <div className="col-span-2">Productos</div>
                    <div className="col-span-2">Total</div>
                    <div className="col-span-2">Estado</div>
                    <div className="col-span-2">Acciones</div>
                  </div>
                </div>

                {/* Table body */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="mb-2">No se encontraron pedidos</div>
                      {searchTerm && <div className="text-sm">Intenta con otros términos de búsqueda</div>}
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/30 transition-colors"
                      >
                        <div className="col-span-2">
                          <div className="font-mono text-sm">{order.id.slice(-8)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.fecha).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{order.ubicacion_nombre}</span>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="text-sm">{order.productos.length} productos</div>
                          <div className="text-xs text-muted-foreground">
                            {order.productos.reduce((sum, p) => sum + p.cantidad, 0)} items
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="font-semibold">${order.total.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">IVA: ${order.iva.toLocaleString()}</div>
                        </div>

                        <div className="col-span-2">
                          <Badge
                            variant={order.estado === "completado" ? "default" : "secondary"}
                            className={order.estado === "completado" ? "bg-success text-success-foreground" : ""}
                          >
                            {order.estado === "pendiente" ? "Pendiente" : "Completado"}
                          </Badge>
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            {order.estado === "pendiente" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectOrder(order)}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Ver
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteOrder(order.id)}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Total Pedidos</div>
                  <div className="text-2xl font-bold">{orders.length}</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Pendientes</div>
                  <div className="text-2xl font-bold text-warning">
                    {orders.filter((o) => o.estado === "pendiente").length}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Total Ventas</div>
                  <div className="text-2xl font-bold text-success">
                    $
                    {orders
                      .filter((o) => o.estado === "completado")
                      .reduce((sum, o) => sum + o.total, 0)
                      .toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
