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
// Asegúrate de que tus tipos y tu cliente API estén correctamente importados
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
  const [error, setError] = useState<string | null>(null)
  
  // Estados para la entrada de valor
  const [currentInputAmount, setCurrentInputAmount] = useState<string>("")
  const [selectedBills, setSelectedBills] = useState<{ [key: number]: number }>({})
  const [paymentMode, setPaymentMode] = useState<"quick" | "bills" | "manual">("quick")

  // EFECTO: RESTAURADO PARA CARGAR DATOS DE LA API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Consumo RESTAURADO de los END-POINTS
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
  
  const totalPaid = useMemo(() => payments.reduce((sum, payment) => sum + payment.valor, 0), [payments])
  const remaining = useMemo(() => order.total - totalPaid, [order.total, totalPaid])
  const change = useMemo(() => Math.max(0, -remaining), [remaining])
  const amountToPayQuick = useMemo(() => remaining > 0 ? remaining : order.total, [remaining, order.total])

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


  // --- V. Gestión de Pagos (Acciones) ---
  
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

  const handleManualAdd = useCallback(() => {
    if (!selectedMethod || !currentInputAmount) return
    const amount = Number(currentInputAmount)
    if (amount > 0) {
        addPayment(amount, selectedMethod)
    }
  }, [selectedMethod, currentInputAmount, addPayment])

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

  const handleCompletePayment = () => {
    if (remaining > 0 || payments.length === 0) return
    const selectedResolutionData = resolutions.find(r => r.id.toString() === selectedResolution)
    if (!selectedResolutionData) {
      setError("No se ha seleccionado una resolución válida")
      return
    }
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
    onPayment(paymentData)
  }

  // --- VI. Renderizado del Componente ---

  return (
    <Dialog open={true} onOpenChange={onClose}>
      {/* Contenedor principal: usa flex-col para el layout fijo-scroll-fijo */}
      <DialogContent className="w-full h-full max-w-[98vw] lg:max-w-7xl max-h-[95vh] rounded-2xl flex flex-col p-0 shadow-2xl bg-card text-card-foreground">
        
        {/* Header - Compacto y Temático */}
        <DialogHeader className="p-4 border-b border-border bg-card/50 rounded-t-2xl">
          <DialogTitle className="flex items-center gap-3 text-2xl font-extrabold text-foreground">
            <CreditCard className="h-6 w-6 text-primary" />
            Procesar Pago
            <span className="text-base font-medium text-muted-foreground ml-4 hidden sm:inline">({order.ubicacion_nombre})</span>
          </DialogTitle>
        </DialogHeader>

        {/* Main Grid Layout - EL ÚNICO ELEMENTO SCROLLABLE (flex-1) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-y-auto">
          
          {/* Left Column: Summary and Invoice Details (Col 1) */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Invoice Details Card */}
            <Card className="p-4 shadow-md border border-border">
              <h3 className="font-bold text-lg mb-3 text-foreground">Detalles de Facturación</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="resolution" className="text-sm font-semibold mb-1 block text-muted-foreground">Resolución *</Label>
                  {loading ? (
                    // Placeholder de carga para Select
                    <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Select value={selectedResolution} onValueChange={setSelectedResolution}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Seleccionar resolución" />
                      </SelectTrigger>
                      <SelectContent>
                        {resolutions.map((resolution) => (
                          <SelectItem key={resolution.id} value={resolution.id.toString()}>
                            {resolution.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="invoice" className="text-sm font-semibold mb-1 block text-muted-foreground">No. Factura *</Label>
                  <Input
                    id="invoice"
                    value={getCurrentInvoiceNumber()}
                    readOnly
                    className="bg-muted font-mono text-sm h-9 text-primary font-bold border-dashed"
                  />
                </div>
              </div>
            </Card>

            {/* Order Summary Card */}
            <Card className="p-4 shadow-lg border border-border">
              <h3 className="font-bold text-lg mb-3 text-foreground">Resumen del Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold text-foreground">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (19%):</span>
                  <span className="font-semibold text-foreground">{formatPrice(order.iva)}</span>
                </div>
                <Separator className="my-2 bg-border" />
                <div className="flex justify-between font-extrabold text-xl pt-1 border-t border-dashed border-border">
                  <span className="text-foreground">Total:</span>
                  <span className="text-primary text-xl">{formatPrice(order.total)}</span>
                </div>
              </div>
            </Card>
            
            {/* Payment Status Card (Resaltada Temáticamente) */}
            <Card className="p-4 shadow-lg border-2 border-primary/20 bg-primary/5">
              <h3 className="font-bold text-lg mb-3 text-foreground">Estado de Pago</h3>
              <div className="space-y-2 text-base font-semibold">
                <div className="flex justify-between items-center text-md">
                  <span className="text-muted-foreground">Total Pagado:</span>
                  <span className="text-success font-extrabold">{formatPrice(totalPaid)}</span>
                </div>
                <Separator className="my-2 bg-border" />
                <div className="flex justify-between items-center text-lg">
                  <span className="text-foreground">Faltante:</span>
                  <span className={`font-extrabold ${remaining > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatPrice(Math.abs(remaining))}
                  </span>
                </div>
                {change > 0 && (
                  <div className="flex justify-between items-center text-lg pt-1 border-t border-dashed border-border">
                    <span className="text-info">Cambio:</span>
                    <span className="font-extrabold text-info">{formatPrice(change)}</span>
                  </div>
                )}
              </div>
            </Card>

          </div>

          {/* Right Column: Payment Methods and Transactions (Col 2-4) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Payment Method Selection Grid */}
            <Card className="p-4 shadow-md border border-border">
              <h3 className="font-bold text-lg mb-4 text-foreground border-b border-border pb-2">Método de Pago</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {loading ? (
                    // PLACEHOLDERS DE LOS MÉTODOS DE PAGO
                    [...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className="h-16 border rounded-md bg-muted animate-pulse"
                      ></div>
                    ))
                ) : (
                    paymentMethods.map((method) => (
                      <Button
                        key={method.id}
                        variant={selectedMethod?.id === method.id ? "default" : "outline"}
                        onClick={() => setSelectedMethod(method)}
                        className={`flex flex-col items-center justify-center gap-1 h-16 py-2 text-center text-xs font-bold transition-all ${selectedMethod?.id === method.id ? 'shadow-lg ring-2 ring-primary/50' : ''}`}
                      >
                        {getPaymentIcon(method.nombre)}
                        <span className="text-xs">{method.text}</span>
                      </Button>
                    ))
                )}
              </div>
            </Card>

            {/* Payment Interface (Conditional) */}
            {selectedMethod && (
              <Card className="p-4 shadow-lg bg-card/50 border border-border">
                <h4 className="font-bold text-xl mb-3 text-foreground flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Añadir Pago con: <span className="text-primary">{selectedMethod.text}</span>
                </h4>
                
                {selectedMethod.nombre.toLowerCase() === "efectivo" ? (
                  /* Cash Payment Interface */
                  <div className="space-y-4">
                    {/* Payment Mode Tabs (Compactos) */}
                    <div className="flex gap-2">
                      <Button variant={paymentMode === "quick" ? "default" : "secondary"} onClick={() => setPaymentMode("quick")} className="flex-1 gap-2 h-9 text-sm"><Calculator className="h-3 w-3" /> Rápido</Button>
                      <Button variant={paymentMode === "bills" ? "default" : "secondary"} onClick={() => setPaymentMode("bills")} className="flex-1 gap-2 h-9 text-sm"><Coins className="h-3 w-3" /> Billetes</Button>
                      <Button variant={paymentMode === "manual" ? "default" : "secondary"} onClick={() => setPaymentMode("manual")} className="flex-1 gap-2 h-9 text-sm"><DollarSign className="h-3 w-3" /> Manual</Button>
                    </div>

                    <Separator className="bg-border" />

                    {/* Quick Payment */}
                    {paymentMode === "quick" && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Button
                          onClick={() => handleQuickPayment(amountToPayQuick)}
                          disabled={remaining <= 0}
                          className="h-12 bg-success hover:bg-success/90 text-success-foreground font-extrabold text-sm shadow-md transition-all"
                        >
                          Exacto<br />({formatPrice(amountToPayQuick)})
                        </Button>
                        {[20000, 50000, 100000].map((amount) => (
                          <Button
                            key={amount}
                            onClick={() => handleQuickPayment(amount)}
                            variant="outline"
                            className="h-12 font-medium text-sm border-2 border-border hover:border-primary transition-colors"
                          >
                            {formatPrice(amount)}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Bill Selector */}
                    {paymentMode === "bills" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                          {COLOMBIAN_BILLS.filter(bill => bill.common).map((bill) => (
                            <div key={bill.value} className="flex flex-col items-center gap-1">
                              <Button
                                onClick={() => handleBillSelect(bill.value)}
                                variant="outline"
                                className={`w-full h-12 flex flex-col items-center justify-center p-1 border ${selectedBills[bill.value] > 0 ? 'border-primary bg-primary/10' : ''}`}
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
                                  className="h-5 w-full p-0 text-destructive hover:bg-destructive/10 text-xs gap-1"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="bg-card rounded-lg p-3 border border-border shadow-inner">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-sm text-foreground">Total en billetes:</span>
                            <span className="text-xl font-extrabold text-success">
                              {formatPrice(calculateTotalFromBills())}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={addCashPaymentFromBills}
                              disabled={calculateTotalFromBills() <= 0}
                              className="flex-1 gap-2 h-10 text-base shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Plus className="h-4 w-4" />
                              Agregar Pago
                            </Button>
                            <Button
                              onClick={() => setSelectedBills({})}
                              variant="outline"
                              className="gap-2 h-10 w-20 text-destructive hover:border-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manual Amount */}
                    {paymentMode === "manual" && (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={currentInputAmount}
                            onChange={(e) => setCurrentInputAmount(e.target.value)}
                            placeholder="Monto en efectivo"
                            className="flex-1 text-lg h-10 pl-10 border-input focus:border-primary bg-input"
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-md text-muted-foreground font-bold">$</span>
                        </div>
                        <Button
                          onClick={handleManualAdd}
                          disabled={!currentInputAmount || Number(currentInputAmount) <= 0}
                          className="gap-2 px-6 h-10 text-base shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar
                        </Button>
                      </div>
                    )}
                  </div>

                ) : (
                  /* Other Payment Methods (Manual Input) */
                  <div className="flex gap-2 p-3 border rounded-lg bg-secondary/50 border-border">
                    <div className="relative flex-1">
                        <Input
                          type="number"
                          value={currentInputAmount}
                          onChange={(e) => setCurrentInputAmount(e.target.value)}
                          placeholder={`Monto en ${selectedMethod?.text}`}
                          className="flex-1 text-lg h-10 pl-10 border-input focus:border-primary bg-input"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-md text-muted-foreground font-bold">$</span>
                    </div>
                    <Button
                      onClick={handleManualAdd}
                      disabled={!currentInputAmount || Number(currentInputAmount) <= 0}
                      className="gap-2 px-6 h-10 text-base shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Payment List (Pagos Registrados) */}
            {payments.length > 0 && (
              <Card className="p-4 shadow-md border border-border">
                <h4 className="font-bold text-lg mb-3 text-foreground">Pagos Registrados ({payments.length})</h4>
                <div className="border border-border rounded-lg shadow-inner overflow-hidden">
                  <div className="grid grid-cols-12 bg-muted p-3 border-b border-border">
                    <div className="col-span-6 font-semibold text-xs text-muted-foreground">Método / Detalle</div>
                    <div className="col-span-4 font-semibold text-xs text-right text-muted-foreground">Valor</div>
                    <div className="col-span-2 font-semibold text-xs text-center text-muted-foreground">Acción</div>
                  </div>
                  <div className="divide-y divide-border">
                    {payments.map((payment) => (
                      <div key={payment.id} className="grid grid-cols-12 p-3 items-center hover:bg-secondary/10 transition-colors">
                        <div className="col-span-6 flex items-start gap-2 flex-col sm:flex-row sm:items-center">
                          {getPaymentIcon(payment.metodo.nombre)}
                          <span className="font-semibold text-sm text-foreground">{payment.metodo.text}</span>
                          {payment.billetes && payment.billetes.length > 0 && (
                            <span className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-full hidden md:block">
                              💵 {payment.billetes.map(b => `${b.quantity}x${formatPrice(b.denomination)}`).join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="col-span-4 text-right font-extrabold text-base text-success">
                          {formatPrice(payment.valor)}
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePayment(payment.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/80 transition-colors rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-lg text-sm shadow-sm">
                ❌ **Error:** {error}
              </div>
            )}
            
          </div>
        </div>

        {/* Action Buttons - Footer Fijo y Temático */}
        <div className="p-4 border-t border-border bg-card/50 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] rounded-b-2xl">
          <div className="flex gap-3 max-w-7xl mx-auto">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 gap-2 h-12 text-base border-2 border-border text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Cancelar Venta
            </Button>
            <Button
              onClick={handleCompletePayment}
              disabled={remaining > 0 || payments.length === 0}
              className={`flex-1 gap-3 text-lg h-12 font-extrabold shadow-lg transition-all duration-300 
                ${remaining > 0 
                  ? 'bg-warning text-warning-foreground hover:bg-warning/90' 
                  : 'bg-success text-success-foreground hover:bg-success/90'}`}
            >
              <CreditCard className="h-6 w-6" />
              {remaining > 0 ? `PAGAR ${formatPrice(remaining)} Faltante` : "Completar Venta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}