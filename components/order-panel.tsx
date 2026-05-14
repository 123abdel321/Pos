"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    Printer,
    UserPlus,
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

// Interfaz para tipo de documento
interface TipoDocumento {
    id: number
    nombre: string
    abreviatura: string
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
    ivaIncluido,
}: OrderPanelProps) {
    // Inicializar colapsado en móvil, expandido en escritorio
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth >= 768
        }
        return true
    })

    // Ajustar cuando cambie el tamaño de la ventana
    useEffect(() => {
        const handleResize = () => {
            setIsExpanded(window.innerWidth >= 768)
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const [searchBodega, setSearchBodega] = useState("")
    const [searchCliente, setSearchCliente] = useState("")
    const [loadingBodegas, setLoadingBodegas] = useState(false)
    const [loadingClientes, setLoadingClientes] = useState(false)
    const [bodegasResultado, setBodegasResultado] = useState<Bodega[]>([])
    const [clientesResultado, setClientesResultado] = useState<Cliente[]>([])
    const [editingProduct, setEditingProduct] = useState<OrderItem | null>(null)

    // Estados para el modal de creación de cliente
    const [showCreateClienteModal, setShowCreateClienteModal] = useState(false)
    const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([])
    const [loadingTipos, setLoadingTipos] = useState(false)
    const [creatingCliente, setCreatingCliente] = useState(false)
    const [clienteForm, setClienteForm] = useState({
        id_tipo_documento: "",
        numero_documento: "",
        primer_nombre: "",
        otros_nombres: "",
        primer_apellido: "",
        segundo_apellido: "",
        razon_social: "",
        direccion: "",
        email: "",
        telefono_1: "",
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    // Cargar tipos de documento al abrir el modal
    useEffect(() => {
        if (showCreateClienteModal && tiposDocumento.length === 0) {
            const fetchTipos = async () => {
                setLoadingTipos(true)
                try {
                    const response = await apiClient.get('/nit/combo-tipo-documento')
                    const data = response.data.data || response.data
                    setTiposDocumento(Array.isArray(data) ? data : [])
                    if (Array.isArray(data) && data.length > 0) {
                        setClienteForm(prev => ({ ...prev, id_tipo_documento: data[0].id.toString() }))
                    }
                } catch (error) {
                    console.error("Error cargando tipos de documento:", error)
                } finally {
                    setLoadingTipos(false)
                }
            }
            fetchTipos()
        }
    }, [showCreateClienteModal, tiposDocumento.length])

    // Búsqueda de clientes
    useEffect(() => {
        if (searchCliente.trim() === "") {
            setClientesResultado([])
            return
        }
        const delayDebounceFn = setTimeout(async () => {
            try {
                setLoadingClientes(true)
                const response = await apiClient.get("/nit/combo-nit", {
                    params: { search: searchCliente },
                })
                const data = response.data.data || response.data
                setClientesResultado(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error("Error searching clientes:", error)
                setClientesResultado([])
            } finally {
                setLoadingClientes(false)
            }
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [searchCliente])

    // Búsqueda de bodegas
    useEffect(() => {
        if (searchBodega.trim() === "") {
            setBodegasResultado([])
            return
        }
        const delayDebounceFn = setTimeout(async () => {
            try {
                setLoadingBodegas(true)
                const response = await apiClient.get("/bodega/combo-bodega", {
                    params: { search: searchBodega },
                })
                const data = response.data.data || response.data
                setBodegasResultado(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error("Error searching bodegas:", error)
                setBodegasResultado([])
            } finally {
                setLoadingBodegas(false)
            }
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [searchBodega])

    const handlePrintOrder = (orderId: number | null) => {
        if (orderId) {
            const pdfUrl = `https://app.portafolioerp.com/pos/pedido-print/${orderId}`
            window.open(pdfUrl, "_blank")
        }
    }

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

    const isValidRequirements = (): boolean => {
        return !!selectedBodega && !!selectedCliente
    }

    const handleNewOrder = () => {
        if (isValidRequirements()) {
            onNewOrder()
        }
    }

    const handleCompleteOrder = () => {
        if (isValidRequirements()) {
            onCompleteOrder()
        }
    }

    const isMissingRequirements = !isValidRequirements()
    const canAddProducts = currentOrder?.estado === "pendiente"

    // --- Lógica para crear cliente ---
    const handleCreateCliente = async () => {
        const errors: Record<string, string> = {}
        if (!clienteForm.id_tipo_documento) errors.id_tipo_documento = "Seleccione tipo de documento"
        if (!clienteForm.numero_documento) errors.numero_documento = "Número de documento requerido"
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }
        setFormErrors({})
        setCreatingCliente(true)

        try {
            const payload = {
                id_tipo_documento: parseInt(clienteForm.id_tipo_documento),
                numero_documento: clienteForm.numero_documento,
                primer_nombre: clienteForm.primer_nombre || null,
                otros_nombres: clienteForm.otros_nombres || null,
                primer_apellido: clienteForm.primer_apellido || null,
                segundo_apellido: clienteForm.segundo_apellido || null,
                razon_social: clienteForm.razon_social || null,
                direccion: clienteForm.direccion || null,
                email: clienteForm.email || null,
                telefono_1: clienteForm.telefono_1 || null,
                proveedor: false,
                sumar_aiu: false,
                porcentaje_aiu: 0,
                porcentaje_reteica: 0,
            }

            const response = await apiClient.post("/nit", payload)
            if (response.data.success) {
                const nuevoCliente = response.data.data
                setShowCreateClienteModal(false)
                setClienteForm({
                    id_tipo_documento: tiposDocumento[0]?.id.toString() || "",
                    numero_documento: "",
                    primer_nombre: "",
                    otros_nombres: "",
                    primer_apellido: "",
                    segundo_apellido: "",
                    razon_social: "",
                    direccion: "",
                    email: "",
                    telefono_1: "",
                })
                if (onUpdateCliente) {
                    onUpdateCliente(nuevoCliente)
                }
                window.dispatchEvent(
                    new CustomEvent("showError", {
                        detail: {
                            message: "Cliente creado exitosamente",
                            type: "success",
                            autoClose: true,
                            duration: 3000,
                        },
                    })
                )
            } else {
                throw new Error(response.data.message || "Error al crear cliente")
            }
        } catch (error: any) {
            let errorMsg = "Error al crear cliente"
            if (error.response?.data?.message) {
                const serverMsg = error.response.data.message
                if (typeof serverMsg === "object") {
                    const msgs = Object.values(serverMsg).flat()
                    errorMsg = msgs.join(", ")
                } else {
                    errorMsg = serverMsg
                }
            } else if (error.message) {
                errorMsg = error.message
            }
            window.dispatchEvent(
                new CustomEvent("showError", {
                    detail: { message: errorMsg, type: "error", autoClose: true, duration: 5000 },
                })
            )
        } finally {
            setCreatingCliente(false)
        }
    }

    const handleInputChange = (field: keyof typeof clienteForm, value: string) => {
        setClienteForm(prev => ({ ...prev, [field]: value }))
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    return (
        <>
            <div
                className={`
                    h-full flex flex-col border-l border-border bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out flex-shrink-0 
                    ${isExpanded ? "w-full lg:w-96" : "w-16"}
                `}
            >
                {/* HEADER */}
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
                            className={`h-7 w-7 p-0 ${isExpanded ? "" : "mx-auto"}`}
                            title={isExpanded ? "Colapsar Vista" : "Expandir Vista"}
                        >
                            {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* SELECTOR DE CLIENTE (solo cuando expandido) */}
                {isExpanded && (
                    <div className="p-2 border-b border-border flex-shrink-0">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label htmlFor="cliente-selector" className="text-[11px] font-medium">
                                    Cliente {!selectedCliente && <span className="text-destructive">*</span>}
                                </label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] gap-1"
                                    onClick={() => setShowCreateClienteModal(true)}
                                >
                                    <UserPlus className="h-3 w-3" />
                                    Nuevo cliente
                                </Button>
                            </div>
                            {selectedCliente ? (
                                <div className="flex items-center justify-between p-1 border rounded bg-muted/30">
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        <div className="text-[11px] leading-tight">
                                            <div className="font-medium truncate max-w-[120px]">
                                                {selectedCliente.nombre_completo}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                                {selectedCliente.text || "Cliente por defecto"}
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
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between h-7 px-2 text-[11px]"
                                            id="cliente-selector"
                                        >
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
                                                onChange={e => setSearchCliente(e.target.value)}
                                                className="pl-6 h-6 text-xs"
                                            />
                                        </div>
                                        <div className="max-h-44 overflow-auto">
                                            {loadingClientes ? (
                                                <div className="text-center py-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto" />
                                                    <p className="text-[10px] mt-1 text-muted-foreground">
                                                        Buscando clientes...
                                                    </p>
                                                </div>
                                            ) : clientesResultado.length > 0 ? (
                                                clientesResultado.map(cliente => (
                                                    <DropdownMenuItem
                                                        key={cliente.id}
                                                        onClick={() => handleSelectCliente(cliente)}
                                                        className="flex flex-col items-start p-2 mb-1 hover:bg-accent rounded"
                                                    >
                                                        <div className="font-medium text-[11px] leading-tight">
                                                            {cliente.nombre_completo}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {cliente.text}
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))
                                            ) : searchCliente.trim() !== "" ? (
                                                <div className="text-center py-2 text-muted-foreground text-[11px]">
                                                    Sin resultados
                                                </div>
                                            ) : (
                                                <div className="text-center py-2 text-muted-foreground text-[11px]">
                                                    Empieza a escribir para buscar clientes...
                                                </div>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                )}

                {/* MODO COLAPSADO (resumen) */}
                {!isExpanded && currentOrder && (
                    <div className="flex-1 flex flex-col justify-between p-2 items-center max-h-149">
                        <div className="space-y-3 pt-4">
                            <div className="text-center text-[15px] font-mono">
                                {currentOrder.id_backend ? `#${currentOrder.id_backend}` : "TEMP"}
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

                {/* CONTENIDO PRINCIPAL (EXPANDIDO CON PEDIDO) */}
                {currentOrder && isExpanded && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-2">
                                {currentOrder.productos.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-xs text-muted-foreground">No hay productos en este pedido</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {currentOrder.productos.map(item => (
                                            <Card key={item.consecutivo} className="p-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-xs leading-tight">{item.nombre}</h4>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {formatPrice(item.costo)} c/u
                                                        </div>
                                                        {(item.descuento_porcentaje > 0 || item.descuento_valor > 0) && (
                                                            <div className="text-[11px] text-orange-600 leading-tight">
                                                                Desc:{" "}
                                                                {item.descuento_porcentaje > 0 && `${item.descuento_porcentaje}%`}
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
                                                                onClick={() =>
                                                                    onUpdateQuantity(item.id_producto, item.cantidad - 1)
                                                                }
                                                            >
                                                                <Minus className="h-3 w-3 text-destructive" />
                                                            </Button>
                                                            <span className="text-xs font-medium w-6 text-center">
                                                                {item.cantidad}
                                                            </span>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-5 w-5 p-0 bg-transparent hover:bg-green-50"
                                                                onClick={() =>
                                                                    onUpdateQuantity(item.id_producto, item.cantidad + 1)
                                                                }
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

                        {/* SUMMARY Y ACCIONES */}
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
                                        ))}
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
                                                onClick={handleNewOrder}
                                                className="w-1/2 gap-1 h-8"
                                                disabled={isMissingRequirements}
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

                {/* ESTADO SIN PEDIDO ACTIVO (EXPANDIDO) */}
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

                {/* ESTADO SIN PEDIDO Y COLAPSADO */}
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

            {/* MODAL PARA CREAR CLIENTE */}
            <Dialog open={showCreateClienteModal} onOpenChange={setShowCreateClienteModal}>
                <DialogContent className="sm:max-w-md md:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Nuevo Cliente
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Tipo documento *</Label>
                                <Select
                                    value={clienteForm.id_tipo_documento}
                                    onValueChange={(val) => handleInputChange("id_tipo_documento", val)}
                                    disabled={loadingTipos}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tiposDocumento.map((tipo) => (
                                            <SelectItem key={tipo.id} value={tipo.id.toString()} className="text-xs">
                                                {tipo.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.id_tipo_documento && (
                                    <p className="text-[10px] text-destructive">{formErrors.id_tipo_documento}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Número documento *</Label>
                                <Input
                                    value={clienteForm.numero_documento}
                                    onChange={(e) => handleInputChange("numero_documento", e.target.value)}
                                    className="h-8 text-xs"
                                    placeholder="NIT / CC"
                                />
                                {formErrors.numero_documento && (
                                    <p className="text-[10px] text-destructive">{formErrors.numero_documento}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Primer nombre</Label>
                                <Input
                                    value={clienteForm.primer_nombre}
                                    onChange={(e) => handleInputChange("primer_nombre", e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Segundo nombre</Label>
                                <Input
                                    value={clienteForm.otros_nombres}
                                    onChange={(e) => handleInputChange("otros_nombres", e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Primer apellido</Label>
                                <Input
                                    value={clienteForm.primer_apellido}
                                    onChange={(e) => handleInputChange("primer_apellido", e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Segundo apellido</Label>
                                <Input
                                    value={clienteForm.segundo_apellido}
                                    onChange={(e) => handleInputChange("segundo_apellido", e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Razón social</Label>
                            <Input
                                value={clienteForm.razon_social}
                                onChange={(e) => handleInputChange("razon_social", e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Dirección</Label>
                            <Input
                                value={clienteForm.direccion}
                                onChange={(e) => handleInputChange("direccion", e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Email</Label>
                                <Input
                                    type="email"
                                    value={clienteForm.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Teléfono</Label>
                                <Input
                                    value={clienteForm.telefono_1}
                                    onChange={(e) => handleInputChange("telefono_1", e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowCreateClienteModal(false)} disabled={creatingCliente}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateCliente} disabled={creatingCliente}>
                            {creatingCliente ? "Creando..." : "Crear Cliente"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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