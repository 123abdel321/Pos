"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { X, CreditCard, DollarSign, Smartphone, Building2, Plus, Trash2 } from "lucide-react"
import type { Order } from "@/app/page"

interface PaymentMethod {
  id: number
  nombre: string
  text: string
}

interface PaymentEntry {
  id: number
  valor: number
  metodo: PaymentMethod
}

interface PaymentModalProps {
  order: Order
  onPayment: (paymentData: any) => void
  onClose: () => void
}

export function PaymentModal({ order, onPayment, onClose }: PaymentModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("629")
  const [selectedResolution, setSelectedResolution] = useState("1")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock payment methods based on API structure
    const mockPaymentMethods: PaymentMethod[] = [
      { id: 1, nombre: "EFECTIVO", text: "EFECTIVO" },
      { id: 2, nombre: "TRANSFERENCIA", text: "TRANSFERENCIA" },
      { id: 3, nombre: "CXC CLIENTES", text: "CXC CLIENTES" },
      { id: 4, nombre: "ANTICIPO PROPIETARIOS", text: "ANTICIPO PROPIETARIOS" },
      { id: 5, nombre: "PAGOS BANCOLOMBIA", text: "PAGOS BANCOLOMBIA" },
    ]

    setPaymentMethods(mockPaymentMethods)
    setSelectedMethod(mockPaymentMethods[0])
    setLoading(false)
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const totalPaid = payments.reduce((sum, payment) => sum + payment.valor, 0)
  const remaining = order.total - totalPaid

  const addPayment = () => {
    if (!selectedMethod || !paymentAmount || Number.parseFloat(paymentAmount) <= 0) return

    const amount = Number.parseFloat(paymentAmount)
    const newPayment: PaymentEntry = {
      id: Date.now(),
      valor: amount,
      metodo: selectedMethod,
    }

    setPayments((prev) => [...prev, newPayment])
    setPaymentAmount("")
  }

  const removePayment = (id: number) => {
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }

  const handleCompletePayment = () => {
    if (remaining > 0) return

    const paymentData = {
      pagos: payments.map((p) => ({
        id: p.metodo.id,
        valor: p.valor,
      })),
      productos: order.productos,
      id_ubicacion: order.id_ubicacion,
      id_bodega: "1",
      consecutivo_bodegas: "2",
      id_cliente: "2",
      fecha_manual: new Date().toISOString().split("T")[0],
      id_resolucion: selectedResolution,
      id_vendedor: null,
      id_pedido: Number.parseInt(order.id.replace("order-", "")),
      consecutivo: invoiceNumber,
      observacion: `Venta ${order.ubicacion_nombre}`,
    }

    onPayment(paymentData)
  }

  const getPaymentIcon = (methodName: string) => {
    switch (methodName.toLowerCase()) {
      case "efectivo":
        return <DollarSign className="h-4 w-4" />
      case "transferencia":
        return <Smartphone className="h-4 w-4" />
      case "pagos bancolombia":
        return <Building2 className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Procesar Pago</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Resumen del Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Ubicación:</span>
                <span>{order.ubicacion_nombre}</span>
              </div>
              <div className="flex justify-between">
                <span>Productos:</span>
                <span>{order.productos.length} items</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (19%):</span>
                <span>{formatPrice(order.iva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Invoice Details */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Detalles de Facturación</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="resolution">Resolución</Label>
                <Select value={selectedResolution} onValueChange={setSelectedResolution}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">F-POS - FACTURACION POS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="invoice">No. Factura</Label>
                <Input id="invoice" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Payment Methods */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Agregar Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Método de Pago</Label>
                <Select
                  value={selectedMethod?.id.toString()}
                  onValueChange={(value) => {
                    const method = paymentMethods.find((m) => m.id.toString() === value)
                    setSelectedMethod(method || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id.toString()}>
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(method.nombre)}
                          {method.text}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monto</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addPayment} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setPaymentAmount(remaining.toString())}>
                Restante ({formatPrice(remaining)})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPaymentAmount(order.total.toString())}>
                Total ({formatPrice(order.total)})
              </Button>
            </div>
          </Card>

          {/* Payment Breakdown */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Desglose de Pagos</h3>

            {payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No se han agregado pagos</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {getPaymentIcon(payment.metodo.nombre)}
                      <span className="font-medium">{payment.metodo.text}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatPrice(payment.valor)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePayment(payment.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Pagado:</span>
                <span>{formatPrice(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Faltante:</span>
                <span className={remaining > 0 ? "text-destructive" : "text-success"}>{formatPrice(remaining)}</span>
              </div>
              {remaining < 0 && (
                <div className="flex justify-between text-sm">
                  <span>Cambio:</span>
                  <span className="text-success">{formatPrice(Math.abs(remaining))}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleCompletePayment} disabled={remaining > 0} className="flex-1 gap-2">
              <CreditCard className="h-4 w-4" />
              {remaining > 0 ? `Falta ${formatPrice(remaining)}` : "Completar Venta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
