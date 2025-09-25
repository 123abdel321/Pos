"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import type { OrderItem } from "@/app/page"

interface ProductEditModalProps {
  product: OrderItem
  isOpen: boolean
  onClose: () => void
  onSave: (updatedProduct: OrderItem) => void
}

export function ProductEditModal({ product, isOpen, onClose, onSave }: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    cantidad: product.cantidad,
    costo: product.costo,
    descuento_porcentaje: product.descuento_porcentaje,
    descuento_valor: product.descuento_valor,
    concepto: product.concepto,
  })

  const [calculatedValues, setCalculatedValues] = useState({
    subtotal: 0,
    iva_valor: 0,
    total: 0,
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        cantidad: product.cantidad,
        costo: product.costo,
        descuento_porcentaje: product.descuento_porcentaje,
        descuento_valor: product.descuento_valor,
        concepto: product.concepto,
      })
    }
  }, [isOpen, product])

  useEffect(() => {
    // Recalcular valores cuando cambian los datos del formulario
    const subtotal = formData.cantidad * formData.costo
    const descuentoTotal = (subtotal * formData.descuento_porcentaje) / 100 + formData.descuento_valor
    const subtotalConDescuento = subtotal - descuentoTotal
    const iva_valor = subtotalConDescuento * (product.iva_porcentaje / 100)
    const total = subtotalConDescuento + iva_valor

    setCalculatedValues({
      subtotal: subtotalConDescuento,
      iva_valor,
      total,
    })
  }, [formData, product.iva_porcentaje])

  const handleInputChange = (field: string, value: string | number) => {
    if (field === "concepto") {
      setFormData((prev) => ({
        ...prev,
        [field]: value as string,
      }))
    } else if (field === "descuento_porcentaje") {
      const porcentaje = typeof value === "string" ? Number.parseFloat(value) || 0 : value
      const subtotal = formData.cantidad * formData.costo
      const valorDescuento = (subtotal * porcentaje) / 100

      setFormData((prev) => ({
        ...prev,
        descuento_porcentaje: porcentaje,
        descuento_valor: valorDescuento,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: typeof value === "string" ? Number.parseFloat(value) || 0 : value,
      }))
    }
  }

  const handleSave = () => {
    const updatedProduct: OrderItem = {
      ...product,
      cantidad: formData.cantidad,
      costo: formData.costo,
      descuento_porcentaje: formData.descuento_porcentaje,
      descuento_valor: formData.descuento_valor,
      concepto: formData.concepto,
      subtotal: calculatedValues.subtotal,
      iva_valor: calculatedValues.iva_valor,
      total: calculatedValues.total,
    }
    onSave(updatedProduct)
    onClose()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
    }).format(price)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative ml-auto w-96 h-full bg-background border-l border-border shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {product.consecutivo.toString().padStart(2, "0")} - {product.nombre}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div>
              <Label htmlFor="cantidad" className="text-sm font-medium">
                Cantidad
              </Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                value={formData.cantidad}
                onChange={(e) => handleInputChange("cantidad", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="precio" className="text-sm font-medium">
                Precio
              </Label>
              <Input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                value={formData.costo}
                onChange={(e) => handleInputChange("costo", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="descuento-porcentaje" className="text-sm font-medium">
                % Dscto
              </Label>
              <Input
                id="descuento-porcentaje"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.descuento_porcentaje}
                onChange={(e) => handleInputChange("descuento_porcentaje", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="descuento-valor" className="text-sm font-medium">
                Dscto
              </Label>
              <Input
                id="descuento-valor"
                type="number"
                min="0"
                step="0.01"
                value={formData.descuento_valor}
                onChange={(e) => handleInputChange("descuento_valor", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Iva</Label>
              <div className="mt-1 flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">{product.iva_porcentaje}%</span>
                <span className="text-sm font-semibold">{formatPrice(calculatedValues.iva_valor)}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="observacion" className="text-sm font-medium">
                Observación
              </Label>
              <Textarea
                id="observacion"
                value={formData.concepto}
                onChange={(e) => handleInputChange("concepto", e.target.value)}
                className="mt-1 min-h-[80px]"
                placeholder="Agregar observaciones..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="mb-4 text-center">
              <div className="text-2xl font-bold text-foreground">Total: {formatPrice(calculatedValues.total)}</div>
            </div>
            <Button onClick={handleSave} className="w-full bg-teal-500 hover:bg-teal-600 text-white">
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
