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

// --- I. Definiciones de Tipos y Constantes ---

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

const COLOMBIAN_BILLS = [
  { value: 100000, label: "100.000", common: true },
  { value: 50000, label: "50.000", common: true },
  { value: 20000, label: "20.000", common: true },
  { value: 10000, label: "10.000", common: true },
  { value: 5000, label: "5.000", common: true },
  { value: 2000, label: "2.000", common: false },
  { value: 1000, label: "1.000", common: false },
]

// --- II. Funciones de Utilidad ---

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price)
}

const getPaymentIcon = (methodName: string) => {
  switch (methodName.toLowerCase()) {
    case "efectivo": return <DollarSign className="h-4 w-4" />
    case "transferencia": return <Smartphone className="h-4 w-4" />
    case "pagos bancolombia": return <Building2 className="h-4 w-4" />
    case "nequi": return <Smartphone className="h-4 w-4" />
    case "daviplata": return <Zap className="h-4 w-4" />
    default: return <CreditCard className="h-4 w-4" />
  }
}

// --- III. El Componente Principal ---
export function PaymentModal({ order, onPayment, onClose }: PaymentModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [selectedResolution, setSelectedResolution] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para la entrada de valor
  const [currentInputAmount, setCurrentInputAmount] = useState<string>("")
  const [selectedBills, setSelectedBills] = useState<{ [key: number]: number }>({})
  const [paymentMode, setPaymentMode] = useState<"quick" | "bills" | "manual">("quick")

  // Función para formatear número con separadores de miles
  const formatNumberWithCommas = (number: number): string => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  // Función para quitar formato y obtener el número puro
  const parseFormattedNumber = (formatted: string): number => {
    return Number(formatted.replace(/\./g, ''))
  }

  const totalPaid = useMemo(() => payments.reduce((sum, payment) => sum + payment.valor, 0), [payments])
  const remaining = useMemo(() => order.total - totalPaid, [order.total, totalPaid])
  const change = useMemo(() => Math.max(0, -remaining), [remaining])
  const amountToPayQuick = useMemo(() => remaining > 0 ? remaining : order.total, [remaining, order.total])

  // EFECTO: Actualizar el input cuando cambia el método de pago o el remaining
  useEffect(() => {
    if (selectedMethod && selectedMethod.nombre.toLowerCase() !== "efectivo" && remaining > 0) {
      // Formatear el remaining con separadores de miles
      setCurrentInputAmount(formatNumberWithCommas(remaining))
    }
  }, [selectedMethod, remaining])

  // EFECTO: RESTAURADO PARA CARGAR DATOS DE LA API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Simulación de consumo de API (usando tu estructura original)
        const [paymentResponse, resolutionResponse] = await Promise.all([
          apiClient.get('/forma-pago/combo-forma-pago'),
          apiClient.get('/resoluciones/combo-resoluciones')
        ])

        const methods: PaymentMethod[] = paymentResponse.data.data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
          text: item.text 
        }))
        setPaymentMethods(methods)
        setSelectedMethod(methods.find(m => m.nombre.toLowerCase() === 'efectivo') || methods[0] || null)

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
        console.error("Error fetching data:", err)
        setError("Error al cargar los datos de la API. Verifique la conexión o el formato de respuesta.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // --- IV. Cálculos y Lógica Derivada ---

  const calculateTotalFromBills = useCallback(() => {
    return Object.entries(selectedBills).reduce((sum, [denomination, quantity]) => {
      return sum + (Number(denomination) * quantity)
    }, 0)
  }, [selectedBills])

  const getCurrentInvoiceNumber = useCallback(() => {
    if (!selectedResolution) return ""
    const resolution = resolutions.find(r => r.id.toString() === selectedResolution)
    return resolution ? `${resolution.prefijo}${resolution.consecutivo}` : ""
  }, [selectedResolution, resolutions])

  const addPayment = useCallback((amount: number, method: PaymentMethod, bills: BillEntry[] | undefined = undefined) => {
    if (amount <= 0) return
    const newPayment: PaymentEntry = {
      id: Date.now(),
      valor: amount,
      metodo: method,
      billetes: bills
    }
    setPayments(prev => [...prev, newPayment])
    setCurrentInputAmount("")
    setSelectedBills({})
    setPaymentMode("quick")
  }, [])

  const addCashPaymentFromBills = useCallback(() => {
    if (!selectedMethod || selectedMethod.nombre.toLowerCase() !== "efectivo") return
    const total = calculateTotalFromBills()
    if (total <= 0) return

    const billsData: BillEntry[] = Object.entries(selectedBills)
      .filter(([_, quantity]) => quantity > 0)
      .map(([denomination, quantity]) => ({
        denomination: Number(denomination),
        quantity
      }))

    addPayment(total, selectedMethod, billsData)
  }, [selectedMethod, calculateTotalFromBills, selectedBills, addPayment])

  const handleQuickPayment = useCallback((amount: number) => {
    if (!selectedMethod) return
    addPayment(amount, selectedMethod)
  }, [selectedMethod, addPayment])

  // Modificar handleManualAdd para manejar el formato
  const handleManualAdd = useCallback(() => {
    if (!selectedMethod || !currentInputAmount) return
    // Convertir el valor formateado a número puro
    const amount = parseFormattedNumber(currentInputAmount)
    if (amount > 0) {
        addPayment(amount, selectedMethod)
    }
  }, [selectedMethod, currentInputAmount, addPayment])

  // Modificar el onChange del input para mantener el formato
  const handleInputChange = useCallback((value: string) => {
    // Remover todos los puntos existentes
    const cleanValue = value.replace(/\./g, '')
    
    // Verificar si es un número válido
    if (cleanValue === '' || /^\d+$/.test(cleanValue)) {
      const numberValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10)
      // Formatear el número con separadores de miles
      setCurrentInputAmount(formatNumberWithCommas(numberValue))
    }
  }, [])

  const removePayment = useCallback((id: number) => {
    setPayments(prev => prev.filter(p => p.id !== id))
  }, [])

  const handleBillSelect = useCallback((denomination: number) => {
    setSelectedBills(prev => ({
      ...prev,
      [denomination]: (prev[denomination] || 0) + 1
    }))
  }, [])

  const handleBillRemove = useCallback((denomination: number) => {
    setSelectedBills(prev => {
      const newQuantity = (prev[denomination] || 0) - 1
      if (newQuantity <= 0) {
        const { [denomination]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [denomination]: newQuantity }
    })
  }, [])

  // Modificar el handler para cambiar método de pago
  const handleMethodChange = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method)
    
    // Si el método no es efectivo, establecer el monto completo formateado
    if (method.nombre.toLowerCase() !== "efectivo" && remaining > 0) {
      setCurrentInputAmount(formatNumberWithCommas(remaining))
      setPaymentMode("manual") // Cambiar a modo manual automáticamente
    } else {
      setCurrentInputAmount("")
      setPaymentMode("quick")
    }
  }, [remaining])

  const handleCompletePayment = async () => {
    if (remaining > 0 || payments.length === 0) return
    const selectedResolutionData = resolutions.find(r => r.id.toString() === selectedResolution)
    if (!selectedResolutionData) {
      setError("No se ha seleccionado una resolución válida")
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
        id_pedido: Number.parseInt(order.id.replace("order-", "")),
        consecutivo: selectedResolutionData.consecutivo,
        observacion: `Venta ${order.ubicacion_nombre}`,
      }
      
      await onPayment(paymentData)
      
    } catch (error) {
      console.error("Error al procesar el pago:", error)
      setError("Error al procesar el pago. Por favor, intente nuevamente.")
    } finally {
      setSubmitting(false) 
    }
  }

  return (
  <Dialog open={true} onOpenChange={onClose}>
    <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none flex flex-col p-0 bg-[#0e162b] text-card-foreground">
      {/* HEADER */}
      <DialogHeader className="p-4 border-b border-[#1b2641] bg-[#1a2035] shrink-0">
        <DialogTitle className="flex items-center gap-3 text-lg md:text-2xl font-extrabold text-foreground">
          <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Procesar Pago
          <span className="text-xs md:text-base font-medium text-muted-foreground ml-2 md:ml-4">
            ({order.ubicacion_nombre})
          </span>
        </DialogTitle>
      </DialogHeader>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-3 py-2 md:p-4 space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3">
        {/* Facturación y Resumen */}
        <div className="md:col-span-3 flex flex-col gap-3">
          <Card className="p-3 border border-[#202a46] bg-[#161b2e] shadow-sm">
            <h3 className="font-semibold text-sm mb-2 text-primary">Facturación</h3>
            <div className="space-y-2 text-xs">
              <div>
                <Label htmlFor="resolution" className="text-[11px] text-muted-foreground">Resolución *</Label>
                <Select
                  value={selectedResolution}
                  onValueChange={setSelectedResolution}
                  disabled={loading}
                >
                  <SelectTrigger className="h-7 mt-0.5 text-xs bg-[#1d2440] border border-[#2b355d]">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutions.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="invoice" className="text-[11px] text-muted-foreground">No. Factura *</Label>
                <Input
                  id="invoice"
                  value={getCurrentInvoiceNumber()}
                  readOnly
                  className="h-7 mt-0.5 bg-[#1d2440] text-primary font-semibold text-xs border border-[#2b355d] font-mono"
                />
              </div>
            </div>
          </Card>

          <Card className="p-3 border border-[#202a46] bg-[#161b2e] shadow-sm">
            <h3 className="font-semibold text-sm mb-2 text-primary">Resumen</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA (19%):</span>
                <span>{formatPrice(order.iva)}</span>
              </div>
              <Separator className="my-1 bg-border/40" />
              <div className="flex justify-between items-center border-t border-dashed border-border pt-1">
                <span className="font-semibold text-foreground text-xs">Total</span>
                <span className="text-primary font-bold text-sm">{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-lg text-sm shadow-sm">
              ❌ <b>Error:</b> {error}
            </div>
          )}
        </div>

        {/* Métodos de Pago */}
        <div className="md:col-span-6 flex flex-col gap-3">
          <Card className="p-3 shadow-sm border border-[#222c4a] bg-[#161b2e]">
            <h3 className="font-semibold text-sm mb-2 text-primary border-b border-[#222c4a] pb-1">
              Métodos de Pago
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="h-14 border rounded-md bg-[#2d3748] animate-pulse" />
                ))
              ) : (
                paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant={selectedMethod?.id === method.id ? "default" : "outline"}
                    onClick={() => handleMethodChange(method)}
                    className={`flex flex-col items-center justify-center h-14 p-1 text-[10px] sm:text-[11px] font-semibold transition-all
                      ${selectedMethod?.id === method.id
                        ? "bg-primary/90 ring-1 ring-primary/50 shadow-md"
                        : "hover:bg-[#2d3748] border-[#2d3748]"
                      }`}
                  >
                    {getPaymentIcon(method.nombre)}
                    <span className="truncate w-full">{method.text}</span>
                  </Button>
                ))
              )}
            </div>
          </Card>

          {selectedMethod && (
            <Card className="p-3 shadow-sm bg-[#161b2e]/80 border border-[#222c4a]">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-1 text-primary">
                <Coins className="h-4 w-4" />
                {selectedMethod.text}
              </h4>

              {selectedMethod.nombre.toLowerCase() === "efectivo" ? (
                <div className="space-y-3">
                  {/* Tabs */}
                  <div className="flex gap-1.5">
                    {[{ mode: "quick", icon: Calculator, label: "Rápido" },
                      { mode: "bills", icon: Coins, label: "Billetes" },
                      { mode: "manual", icon: DollarSign, label: "Manual" }].map(({ mode, icon: Icon, label }) => (
                      <Button
                        key={mode}
                        variant={paymentMode === mode ? "default" : "secondary"}
                        onClick={() => setPaymentMode(mode as "quick" | "bills" | "manual")}
                        className="flex-1 gap-1 h-8 text-[10px] sm:text-[11px]"
                      >
                        <Icon className="h-3 w-3" /> {label}
                      </Button>
                    ))}
                  </div>

                  <Separator className="bg-[#1b2641]" />

                  {/* Modo rápido */}
                  {paymentMode === "quick" && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      <Button
                        onClick={() => handleQuickPayment(amountToPayQuick)}
                        disabled={remaining <= 0}
                        className="h-10 bg-success hover:bg-success/90 text-white text-xs font-bold shadow"
                      >
                        Exacto ({formatPrice(amountToPayQuick)})
                      </Button>
                      {[20000, 50000, 100000].map((amount) => (
                        <Button
                          key={amount}
                          onClick={() => handleQuickPayment(amount)}
                          variant="outline"
                          className="h-10 text-xs border-[#2d3748] hover:border-primary"
                        >
                          {formatPrice(amount)}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Bill Selector */}
                  {paymentMode === "bills" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {COLOMBIAN_BILLS.filter(bill => bill.common).map((bill) => (
                          <div key={bill.value} className="flex flex-col items-center gap-2">
                            <Button
                              onClick={() => handleBillSelect(bill.value)}
                              variant="outline"
                              className={`w-full h-14 flex flex-col items-center justify-center p-2 border ${selectedBills[bill.value] > 0 ? 'border-primary bg-primary/10' : ''}`}
                            >
                              <span className="text-sm font-bold">{bill.label}</span>
                              <span className="text-xs text-muted-foreground font-mono">
                                ({selectedBills[bill.value] || 0})
                              </span>
                            </Button>
                            {selectedBills[bill.value] > 0 && (
                              <Button
                                onClick={() => handleBillRemove(bill.value)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-full p-0 text-destructive hover:bg-destructive/10 text-xs gap-1"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="bg-card rounded-lg p-4 border border-border shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-sm text-foreground">Total en billetes:</span>
                          <span className="text-xl font-extrabold text-success">
                            {formatPrice(calculateTotalFromBills())}
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={addCashPaymentFromBills}
                            disabled={calculateTotalFromBills() <= 0}
                            className="flex-1 gap-2 h-11 text-base shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Plus className="h-4 w-4" />
                            Agregar Pago
                          </Button>
                          <Button
                            onClick={() => setSelectedBills({})}
                            variant="outline"
                            className="gap-2 h-11 w-20 text-destructive hover:border-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Amount */}
                    {paymentMode === "manual" && (
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={currentInputAmount}
                            onChange={(e) => setCurrentInputAmount(e.target.value)}
                            placeholder="Monto en efectivo"
                            className="flex-1 text-lg h-11 pl-10 border-input focus:border-primary bg-input"
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-md text-muted-foreground font-bold">$</span>
                        </div>
                        <Button
                          onClick={handleManualAdd}
                          disabled={!currentInputAmount || Number(currentInputAmount) <= 0}
                          className="gap-2 px-6 h-11 text-base shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar
                        </Button>
                      </div>
                    )}

                </div>
              ) : (
                <div className="flex gap-2 p-2 border rounded-md bg-[#1d2440]/60 border-[#222c4a]">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      value={currentInputAmount}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={`Monto ${selectedMethod?.text}`}
                      className="h-8 text-xs pl-6 bg-[#1d2440] border-[#2d3748]"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">$</span>
                  </div>
                  <Button
                    onClick={handleManualAdd}
                    disabled={!currentInputAmount || parseFormattedNumber(currentInputAmount) <= 0}
                    className="h-8 text-xs bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Agregar
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Balance y Lista de Pagos */}
        <div className="md:col-span-3 flex flex-col gap-3">
          <Card className="p-4 shadow-lg border border-warning/40 bg-[#1e2538] text-warning-foreground rounded-2xl">
            <h3 className="font-bold text-base flex items-center gap-2 text-warning mb-3">
              <span className="h-2 w-2 bg-warning rounded-full animate-pulse" />
              Balance y Cambio
            </h3>

            <div className="space-y-2 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="text-warning-foreground/70">Total Pagado</span>
                <span className="text-success font-extrabold">{formatPrice(totalPaid)}</span>
              </div>
              <Separator className="my-2 bg-warning/30" />
              <div className="flex justify-between items-center text-lg mt-1">
                <span className="font-bold">Faltante</span>
                <span className={`${remaining > 0 ? 'text-destructive' : 'text-success'} font-extrabold`}>
                  {formatPrice(Math.abs(remaining))}
                </span>
              </div>
              {change > 0 && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-warning/40">
                  <span className="text-info">Cambio</span>
                  <span className="font-bold text-info">{formatPrice(change)}</span>
                </div>
              )}
            </div>
          </Card>

          {payments.length > 0 && (
            <Card className="p-4 border border-[#2a3459] bg-[#151b29] rounded-2xl">
              <h4 className="font-bold text-sm text-primary/80 mb-2">Pagos Registrados</h4>
              <div className="space-y-1 text-xs">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-1 border-b border-[#222c4a]/40">
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(p.metodo.nombre)}
                      <span>{p.metodo.text}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-success">{formatPrice(p.valor)}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removePayment(p.id)}
                        className="h-6 w-6 text-destructive hover:bg-destructive/30"
                      >
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

      {/* FOOTER */}
      <div className="p-3 border-t border-[#1b2641] bg-[#1a2035] shrink-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 gap-2 h-11 text-sm sm:text-base border-2 border-border text-foreground hover:bg-secondary"
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Cancelar Venta
          </Button>
          <Button
            onClick={handleCompletePayment}
            disabled={remaining > 0 || payments.length === 0 || submitting}
            className={`flex-1 gap-2 sm:gap-3 h-11 text-sm sm:text-lg font-bold shadow-lg transition-all
              ${remaining > 0
                ? 'bg-warning text-warning-foreground hover:bg-warning/90'
                : 'bg-success text-success-foreground hover:bg-success/90'}`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                {remaining > 0 ? `PAGAR ${formatPrice(remaining)} Faltante` : "Completar Venta"}
              </>
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

}