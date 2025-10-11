"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, Eye, Trash2, MapPin, Calendar, DollarSign, Filter, Grid, List, ChevronLeft, ChevronRight, Hash, X, CheckCircle, Clock, Info
} from "lucide-react"
import apiClient from "@/app/api/apiClient"
import type { Order } from "@/app/page"

// Interfaces basadas en tu API
interface Cliente {
  id: number
  numero_documento: string
  nombre_completo: string
}

interface ProductoDetalle {
  id: number
  id_producto: number
  descripcion: string
  cantidad: string
  costo: string
  subtotal: string
  total: string
}

interface Pedido {
  id: number
  id_cliente: number
  id_bodega: number
  id_centro_costos: number
  id_ubicacion: number | null
  id_vendedor: number | null
  id_venta: number | null
  consecutivo: string
  subtotal: string
  total_iva: string
  total_descuento: string
  total_rete_fuente: string
  total_cambio: string
  porcentaje_rete_fuente: string
  total_factura: string
  estado: number
  created_at: string
  updated_at: string
  fecha_creacion: string
  fecha_edicion: string
  cliente: Cliente
  detalles: ProductoDetalle[]
}

interface PedidosResponse {
  success: boolean
  draw: number | null
  iTotalRecords: number
  iTotalDisplayRecords: number
  data: Pedido[]
  perPage: number
  message: string
}

interface OrdersTableViewProps {
  orders: Order[]
  onSelectOrder: (order: Order) => void
  onDeleteOrder: (orderId: string) => void
  onClose: () => void
}

type ViewMode = "table" | "card"

// Función para mapear Pedido de API a Order del frontend
const mapPedidoToOrder = (pedido: Pedido): Order => {
  const productos: Order["productos"] = pedido.detalles.map((detalle, index) => ({
    consecutivo: index + 1,
    id_producto: detalle.id_producto,
    nombre: detalle.descripcion,
    cantidad: Number.parseFloat(detalle.cantidad),
    costo: Number.parseFloat(detalle.costo),
    subtotal: Number.parseFloat(detalle.subtotal),
    descuento_porcentaje: 0,
    descuento_valor: 0,
    iva_porcentaje: 0,
    iva_valor: 0,
    retencion_porcentaje: 0,
    retencion_valor: 0,
    total: Number.parseFloat(detalle.total),
    concepto: ""
  }))

  return {
    id: `order-${pedido.id}`,
    id_backend: pedido.id,
    id_ubicacion: pedido.id_ubicacion,
    id_bodega: pedido.id_bodega,
    id_venta: pedido.id_venta,
    ubicacion_nombre: pedido.cliente?.nombre_completo || "Pedido Mostrador",
    productos,
    subtotal: Number.parseFloat(pedido.subtotal),
    iva: Number.parseFloat(pedido.total_iva),
    retencion: Number.parseFloat(pedido.total_rete_fuente),
    porcentaje_retencion: Number.parseFloat(pedido.porcentaje_rete_fuente),
    total: Number.parseFloat(pedido.total_factura),
    fecha: pedido.created_at,
    // Se usa el estado de la API para determinar "pendiente" o "completado"
    estado: pedido.estado === 1 && pedido.id_venta === null ? "pendiente" : "completado"
  }
}

// Información de estado (mejorada)
const getEstadoInfo = (estado: number, idVenta: number | null) => {
  if (idVenta !== null) {
    return { label: "Facturado", variant: "default" as const, icon: CheckCircle }
  }

  switch (estado) {
    case 0: return { label: "Anulado", variant: "destructive" as const, icon: X }
    case 1: return { label: "Guardado", variant: "secondary" as const, icon: Clock } // Pendiente de facturar
    case 2: return { label: "Facturado", variant: "default" as const, icon: CheckCircle }
    default: return { label: "Desconocido", variant: "outline" as const, icon: Info }
  }
}

export function OrdersTableView({ orders, onSelectOrder, onDeleteOrder, onClose }: OrdersTableViewProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [perPage, setPerPage] = useState(20)

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false)
  
  // Estado para la vista: 'table' (detallada) o 'card' (simplificada)
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  // Cargar pedidos desde la API
  const loadPedidos = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      const start = (page - 1) * perPage
      const response = await apiClient.get<PedidosResponse>('/pos/pedidos', {
        params: {
          draw: page,
          start: start
        }
      })

      if (response.data.success) {
        setPedidos(response.data.data)
        setTotalRecords(response.data.iTotalRecords)
        setPerPage(response.data.perPage)
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (err) {
      console.error('Error loading pedidos:', err)
      setError('Error al cargar los pedidos. Verifique la conexión.')
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadPedidos(currentPage)
  }, [currentPage])

  // Combinar pedidos de API con orders locales
  const allOrders = useMemo(() => {
    const apiOrders = pedidos.map(mapPedidoToOrder)
    const localOrders = orders.filter(order =>
      !pedidos.some(pedido => order.id_backend === pedido.id)
    )
    return [...apiOrders, ...localOrders]
  }, [pedidos, orders])

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      // Obtener el pedido de la API para usar el consecutivo y estado nativo
      const pedidoOriginal = pedidos.find(p => p.id === order.id_backend)

      // Filtro por búsqueda general
      const matchesSearch = searchTerm === "" ||
        order.ubicacion_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedidoOriginal?.consecutivo && pedidoOriginal.consecutivo.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filtro por estado usando la propiedad simplificada de Order
      const matchesEstado = filtroEstado === "todos" ||
        (filtroEstado === "pendiente" && order.estado === "pendiente") ||
        (filtroEstado === "completado" && order.estado === "completado")

      return matchesSearch && matchesEstado
    })
  }, [allOrders, searchTerm, filtroEstado, pedidos]) // Se agregó 'pedidos' a las dependencias para buscar por consecutivo

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(totalRecords / perPage)

  // Componente de Fila de Tabla
  const TableRow = ({ order }: { order: Order }) => {
    const pedido = pedidos.find(p => p.id === order.id_backend)
    const estadoInfo = pedido ? getEstadoInfo(pedido.estado, pedido.id_venta) :
      { label: order.estado === "pendiente" ? "Pendiente" : "Completado", variant: order.estado === "pendiente" ? "secondary" as const : "default" as const, icon: order.estado === "pendiente" ? Clock : CheckCircle }
    const EstadoIcon = estadoInfo.icon

    return (
      <div
        className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/30 transition-colors items-center text-sm"
      >
        {/* ID/Consecutivo - col-span-2 (sm:col-span-3) */}
        <div className="col-span-3">
          <div className="font-mono text-sm text-primary flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {order.id_backend || order.id.slice(-8)}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {order.id_backend ? `Cons: ${pedido?.consecutivo || 'N/A'}` : 'Local'}
          </div>
        </div>

        {/* Cliente - col-span-3 (sm:col-span-3) */}
        <div className="col-span-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <span className="font-medium truncate">{order.ubicacion_nombre}</span>
        </div>

        {/* Total - col-span-2 (sm:col-span-2) */}
        <div className="col-span-2 font-semibold">
          ${order.total.toLocaleString("es-CO")}
          <div className="text-xs text-muted-foreground">
            Items: {order.productos.reduce((sum, p) => sum + p.cantidad, 0)}
          </div>
        </div>

        {/* Fecha - col-span-2 (sm:col-span-2) */}
        <div className="col-span-2 text-muted-foreground text-xs">
          {new Date(order.fecha).toLocaleDateString()}
          <div className="text-xs text-muted-foreground">
            {new Date(order.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Estado - col-span-1 (sm:col-span-1) */}
        <div className="col-span-1">
          <Badge
            variant={estadoInfo.variant}
            className={`font-semibold ${estadoInfo.label === 'Facturado' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}`}
          >
            <EstadoIcon className="h-3 w-3 mr-1" />
            <span className="hidden lg:inline">{estadoInfo.label}</span>
          </Badge>
        </div>

        {/* Acciones - col-span-1 (sm:col-span-1) */}
        <div className="col-span-1 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSelectOrder(order)}
            title="Ver Detalle"
            className="text-primary hover:bg-primary/10"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => order.id_backend ? onDeleteOrder(order.id) : onDeleteOrder(order.id)}
            title="Eliminar Pedido"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }
  
  // Componente de Tarjeta
  const CardView = ({ order }: { order: Order }) => {
    const pedido = pedidos.find(p => p.id === order.id_backend)
    const estadoInfo = pedido ? getEstadoInfo(pedido.estado, pedido.id_venta) :
      { label: order.estado === "pendiente" ? "Pendiente" : "Completado", variant: order.estado === "pendiente" ? "secondary" as const : "default" as const, icon: order.estado === "pendiente" ? Clock : CheckCircle }
    const EstadoIcon = estadoInfo.icon

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            Pedido #{order.id_backend || order.id.slice(-8)}
          </CardTitle>
          <Badge
            variant={estadoInfo.variant}
            className={`font-semibold ${estadoInfo.label === 'Facturado' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}`}
          >
            <EstadoIcon className="h-3 w-3 mr-1" />
            {estadoInfo.label}
          </Badge>
        </CardHeader>
        <CardContent className="p-4 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" /> Cliente:</span>
            <span className="font-medium truncate ml-2">{order.ubicacion_nombre}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" /> Total:</span>
            <span className="text-lg font-bold text-primary">${order.total.toLocaleString("es-CO")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4" /> Fecha:</span>
            <span>{new Date(order.fecha).toLocaleDateString()} {new Date(order.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Productos:</span>
            <span>{order.productos.length} items</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectOrder(order)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            Ver
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => order.id_backend ? onDeleteOrder(order.id) : onDeleteOrder(order.id)}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none p-0 flex flex-col">

        <DialogHeader className="p-4 sm:p-6 border-b bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <List className="h-5 w-5 sm:h-6 sm:w-6" />
              Gestión de Pedidos
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} title="Cerrar">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-background">
          {/* Barra de herramientas y Filtros */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                {/* Búsqueda */}
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente, consecutivo o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtro por Estado */}
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="completado">Completados</SelectItem>
                  </SelectContent>
                </Select>

                {/* Botón de Filtros Avanzados */}
                <Button
                  variant="outline"
                  onClick={() => setShowFiltrosAvanzados(!showFiltrosAvanzados)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros ({showFiltrosAvanzados ? 'Ocultar' : 'Mostrar'})
                </Button>
              </div>

              {/* Selector de Vista */}
              <div className="flex gap-2 w-full lg:w-auto justify-end">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                  title="Vista Detallada (Tabla)"
                >
                  <List className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === "card" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("card")}
                  title="Vista Simplificada (Tarjeta)"
                >
                  <Grid className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Filtros avanzados */}
            {showFiltrosAvanzados && (
              <div className="mt-4 p-4 border rounded-lg bg-secondary/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Fecha desde</label>
                  <Input type="date" className="bg-white" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fecha hasta</label>
                  <Input type="date" className="bg-white" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Cliente</label>
                  <Input placeholder="Filtrar por cliente..." className="bg-white" />
                </div>
              </div>
            )}
          </Card>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Pedidos</div>
                  <div className="text-xl sm:text-2xl font-bold">{allOrders.length}</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                  <div className="text-xl sm:text-2xl font-bold">
                    ${allOrders.reduce((sum, p) => sum + p.total, 0).toLocaleString("es-CO")}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Guardados/Pendientes</div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {allOrders.filter(p => p.estado === "pendiente").length}
                  </div>
                </div>
              </div>
              </Card>

            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Completados/Facturados</div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {allOrders.filter(p => p.estado === "completado").length}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Lista de pedidos */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <div className="mt-4 text-muted-foreground">Cargando pedidos...</div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-destructive">
                <div className="mb-2">❌ {error}</div>
                <Button onClick={() => loadPedidos(currentPage)} variant="outline">
                  Reintentar
                </Button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="mb-2">No se encontraron pedidos</div>
                {searchTerm && <div className="text-sm">Intenta con otros términos de búsqueda</div>}
              </div>
            ) : (
              <>
                {/* Contenedor de la vista */}
                {viewMode === "table" ? (
                  /* VISTA TABLA */
                  <>
                    {/* Table header (Responsive Grid) */}
                    <div className="hidden sm:block bg-muted/50 border-b">
                      <div className="grid grid-cols-12 gap-4 p-4 font-medium text-xs sm:text-sm text-muted-foreground">
                        <div className="col-span-3">ID / Consecutivo</div>
                        <div className="col-span-3">Cliente</div>
                        <div className="col-span-2">Total</div>
                        <div className="col-span-2">Fecha</div>
                        <div className="col-span-1">Estado</div>
                        <div className="col-span-1 text-right">Acciones</div>
                      </div>
                    </div>

                    {/* Table body */}
                    <div className="divide-y divide-border">
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} order={order} />
                      ))}
                    </div>
                  </>
                ) : (
                  /* VISTA TARJETA (Simplificada) */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {filteredOrders.map((order) => (
                      <CardView key={order.id} order={order} />
                    ))}
                  </div>
                )}

                {/* Paginación */}
                {/* La paginación debe usar `totalRecords` y `perPage` de la API, no el `filteredOrders.length` */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
                    Mostrando {pedidos.length} pedidos de {totalRecords}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      title="Página Anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm font-medium text-foreground px-2 py-1 rounded-md bg-muted">
                      {currentPage} de {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      title="Página Siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}