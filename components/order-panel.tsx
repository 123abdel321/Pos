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
    ChevronLeft,
    ChevronRight,
    Warehouse,
    ListOrdered,
    ChevronDown,
    Printer
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
    selectedCliente: Cliente | null
    selectedBodega: Bodega | null
    ivaIncluido: boolean
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
    selectedBodega,
    ivaIncluido
}: OrderPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true)

    const [searchBodega, setSearchBodega] = useState("")
    const [searchCliente, setSearchCliente] = useState("")
    const [loadingBodegas, setLoadingBodegas] = useState(false)
    const [loadingClientes, setLoadingClientes] = useState(false)
    const [bodegasResultado, setBodegasResultado] = useState<Bodega[]>([])
    const [clientesResultado, setClientesResultado] = useState<Cliente[]>([])
    const [editingProduct, setEditingProduct] = useState<OrderItem | null>(null)

    // CAMBIO: Eliminado validationError porque ahora usamos deshabilitado directo

    // (Los useEffect de búsqueda se mantienen igual)
    useEffect(() => {
        if (searchCliente.trim() === "") {
            setClientesResultado([])
            return
        }
        const delayDebounceFn = setTimeout(async () => {
            try {
                setLoadingClientes(true)
                const response = await apiClient.get('/nit/combo-nit', {
                    params: { search: searchCliente }
                })
                const data = response.data.data || response.data
                setClientesResultado(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error('Error searching clientes:', error)
                setClientesResultado([])
            } finally {
                setLoadingClientes(false)
            }
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [searchCliente])

    useEffect(() => {
        if (searchBodega.trim() === "") {
            setBodegasResultado([])
            return
        }
        const delayDebounceFn = setTimeout(async () => {
            try {
                setLoadingBodegas(true)
                const response = await apiClient.get('/bodega/combo-bodega', {
                    params: { search: searchBodega }
                })
                const data = response.data.data || response.data
                setBodegasResultado(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error('Error searching bodegas:', error)
                setBodegasResultado([])
            } finally {
                setLoadingBodegas(false)
            }
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [searchBodega])

    const handlePrintOrder = (orderId: number | null) => {
        if (orderId) {
            const pdfUrl = `https://app.portafolioerp.com/pos/pedido-print/${orderId}`;
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

    // CAMBIO: Añadido handler para seleccionar bodega (aunque no se muestra en este componente, lo usará el padre)
    // Si el padre no proporciona onUpdateBodega, esto no tendrá efecto.
    const handleSelectBodega = (bodega: Bodega) => {
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

    // CAMBIO: Función de validación (solo lógica, no muestra error)
    const isValidRequirements = (): boolean => {
        return !!selectedBodega && !!selectedCliente;
    };

    // Handlers que validan
    const handleNewOrder = () => {
        if (isValidRequirements()) {
            onNewOrder();
        }
    };

    const handleCompleteOrder = () => {
        if (isValidRequirements()) {
            onCompleteOrder();
        }
    };

    // Variables auxiliares para deshabilitar botones
    const isMissingRequirements = !isValidRequirements();
    const canAddProducts = currentOrder?.estado === 'pendiente';

    // RENDERIZADO PRINCIPAL
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
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`h-7 w-7 p-0 ${isExpanded ? '' : 'mx-auto'}`}
                            title={isExpanded ? "Colapsar Vista" : "Expandir Vista"}
                        >
                            {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* -------------------- SELECTOR DE CLIENTE (SIEMPRE VISIBLE CUANDO EXPANDIDO) -------------------- */}
                {isExpanded && (
                    <div className="p-2 border-b border-border flex-shrink-0">
                        <div className="space-y-1">
                            <label htmlFor="cliente-selector" className="text-[11px] font-medium">
                                Cliente {!selectedCliente && <span className="text-destructive">*</span>}
                            </label>
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
                                                <span>Seleccionar cliente</span>
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
                                                    <p className="text-[10px] mt-1 text-muted-foreground">Buscando clientes...</p>
                                                </div>
                                            ) : clientesResultado.length > 0 ? (
                                                clientesResultado.map((cliente) => (
                                                    <DropdownMenuItem
                                                        key={cliente.id}
                                                        onClick={() => handleSelectCliente(cliente)}
                                                        className="flex flex-col items-start p-2 mb-1 hover:bg-accent rounded"
                                                    >
                                                        <div className="font-medium text-[11px] leading-tight">{cliente.nombre_completo}</div>
                                                        <div className="text-[10px] text-muted-foreground">{cliente.text}</div>
                                                    </DropdownMenuItem>
                                                ))
                                            ) : searchCliente.trim() !== "" ? (
                                                <div className="text-center py-2 text-muted-foreground text-[11px]">Sin resultados</div>
                                            ) : (
                                                <div className="text-center py-2 text-muted-foreground text-[11px]">Empieza a escribir para buscar clientes...</div>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        {/* Nota: No se incluye selector de bodega aquí por solicitud del usuario. La bodega debe seleccionarse fuera. */}
                    </div>
                )}

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
                                onClick={handleCompleteOrder}
                                disabled={currentOrder.productos.length === 0 || isMissingRequirements}
                                size="icon"
                                className="w-10 h-10 p-0 btn-bg-gold"
                                title={isMissingRequirements ? "Selecciona cliente y bodega" : "Pagar"}
                            >
                                <CreditCard className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
                
                {/* -------------------- CONTENIDO PRINCIPAL (EXPANDIDO) - SOLO SI HAY PEDIDO -------------------- */}
                {currentOrder && isExpanded && (
                    <div className="flex-1 flex flex-col min-h-0"> 
                        {/* 2.2 Order Items - FLEX-1 OVERFLOW-Y-AUTO */}
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
                                                    {canAddProducts && (
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
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    {canAddProducts && (
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
                                                    )}
                                                    <div className="text-xs font-semibold">{formatPrice(item.total)}</div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2.3 Order Summary & Actions */}
                        <div className="border-t border-border p-2 flex-shrink-0 bg-background">
                            <div className="space-y-1 mb-2">
                                <div className="flex justify-between text-xs">
                                    <span>Subtotal:</span>
                                    <span>{formatPrice(currentOrder.subtotal)}</span>
                                </div>
                                {currentOrder?.iva_desglose && 
                                    Object.entries(currentOrder.iva_desglose)
                                        .filter(([tasa]) => parseFloat(tasa) > 0)
                                        .map(([tasa, valor]) => (
                                            <div key={tasa} className="flex justify-between text-xs text-muted-foreground">
                                                <span>IVA ({tasa}%):</span>
                                                <span>{formatPrice(valor)}</span>
                                            </div>
                                        ))
                                }
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
                                {canAddProducts && (
                                    <>
                                        <Button
                                            onClick={handleCompleteOrder}
                                            disabled={currentOrder.productos.length === 0 || isMissingRequirements}
                                            className="w-full gap-1 btn-bg-gold h-9"
                                            title={
                                                isMissingRequirements
                                                    ? "Selecciona cliente y bodega para continuar"
                                                    : currentOrder.productos.length === 0
                                                    ? "Agrega productos para pagar"
                                                    : ""
                                            }
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
                                                onClick={handleNewOrder}  // CAMBIO: usa handleNewOrder para validar
                                                className="w-1/2 gap-1 h-8"
                                                disabled={isMissingRequirements}  // CAMBIO: deshabilitar si falta requisito
                                                title={isMissingRequirements ? "Selecciona cliente y bodega primero" : ""}
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* -------------------- ESTADO SIN PEDIDO ACTIVO (EXPANDIDO) -------------------- */}
                {!currentOrder && isExpanded && (
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className="text-center">
                            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No hay pedido activo</h3>
                            <p className="text-muted-foreground mb-6">
                                {isMissingRequirements
                                    ? "Selecciona un cliente y una bodega para comenzar"
                                    : "Presiona 'Nuevo Pedido' para iniciar una venta"}
                            </p>
                            <Button
                                onClick={handleNewOrder}
                                className="gap-2 btn-bg-info"
                                disabled={isMissingRequirements}
                                title={isMissingRequirements ? "Primero selecciona cliente y bodega" : ""}
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo Pedido
                            </Button>
                        </div>
                    </div>
                )}

                {/* -------------------- ESTADO SIN PEDIDO Y COLAPSADO -------------------- */}
                {!isExpanded && !currentOrder && (
                    <div className="flex-1 flex flex-col justify-center items-center p-2">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground/50 mb-8" />
                        <Button
                            variant="outline"
                            onClick={handleNewOrder}
                            className="w-1/2 gap-1 h-8"
                            disabled={isMissingRequirements}
                            title={isMissingRequirements ? "Selecciona cliente y bodega" : ""}
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo
                        </Button>
                    </div>
                )}
            </div>

            {/* Product Edit Modal */}
            {editingProduct && (
                <ProductEditModal
                    product={editingProduct}
                    isOpen={!!editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSave={handleSaveProduct}
                    ivaIncluido={ivaIncluido}
                />
            )}
        </>
    )
}