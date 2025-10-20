// components/order-panel.tsx

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
    ChevronLeft, // Icono para colapsar
    ChevronRight, // Icono para expandir
    Warehouse,
    ListOrdered,
    ChevronDown,
    Printer
} from "lucide-react"
import { ProductEditModal } from "./product-edit-modal"

// 🔥 IMPORTAR TUS TIPOS (AJUSTA LA RUTA SI ES NECESARIO)
import type { Order, OrderItem, Cliente, Bodega } from "@/app/page" // O usa "@/types/order"

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
    selectedCliente: Cliente | null
    selectedBodega: Bodega | null
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
    selectedCliente,
    selectedBodega
}: OrderPanelProps) {
    const [editingProduct, setEditingProduct] = useState<OrderItem | null>(null)
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [bodegas, setBodegas] = useState<Bodega[]>([])
    const [searchCliente, setSearchCliente] = useState("")
    const [searchBodega, setSearchBodega] = useState("")
    const [loadingClientes, setLoadingClientes] = useState(false)
    const [loadingBodegas, setLoadingBodegas] = useState(false)
    // 🔥 ESTADO CLAVE PARA EXPANDIR/COLAPSAR HORIZONTALMENTE
    const [isExpanded, setIsExpanded] = useState(true)

    // Cargar clientes (Sin cambios)
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

    // Cargar bodegas (Sin cambios)
    useEffect(() => {
        const loadBodegas = async () => {
            try {
                setLoadingBodegas(true)
                const response = await apiClient.get('/bodega/combo-bodega')
                const data = response.data.data || response.data
                setBodegas(Array.isArray(data) ? data : [])
                
                if (data.length > 0 && !selectedBodega) {
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
    
    // Funciones helper (Sin cambios)
    const filteredClientes = clientes.filter(cliente =>
        cliente.text.toLowerCase().includes(searchCliente.toLowerCase()) ||
        cliente.nombre_completo.toLowerCase().includes(searchCliente.toLowerCase())
    )

    const filteredBodegas = bodegas.filter(bodega =>
        (bodega.text ?? "").toLowerCase().includes(searchBodega.toLowerCase()) ||
        bodega.nombre.toLowerCase().includes(searchBodega.toLowerCase())
    );

    const handlePrintOrder = (orderId: number | null) => {
        // Reemplazar con su endpoint real de PDF
        if (orderId) {
            const pdfUrl = `http://localhost:8000/pedido-print/${orderId}`;
            window.open(pdfUrl, '_blank');
        }
    };

    const handleSelectCliente = (cliente: Cliente) => {
        setSearchCliente("")
        if (onUpdateCliente) {
            onUpdateCliente(cliente)
        }
    }

    const handleRemoveCliente = () => {
        if (onUpdateCliente) {
            onUpdateCliente(null)
        }
    }

    const handleSelectBodega = async (bodega: Bodega) => {
        setSearchBodega("")
        if (onUpdateBodega) {
            onUpdateBodega(bodega)
        }
    }

    const handleRemoveBodega = () => {
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

    const handleEditProduct = (product: OrderItem) => {
        setEditingProduct(product)
    }

    const handleSaveProduct = (updatedProduct: OrderItem) => {
        if (onUpdateProduct) {
        onUpdateProduct(updatedProduct)
        }
        setEditingProduct(null)
    }

    // 🔥 VISTA SIN ORDEN ACTIVA (Se mantiene la lógica, pero envuelta en el nuevo diseño de colapso)
    const renderNoOrder = () => (
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
    )

    // 🔥 RENDERIZADO PRINCIPAL CON CLASES DE ANCHO DINÁMICO
    return (
        <>
            <div 
                className={`
                    h-full flex flex-col border-l border-border bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out flex-shrink-0 
                    ${isExpanded ? "w-full lg:w-96" : "w-16"}
                `}
            >
                {/* -------------------- HEADER SIEMPRE VISIBLE -------------------- */}
                <div className="p-2 border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                        {isExpanded && (
                             <div className="flex items-center gap-2">
                                <ListOrdered className="h-4 w-4 text-primary" />
                                <h2 className="text-sm font-semibold text-foreground truncate max-w-[150px]">
                                {currentOrder
                                    ? currentOrder.ubicacion?.nombre ||
                                    currentOrder.cliente?.nombre_completo ||
                                    "Pedido Actual"
                                    : "Pedido Actual"}
                                </h2>
                                {currentOrder?.id_backend && (
                                    <Badge variant="secondary" className="text-[15px] px-1 py-0 h-4">
                                        #{currentOrder.id_backend}
                                    </Badge>
                                )}
                            </div>
                        )}
                       
                        {/* 🔥 BOTÓN TOGGLE DE EXPANDIR/COLAPSAR */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`h-7 w-7 p-0 ${isExpanded ? '' : 'mx-auto'}`}
                            title={isExpanded ? "Colapsar Vista" : "Expandir Vista"}
                        >
                            {isExpanded ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* -------------------- MODO COLAPSADO (SUMMARY) -------------------- */}
                {!isExpanded && currentOrder && (
                    <div className="flex-1 flex flex-col justify-between p-2 items-center max-h-149">
                        <div className="space-y-3 pt-4">
                            <div className="text-center text-[15px] font-mono">
                                {currentOrder.id_backend ? `#${currentOrder.id_backend}` : 'TEMP'}
                            </div>
                        </div>

                        <div className="text-center space-y-2 flex-shrink-0 w-full">
                            {currentOrder.productos.length} items
                        </div>

                        <div className="space-y-2 flex-shrink-0 w-full mb-17">
                            <div className="text-center text-[20px] font-bold text-primary transform -rotate-90 origin-center w-full my-6">
                                {formatPrice(currentOrder.total)}
                            </div>
                            <Button
                                onClick={onCompleteOrder}
                                disabled={currentOrder.productos.length === 0}
                                size="icon"
                                className="w-10 h-10 p-0 btn-bg-gold"
                                title="Pagar"
                            >
                                <CreditCard className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
                
                {/* -------------------- CONTENIDO PRINCIPAL (EXPANDIDO) -------------------- */}
                {currentOrder && isExpanded && (
                    // 🔥 CORRECCIÓN CLAVE: Usamos un DIV como contenedor Flex Column
                    // para distribuir correctamente el espacio entre 2.1 (fijo), 2.2 (scroll) y 2.3 (fijo).
                    <div className="flex-1 flex flex-col min-h-0"> 
                        
                        {/* 2.1 Selectores de Cliente/Bodega - FLEX-SHRINK-0 (Altura Fija) */}
                        <div className="p-2 border-b border-border flex-shrink-0">
                            {/* Selector de Bodega y Cliente en grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* Bodega */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium">Bodega</label>
                                    {selectedBodega ? (
                                        <div className="flex items-center justify-between p-1 border rounded bg-muted/30">
                                            <div className="flex items-center gap-1">
                                                <Warehouse className="h-3 w-3 text-muted-foreground" />
                                                <div className="text-[11px] leading-tight">
                                                    <div className="font-medium truncate max-w-[80px]">{selectedBodega.codigo}</div>
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
                                                <Button variant="outline" className="w-full justify-between h-7 px-2 text-[11px]" id="cliente-selector">
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
                                    <label htmlFor="cliente-selector" className="text-[11px] font-medium">Cliente</label>
                                    {selectedCliente ? (
                                        <div className="flex items-center justify-between p-1 border rounded bg-muted/30">
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                <div className="text-[11px] leading-tight">
                                                    <div className="font-medium truncate max-w-[120px]">{selectedCliente.nombre_completo}</div>
                                                    <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                                        {selectedCliente.text || 'Cliente por defecto'}
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
                                                <Button variant="outline" className="w-full justify-between h-7 px-2 text-[11px]" id="cliente-selector">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        <span>Selecionar cliente</span>
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

                        {/* 2.2 Order Items - FLEX-1 OVERFLOW-Y-AUTO (Ahora maneja el scroll) */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-2">
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
                                                            className="h-5 w-5 p-0 bg-transparent hover:bg-red-50"
                                                            onClick={() => onUpdateQuantity(item.id_producto, item.cantidad - 1)}
                                                        >
                                                            <Minus className="h-3 w-3 text-destructive" />
                                                        </Button>
                                                        <span className="text-xs font-medium w-6 text-center">{item.cantidad}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-5 w-5 p-0 bg-transparent hover:bg-green-50"
                                                            onClick={() => onUpdateQuantity(item.id_producto, item.cantidad + 1)}
                                                        >
                                                            <Plus className="h-3 w-3 text-success" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-xs font-semibold">{formatPrice(item.total)}</div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2.3 Order Summary & Actions - FLEX-SHRINK-0 (Altura Fija Abajo) */}
                        <div className="border-t border-border p-2 flex-shrink-0 bg-background">
                            <div className="space-y-1 mb-2">
                                <div className="flex justify-between text-xs">
                                    <span>Subtotal:</span>
                                    <span>{formatPrice(currentOrder.subtotal)}</span>
                                </div>

                                {/* 🔥 MOSTRAR DESGLOSE DE IVA POR TASAS */}
                                {currentOrder?.iva_desglose && 
                                    Object.entries(currentOrder.iva_desglose)
                                        // 🔥 MODIFICACIÓN CLAVE: Filtrar para que la 'tasa' sea mayor a 0
                                        .filter(([tasa]) => parseFloat(tasa) > 0)
                                        .map(([tasa, valor]) => (
                                            <div key={tasa} className="flex justify-between text-xs text-muted-foreground">
                                                <span>IVA ({tasa}%):</span>
                                                <span>{formatPrice(valor)}</span>
                                            </div>
                                        ))
                                }

                                {/* 🔥 MOSTRAR RETENCIÓN SI EXISTE */}
                                {currentOrder.retencion > 0 && (
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Retención ({currentOrder.porcentaje_retencion}%) :</span>
                                        <span>{formatPrice(currentOrder.retencion)}</span>
                                    </div>
                                )}

                                <Separator />
                                <div className="flex justify-between text-sm font-bold">
                                    <span>Total:</span>
                                    <span>{formatPrice(currentOrder.total)}</span>
                                </div>
                            </div>

                            <div className="space-y-1 mb-17">
                                <Button
                                    onClick={onCompleteOrder}
                                    disabled={currentOrder.productos.length === 0}
                                    className="w-full gap-1 btn-bg-gold h-9"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    Pagar ({formatPrice(currentOrder.total)})
                                </Button>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handlePrintOrder(currentOrder.id_backend)}
                                        disabled={!currentOrder.id_backend}
                                        variant="outline"
                                        className="w-1/3 gap-1 h-8"
                                        title="Imprimir pedido"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={onNewOrder}
                                        className="w-1/2 gap-1 h-8"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nuevo
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={onCancelOrder}
                                        className="w-1/2 gap-1 h-8 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!currentOrder && isExpanded && (
                    <div className="flex-1 flex items-center justify-center min-h-0">
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
                )}

                {!isExpanded && !currentOrder && (
                    <div className="flex-1 flex flex-col justify-center items-center p-2">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground/50 mb-8" />
                        <Button 
                            onClick={onNewOrder} 
                            size="icon" 
                            className="w-10 h-10 p-0 text-xs bg-muted text-muted-foreground hover:bg-muted/70"
                            title="Nuevo Pedido"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Product Edit Modal (Sin cambios) */}
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