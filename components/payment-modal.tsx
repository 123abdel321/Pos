"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { X, CreditCard, DollarSign, Smartphone, Building2, Plus, Trash2, ArrowLeft, Coins, Calculator, Loader2, Zap } from "lucide-react"
import type { Order } from "@/app/page"
import apiClient from "@/app/api/apiClient"

// --- Tipos ---
interface PaymentMethod {
    id: number
    nombre: string
    text: string
}

interface Resolution {
    id: number
    nombre: string
    prefijo: string
    consecutivo: number
    consecutivo_desde: number
    consecutivo_hasta: number
    text: string
}

interface BillEntry {
    denomination: number
    quantity: number
}

interface PaymentEntry {
    id: number
    valor: number
    metodo: PaymentMethod
    billetes?: BillEntry[]
}

interface PaymentModalProps {
    order: Order
    onPayment: (paymentData: any) => void
    onClose: () => void
}

// --- Constantes ---
const COLOMBIAN_BILLS = [
    { value: 100000, label: "100.000", common: true },
    { value: 50000, label: "50.000", common: true },
    { value: 20000, label: "20.000", common: true },
    { value: 10000, label: "10.000", common: true },
    { value: 5000, label: "5.000", common: true },
    { value: 2000, label: "2.000", common: false },
    { value: 1000, label: "1.000", common: false },
]

// --- Utilidades de formato (CORREGIDAS) ---
const formatCOP = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(value)
}

// Convierte un string con formato "1.234.567" a número 1234567
const parseFormattedNumber = (formatted: string): number => {
    const clean = formatted.replace(/\./g, "").replace(/,/g, "")
    const num = parseInt(clean, 10)
    return isNaN(num) ? 0 : num
}

// Formatea un número con separadores de miles, sin símbolo de moneda
const formatThousands = (value: number): string => {
    return value.toLocaleString("es-CO")
}

const getPaymentIcon = (methodName: string) => {
    const name = methodName.toLowerCase()
    if (name === "efectivo") return <DollarSign className="h-4 w-4" />
    if (name === "transferencia") return <Smartphone className="h-4 w-4" />
    if (name === "pagos bancolombia") return <Building2 className="h-4 w-4" />
    if (name === "nequi") return <Smartphone className="h-4 w-4" />
    if (name === "daviplata") return <Zap className="h-4 w-4" />
    return <CreditCard className="h-4 w-4" />
}

// --- Componente Principal ---
export function PaymentModal({ order, onPayment, onClose }: PaymentModalProps) {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [resolutions, setResolutions] = useState<Resolution[]>([])
    const [payments, setPayments] = useState<PaymentEntry[]>([])
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
    const [selectedResolution, setSelectedResolution] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Estados para entrada de valores
    const [currentInputAmount, setCurrentInputAmount] = useState<string>("")
    const [selectedBills, setSelectedBills] = useState<{ [key: number]: number }>({})
    const [paymentMode, setPaymentMode] = useState<"quick" | "bills" | "manual">("quick")

    // Cálculos derivados (CORREGIDOS)
    const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.valor, 0), [payments])
    const remaining = useMemo(() => order.total - totalPaid, [order.total, totalPaid])
    const change = useMemo(() => Math.max(0, -remaining), [remaining])
    const amountToPayQuick = useMemo(() => (remaining > 0 ? remaining : order.total), [remaining, order.total])

    // Cargar métodos de pago y resoluciones
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [paymentResponse, resolutionResponse] = await Promise.all([
                    apiClient.get('/forma-pago/combo-forma-pago?type=ventas'),
                    apiClient.get('/resoluciones/combo-resoluciones')
                ])

                const methods: PaymentMethod[] = paymentResponse.data.data.map((item: any) => ({
                    id: item.id,
                    nombre: item.nombre,
                    text: item.text
                }))
                setPaymentMethods(methods)
                const defaultMethod = methods.find(m => m.nombre.toLowerCase() === 'efectivo') || methods[0]
                setSelectedMethod(defaultMethod || null)

                const resolutionsData: Resolution[] = resolutionResponse.data.data.map((item: any) => ({
                    id: item.id,
                    nombre: item.nombre,
                    prefijo: item.prefijo,
                    consecutivo: item.consecutivo,
                    consecutivo_desde: item.consecutivo_desde,
                    consecutivo_hasta: item.consecutivo_hasta,
                    text: item.text
                }))
                setResolutions(resolutionsData)
                if (resolutionsData.length > 0) {
                    setSelectedResolution(resolutionsData[0].id.toString())
                }
            } catch (err) {
                console.error(err)
                setError("Error al cargar los datos. Verifique la conexión.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Prellenar el importe cuando el método no es efectivo
    useEffect(() => {
        if (selectedMethod && selectedMethod.nombre.toLowerCase() !== "efectivo" && remaining > 0) {
            setCurrentInputAmount(formatThousands(remaining))
            setPaymentMode("manual")
        } else if (selectedMethod && selectedMethod.nombre.toLowerCase() === "efectivo") {
            setCurrentInputAmount("")
            setPaymentMode("quick")
        }
    }, [selectedMethod, remaining])

    // Agregar un pago
    const addPayment = useCallback((amount: number, method: PaymentMethod, bills?: BillEntry[]) => {
        if (amount <= 0) return
        setPayments(prev => [...prev, {
            id: Date.now() + Math.random(),
            valor: amount,
            metodo: method,
            billetes: bills
        }])
        setCurrentInputAmount("")
        setSelectedBills({})
        setPaymentMode("quick")
    }, [])

    // Pagos rápidos (efectivo)
    const handleQuickPayment = useCallback((amount: number) => {
        if (!selectedMethod) return
        addPayment(amount, selectedMethod)
    }, [selectedMethod, addPayment])

    // Agregar manual (cualquier método)
    const handleManualAdd = useCallback(() => {
        if (!selectedMethod || !currentInputAmount) return
        const amount = parseFormattedNumber(currentInputAmount)
        if (amount > 0) {
            addPayment(amount, selectedMethod)
        }
    }, [selectedMethod, currentInputAmount, addPayment])

    // Manejar cambio en input (formato miles)
    const handleInputChange = useCallback((value: string) => {
        const numeric = value.replace(/\D/g, "")
        if (numeric === "") {
            setCurrentInputAmount("")
            return
        }
        const numberValue = parseInt(numeric, 10)
        setCurrentInputAmount(formatThousands(numberValue))
    }, [])

    // Agregar pago desde selector de billetes
    const addCashPaymentFromBills = useCallback(() => {
        if (!selectedMethod || selectedMethod.nombre.toLowerCase() !== "efectivo") return
        const total = Object.entries(selectedBills).reduce((sum, [den, qty]) => sum + Number(den) * qty, 0)
        if (total <= 0) return
        const billsData: BillEntry[] = Object.entries(selectedBills)
            .filter(([_, qty]) => qty > 0)
            .map(([den, qty]) => ({ denomination: Number(den), quantity: qty }))
        addPayment(total, selectedMethod, billsData)
    }, [selectedMethod, selectedBills, addPayment])

    // Seleccionar billete
    const handleBillSelect = useCallback((denomination: number) => {
        setSelectedBills(prev => ({ ...prev, [denomination]: (prev[denomination] || 0) + 1 }))
    }, [])

    // Quitar billete
    const handleBillRemove = useCallback((denomination: number) => {
        setSelectedBills(prev => {
            const newQty = (prev[denomination] || 0) - 1
            if (newQty <= 0) {
                const { [denomination]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [denomination]: newQty }
        })
    }, [])

    // Eliminar pago registrado
    const removePayment = useCallback((id: number) => {
        setPayments(prev => prev.filter(p => p.id !== id))
    }, [])

    // Número de factura actual
    const getCurrentInvoiceNumber = useCallback(() => {
        if (!selectedResolution) return ""
        const resolution = resolutions.find(r => r.id.toString() === selectedResolution)
        return resolution ? `${resolution.prefijo}${resolution.consecutivo}` : ""
    }, [selectedResolution, resolutions])

    // Completar venta
    const handleCompletePayment = async () => {
        if (remaining > 0 || payments.length === 0) return
        const selectedResolutionData = resolutions.find(r => r.id.toString() === selectedResolution)
        if (!selectedResolutionData) {
            setError("Seleccione una resolución válida")
            return
        }
        setSubmitting(true)
        try {
            const paymentData = {
                pagos: payments.map(p => ({
                    id: p.metodo.id,
                    valor: p.valor,
                    billetes: p.billetes
                })),
                productos: order.productos,
                id_ubicacion: order.id_ubicacion,
                id_bodega: "1",
                consecutivo_bodegas: "2",
                id_cliente: null,
                fecha_manual: new Date().toISOString().split("T")[0],
                id_resolucion: selectedResolution,
                id_vendedor: null,
                id_pedido: order.id_backend,
                consecutivo: selectedResolutionData.consecutivo,
                observacion: `Venta ${order.ubicacion_nombre}`,
            }
            await onPayment(paymentData)
        } catch (err) {
            console.error(err)
            setError("Error al procesar el pago. Intente nuevamente.")
        } finally {
            setSubmitting(false)
        }
    }

    const billsTotal = useMemo(() => {
        return Object.entries(selectedBills).reduce((sum, [den, qty]) => sum + Number(den) * qty, 0)
    }, [selectedBills])

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none flex flex-col p-0 bg-background text-foreground">
                {/* Header */}
                <DialogHeader className="p-4 border-b shrink-0 bg-muted/20">
                    <DialogTitle className="flex items-center gap-3 text-lg md:text-2xl font-extrabold">
                        <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        Procesar Pago
                        <span className="text-xs md:text-base font-medium text-muted-foreground ml-2 md:ml-4">
                            ({order.ubicacion_nombre})
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* Body: grid responsiva */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 md:grid md:grid-cols-12 md:gap-4 md:space-y-0">
                    {/* Columna izquierda: Facturación y Resumen */}
                    <div className="md:col-span-3 space-y-4">
                        <Card className="p-3">
                            <h3 className="font-semibold text-sm mb-2 text-primary">Facturación</h3>
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Resolución *</Label>
                                    <Select value={selectedResolution} onValueChange={setSelectedResolution} disabled={loading}>
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {resolutions.map(r => (
                                                <SelectItem key={r.id} value={r.id.toString()}>{r.text}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">No. Factura *</Label>
                                    <Input value={getCurrentInvoiceNumber()} readOnly className="h-8 font-mono text-sm font-semibold bg-muted" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-3">
                            <h3 className="font-semibold text-sm mb-2 text-primary">Resumen</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span>{formatCOP(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">IVA:</span>
                                    <span>{formatCOP(order.iva)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Retención:</span>
                                    <span>{formatCOP(order.retencion)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">{formatCOP(order.total)}</span>
                                </div>
                            </div>
                        </Card>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/50 text-destructive p-2 rounded-md text-sm">
                                ❌ {error}
                            </div>
                        )}
                    </div>

                    {/* Columna central: Métodos de pago y selector */}
                    <div className="md:col-span-6 space-y-4">
                        <Card className="p-3">
                            <h3 className="font-semibold text-sm mb-2 text-primary border-b pb-1">Métodos de Pago</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
                                    ))
                                ) : (
                                    paymentMethods.map(method => (
                                        <Button
                                            key={method.id}
                                            variant={selectedMethod?.id === method.id ? "default" : "outline"}
                                            onClick={() => setSelectedMethod(method)}
                                            className="flex flex-col items-center justify-center h-14 p-1 text-xs font-semibold"
                                        >
                                            {getPaymentIcon(method.nombre)}
                                            <span className="truncate w-full">{method.text}</span>
                                        </Button>
                                    ))
                                )}
                            </div>
                        </Card>

                        {selectedMethod && (
                            <Card className="p-3">
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1 text-primary">
                                    <Coins className="h-4 w-4" />
                                    {selectedMethod.text}
                                </h4>

                                {selectedMethod.nombre.toLowerCase() === "efectivo" ? (
                                    <div className="space-y-3">
                                        {/* Modos */}
                                        <div className="flex gap-2">
                                            {[
                                                { mode: "quick", icon: Calculator, label: "Rápido" },
                                                { mode: "bills", icon: Coins, label: "Billetes" },
                                                { mode: "manual", icon: DollarSign, label: "Manual" }
                                            ].map(({ mode, icon: Icon, label }) => (
                                                <Button
                                                    key={mode}
                                                    variant={paymentMode === mode ? "default" : "secondary"}
                                                    onClick={() => setPaymentMode(mode as any)}
                                                    className="flex-1 gap-1 h-8 text-xs"
                                                >
                                                    <Icon className="h-3 w-3" /> {label}
                                                </Button>
                                            ))}
                                        </div>

                                        <Separator />

                                        {paymentMode === "quick" && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <Button onClick={() => handleQuickPayment(amountToPayQuick)} disabled={remaining <= 0} className="bg-success text-white hover:bg-success/90">
                                                    Exacto ({formatCOP(amountToPayQuick)})
                                                </Button>
                                                {[20000, 50000, 100000].map(amount => (
                                                    <Button key={amount} onClick={() => handleQuickPayment(amount)} variant="outline">
                                                        {formatCOP(amount)}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}

                                        {paymentMode === "bills" && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                    {COLOMBIAN_BILLS.filter(b => b.common).map(bill => (
                                                        <div key={bill.value} className="flex flex-col items-center gap-1">
                                                            <Button
                                                                onClick={() => handleBillSelect(bill.value)}
                                                                variant="outline"
                                                                className={`w-full h-12 flex flex-col ${selectedBills[bill.value] ? "border-primary bg-primary/10" : ""}`}
                                                            >
                                                                <span className="text-sm font-bold">{bill.label}</span>
                                                                <span className="text-xs">({selectedBills[bill.value] || 0})</span>
                                                            </Button>
                                                            {selectedBills[bill.value] > 0 && (
                                                                <Button onClick={() => handleBillRemove(bill.value)} variant="ghost" size="sm" className="h-6 text-destructive">
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="bg-muted p-3 rounded-lg">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold">Total billetes:</span>
                                                        <span className="text-xl font-bold text-success">{formatCOP(billsTotal)}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button onClick={addCashPaymentFromBills} disabled={billsTotal <= 0} className="flex-1 gap-1">
                                                            <Plus className="h-4 w-4" /> Agregar pago
                                                        </Button>
                                                        <Button onClick={() => setSelectedBills({})} variant="outline">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {paymentMode === "manual" && (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="text"
                                                        value={currentInputAmount}
                                                        onChange={e => handleInputChange(e.target.value)}
                                                        placeholder="Monto en efectivo"
                                                        className="pl-7 h-10"
                                                    />
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                </div>
                                                <Button onClick={handleManualAdd} disabled={!currentInputAmount || parseFormattedNumber(currentInputAmount) <= 0}>
                                                    <Plus className="h-4 w-4" /> Agregar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Otros métodos
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                type="text"
                                                value={currentInputAmount}
                                                onChange={e => handleInputChange(e.target.value)}
                                                placeholder={`Monto ${selectedMethod.text}`}
                                                className="pl-7 h-9"
                                            />
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        </div>
                                        <Button onClick={handleManualAdd} disabled={!currentInputAmount || parseFormattedNumber(currentInputAmount) <= 0}>
                                            <Plus className="h-4 w-4" /> Agregar
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Columna derecha: Balance y Pagos registrados */}
                    <div className="md:col-span-3 space-y-4">
                        <Card className="p-3 bg-warning/10 border-warning/30">
                            <h3 className="font-bold text-sm flex items-center gap-2 text-warning">
                                <span className="h-2 w-2 bg-warning rounded-full animate-pulse" />
                                Balance
                            </h3>
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between text-sm">
                                    <span>Pagado</span>
                                    <span className="font-bold text-success">{formatCOP(totalPaid)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Faltante</span>
                                    <span className={remaining > 0 ? "text-destructive" : "text-success"}>{formatCOP(Math.abs(remaining))}</span>
                                </div>
                                {change > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Cambio</span>
                                        <span className="font-bold text-info">{formatCOP(change)}</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {payments.length > 0 && (
                            <Card className="p-3">
                                <h4 className="font-semibold text-sm mb-2">Pagos registrados</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {payments.map(p => (
                                        <div key={p.id} className="flex justify-between items-center text-sm border-b pb-1">
                                            <div className="flex items-center gap-2">
                                                {getPaymentIcon(p.metodo.nombre)}
                                                <span>{p.metodo.text}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{formatCOP(p.valor)}</span>
                                                <Button variant="ghost" size="icon" onClick={() => removePayment(p.id)} className="h-6 w-6 text-destructive">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t shrink-0 bg-muted/10">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1 h-11">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCompletePayment}
                            disabled={remaining > 0 || payments.length === 0 || submitting}
                            className={`flex-1 h-11 gap-2 ${remaining > 0 ? "bg-warning hover:bg-warning/90" : "bg-success hover:bg-success/90"}`}
                        >
                            {submitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <CreditCard className="h-5 w-5" />
                                    {remaining > 0 ? `Pagar ${formatCOP(remaining)} faltante` : "Completar venta"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}