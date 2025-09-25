"use client"

import { useState } from "react"
import { LocationSelector } from "@/components/location-selector"
import { ProductGrid } from "@/components/product-grid"
import { OrderPanel } from "@/components/order-panel"
import { OrdersManager } from "@/components/orders-manager"
import { PaymentModal } from "@/components/payment-modal"
import { OrdersTableView } from "@/components/orders-table-view"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { Users, Settings, Sun, Moon, Table } from "lucide-react"

export interface Product {
	id: number
	codigo: string
	nombre: string
	precio: string
	inventarios: Array<{ cantidad: string }>
	familia: { nombre: string }
}

export interface OrderItem {
	consecutivo: number
	id_producto: number
	nombre: string
	cantidad: number
	costo: number
	subtotal: number
	descuento_porcentaje: number
	descuento_valor: number
	iva_porcentaje: number
	iva_valor: number
	total: number
	concepto: string
}

export interface Order {
	id: string
	id_ubicacion: number | null
	ubicacion_nombre: string
	productos: OrderItem[]
	subtotal: number
	iva: number
	total: number
	fecha: string
	estado: "pendiente" | "completado"
}

export default function POSPage() {
	const [selectedLocation, setSelectedLocation] = useState<any>(null)
	const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
	const [orders, setOrders] = useState<Order[]>([])
	const [showOrdersManager, setShowOrdersManager] = useState(false)
	const [showPaymentModal, setShowPaymentModal] = useState(false)
	const [showOrdersTable, setShowOrdersTable] = useState(false)
	const [ordersColumnExpanded, setOrdersColumnExpanded] = useState(false)
	const { theme, setTheme } = useTheme()

	const createNewOrder = (locationId?: number, locationName?: string) => {
		const newOrder: Order = {
			id: `order-${Date.now()}`,
			id_ubicacion: locationId || null,
			ubicacion_nombre: locationName || "Mostrador",
			productos: [],
			subtotal: 0,
			iva: 0,
			total: 0,
			fecha: new Date().toISOString(),
			estado: "pendiente",
		}
		setCurrentOrder(newOrder)
		setOrders((prev) => [...prev, newOrder])
	}

	const addProductToOrder = (product: Product, quantity = 1) => {
		if (!currentOrder) {
			createNewOrder(selectedLocation?.id, selectedLocation?.nombre)
			return
		}

		const existingProductIndex = currentOrder.productos.findIndex((item) => item.id_producto === product.id)

		let updatedOrder: Order

		if (existingProductIndex >= 0) {
			const updatedProducts = [...currentOrder.productos]
			updatedProducts[existingProductIndex].cantidad += quantity
			updatedProducts[existingProductIndex].subtotal =
				updatedProducts[existingProductIndex].costo * updatedProducts[existingProductIndex].cantidad
			updatedProducts[existingProductIndex].iva_valor =
				updatedProducts[existingProductIndex].subtotal * (updatedProducts[existingProductIndex].iva_porcentaje / 100)
			updatedProducts[existingProductIndex].total =
				updatedProducts[existingProductIndex].subtotal + updatedProducts[existingProductIndex].iva_valor

			updatedOrder = {
				...currentOrder,
				productos: updatedProducts,
			}
		} else {
			const precio = Number.parseFloat(product.precio)
			const subtotal = precio * quantity
			const iva_porcentaje = 19
			const iva_valor = subtotal * (iva_porcentaje / 100)
			const total = subtotal + iva_valor

			const orderItem: OrderItem = {
				consecutivo: currentOrder.productos.length + 1,
				id_producto: product.id,
				nombre: `${product.codigo} - ${product.nombre}`,
				cantidad: quantity,
				costo: precio,
				subtotal: subtotal,
				descuento_porcentaje: 0,
				descuento_valor: 0,
				iva_porcentaje: iva_porcentaje,
				iva_valor: iva_valor,
				total: total,
				concepto: "",
			}

			updatedOrder = {
				...currentOrder,
				productos: [...currentOrder.productos, orderItem],
			}
		}

		updatedOrder.subtotal = updatedOrder.productos.reduce((sum, item) => sum + item.subtotal, 0)
		updatedOrder.iva = updatedOrder.productos.reduce((sum, item) => sum + item.iva_valor, 0)
		updatedOrder.total = updatedOrder.subtotal + updatedOrder.iva

		setCurrentOrder(updatedOrder)
		setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
	}

	const updateProductQuantity = (productId: number, newQuantity: number) => {
		if (!currentOrder) return

		if (newQuantity <= 0) {
			removeProductFromOrder(productId)
			return
		}

		const updatedProducts = currentOrder.productos.map((item) => {
			if (item.id_producto === productId) {
				const updatedItem = { ...item }
				updatedItem.cantidad = newQuantity
				updatedItem.subtotal = updatedItem.costo * newQuantity
				updatedItem.iva_valor = updatedItem.subtotal * (updatedItem.iva_porcentaje / 100)
				updatedItem.total = updatedItem.subtotal + updatedItem.iva_valor
				return updatedItem
			}
			return item
		})

		const updatedOrder = {
			...currentOrder,
			productos: updatedProducts,
		}

		updatedOrder.subtotal = updatedOrder.productos.reduce((sum, item) => sum + item.subtotal, 0)
		updatedOrder.iva = updatedOrder.productos.reduce((sum, item) => sum + item.iva_valor, 0)
		updatedOrder.total = updatedOrder.subtotal + updatedOrder.iva

		setCurrentOrder(updatedOrder)
		setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
	}

	const removeProductFromOrder = (productId: number) => {
		if (!currentOrder) return

		const updatedProducts = currentOrder.productos.filter((item) => item.id_producto !== productId)

		const updatedOrder = {
			...currentOrder,
			productos: updatedProducts,
		}

		updatedOrder.subtotal = updatedOrder.productos.reduce((sum, item) => sum + item.subtotal, 0)
		updatedOrder.iva = updatedOrder.productos.reduce((sum, item) => sum + item.iva_valor, 0)
		updatedOrder.total = updatedOrder.subtotal + updatedOrder.iva

		setCurrentOrder(updatedOrder)
		setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
	}

	const deleteOrder = (orderId: string) => {
		setOrders((prev) => prev.filter((order) => order.id !== orderId))
		if (currentOrder?.id === orderId) {
			setCurrentOrder(null)
		}
	}

	const cancelCurrentOrder = () => {
		if (currentOrder) {
			deleteOrder(currentOrder.id)
		}
	}

	const selectOrder = (order: Order) => {
		setCurrentOrder(order)
		setShowOrdersManager(false)
	}

	const completeOrder = () => {
		if (currentOrder) {
			setShowPaymentModal(true)
		}
	}

	const processPayment = (paymentData: any) => {
		if (currentOrder) {
			const completedOrder = { ...currentOrder, estado: "completado" as const }
			setOrders((prev) => prev.map((order) => (order.id === completedOrder.id ? completedOrder : order)))
			setCurrentOrder(null)
			setShowPaymentModal(false)
		}
	}

	const updateProductInOrder = (updatedProduct: OrderItem) => {
		if (!currentOrder) return

		const updatedProducts = currentOrder.productos.map((item) => {
			if (item.consecutivo === updatedProduct.consecutivo) {
				return updatedProduct
			}
			return item
		})

		const updatedOrder = {
			...currentOrder,
			productos: updatedProducts,
		}

		// Recalculate order totals
		updatedOrder.subtotal = updatedOrder.productos.reduce((sum, item) => sum + item.subtotal, 0)
		updatedOrder.iva = updatedOrder.productos.reduce((sum, item) => sum + item.iva_valor, 0)
		updatedOrder.total = updatedOrder.subtotal + updatedOrder.iva

		setCurrentOrder(updatedOrder)
		setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border bg-card">
				<div className="flex items-center justify-between px-6 py-4">
					<div className="flex items-center gap-4">
						<h1 className="text-2xl font-bold text-foreground">Sistema POS</h1>
						<div className="text-sm text-muted-foreground">
							{selectedLocation ? `Ubicación: ${selectedLocation.nombre}` : "Seleccionar ubicación"}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							className="gap-2"
						>
							{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
							{theme === "dark" ? "Claro" : "Oscuro"}
						</Button>
						<Button variant="outline" size="sm" onClick={() => setShowOrdersManager(true)} className="gap-2">
							<Users className="h-4 w-4" />
							Pedidos ({orders.filter((o) => o.estado === "pendiente").length})
						</Button>
						<Button variant="outline" size="sm" onClick={() => setShowOrdersTable(true)} className="gap-2">
							<Table className="h-4 w-4" />
							Gestión
						</Button>
						<Button variant="outline" size="sm" className="gap-2 bg-transparent">
							<Settings className="h-4 w-4" />
							Configuración
						</Button>
					</div>
				</div>
			</header>

			<div className="flex h-[calc(100vh-80px)]">
				<div
					className={`border-r border-border bg-card/50 transition-all duration-300 ${
						ordersColumnExpanded ? "w-80" : "w-16"
					}`}
				>
					<div className="p-2 border-b border-border flex items-center justify-between">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setOrdersColumnExpanded(!ordersColumnExpanded)}
							className="p-1 h-8 w-8"
						>
							{ordersColumnExpanded ? "←" : "→"}
						</Button>
						{ordersColumnExpanded && (
							<div className="flex-1 ml-2">
								<h3 className="font-semibold text-foreground text-sm">Pedidos</h3>
								<p className="text-xs text-muted-foreground">
									{orders.filter((o) => o.estado === "pendiente").length} pendientes
								</p>
							</div>
						)}
					</div>

					<div className="overflow-y-auto h-[calc(100%-60px)]">
						{orders.filter((o) => o.estado === "pendiente").length === 0 ? (
							<div className="p-2 text-center text-muted-foreground">
								{ordersColumnExpanded ? (
									<>
										<Users className="h-6 w-6 mx-auto mb-1 opacity-50" />
										<p className="text-xs">No hay pedidos</p>
									</>
								) : (
									<Users className="h-4 w-4 mx-auto opacity-50" />
								)}
							</div>
						) : (
							<div className="p-1 space-y-1">
								{orders
									.filter((o) => o.estado === "pendiente")
									.map((order) => (
										<div
											key={order.id}
											className={`p-2 rounded-md border cursor-pointer transition-all hover:bg-accent ${
												currentOrder?.id === order.id ? "bg-primary/10 border-primary" : "bg-card border-border"
											}`}
											onClick={() => selectOrder(order)}
											title={
												ordersColumnExpanded
													? undefined
													: `${order.ubicacion_nombre} - $${order.total.toLocaleString()}`
											}
										>
											{ordersColumnExpanded ? (
												<>
													<div className="flex items-center justify-between mb-1">
														<span className="font-medium text-xs truncate">{order.ubicacion_nombre}</span>
														<Button
															variant="ghost"
															size="sm"
															onClick={(e) => {
																e.stopPropagation()
																deleteOrder(order.id)
															}}
															className="h-4 w-4 p-0 text-destructive hover:text-destructive"
														>
															×
														</Button>
													</div>
													<div className="text-xs text-muted-foreground mb-1">{order.productos.length} items</div>
													<div className="text-xs font-semibold text-foreground">${order.total.toLocaleString()}</div>
												</>
											) : (
												<div className="flex flex-col items-center">
													<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mb-1">
														<span className="text-xs font-bold text-primary">{order.ubicacion_nombre.charAt(0)}</span>
													</div>
													<div className="text-xs font-semibold text-center">{order.productos.length}</div>
												</div>
											)}
										</div>
									))}
							</div>
						)}
					</div>
				</div>

				<div className="flex-1 flex flex-col lg:flex-row">

					<div className="flex-1 flex flex-col">
						<div className="p-4 border-b border-border">
							<LocationSelector
								selectedLocation={selectedLocation}
								onLocationSelect={setSelectedLocation}
								onNewOrder={createNewOrder}
							/>
						</div>

						<div className="flex-1 overflow-auto">
							<ProductGrid onProductSelect={addProductToOrder} />
						</div>
					</div>

					<div className="w-full lg:w-96 border-l border-border">
						<OrderPanel
							currentOrder={currentOrder}
							onCompleteOrder={completeOrder}
							onNewOrder={() => createNewOrder(selectedLocation?.id, selectedLocation?.nombre)}
							onUpdateQuantity={updateProductQuantity}
							onRemoveProduct={removeProductFromOrder}
							onCancelOrder={cancelCurrentOrder}
							onUpdateProduct={updateProductInOrder}
						/>
					</div>
				</div>
			</div>

			{showOrdersManager && (
				<OrdersManager
					orders={orders}
					onSelectOrder={selectOrder}
					onDeleteOrder={deleteOrder}
					onClose={() => setShowOrdersManager(false)}
				/>
			)}

			{showOrdersTable && (
				<OrdersTableView
					orders={orders}
					onSelectOrder={selectOrder}
					onDeleteOrder={deleteOrder}
					onClose={() => setShowOrdersTable(false)}
				/>
			)}

			{showPaymentModal && currentOrder && (
				<PaymentModal order={currentOrder} onPayment={processPayment} onClose={() => setShowPaymentModal(false)} />
			)}
		</div>
	)
}
