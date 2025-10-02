"use client"

import { useState, useEffect } from "react"
import { LocationSelector } from "@/components/location-selector"
import { Ubicacion } from '@/types/ubicacion';
import { ProductGrid } from "@/components/product-grid"
import { OrderPanel } from "@/components/order-panel"
import { OrdersManager } from "@/components/orders-manager"
import { PaymentModal } from "@/components/payment-modal"
import { OrdersTableView } from "@/components/orders-table-view"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { 
	Users, 
	Settings, 
	Sun, 
	Moon, 
	Table, 
	LogOut, 
	Menu,
	User,
	Bell,
	HelpCircle,
	CreditCard
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/sistem/ProtectedRoute"
import LoginPage from "@/app/login/page"
import apiClient from "@/app/api/apiClient" // ← AGREGAR ESTE IMPORT
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
	id_backend: number | null
	id_ubicacion: number | null
	ubicacion_nombre: string
	productos: OrderItem[]
	subtotal: number
	iva: number
	total: number
	fecha: string
	estado: "pendiente" | "completado"
}

export interface Cliente {
	id: number
	id_tipo_documento: number
	id_ciudad: number | null
	primer_nombre: string
	segundo_nombre: string | null
	primer_apellido: string
	segundo_apellido: string | null
	email: string
	sumar_aiu: number | null
	porcentaje_aiu: number | null
	porcentaje_reteica: number | null
	apartamentos: string
	id_responsabilidades: number | null
	telefono: string | null
	text: string
	nombre_completo: string
}

export interface Bodega {
	id: number
	codigo: string
	nombre: string
	ubicacion: string
	id_centro_costos: number
	id_responsable: number | null
	id_cuenta_cartera: number
	consecutivo: number
	consecutivo_parqueadero: number
	created_by: number | null
	updated_by: number | null
	created_at: string | null
	updated_at: string
	text: string
}

function POSContent() {
	const [selectedLocation, setSelectedLocation] = useState<Ubicacion | null>(null);
	const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
	const [orders, setOrders] = useState<Order[]>([])
	const [showOrdersManager, setShowOrdersManager] = useState(false)
	const [showPaymentModal, setShowPaymentModal] = useState(false)
	const [showOrdersTable, setShowOrdersTable] = useState(false)
	const [ordersColumnExpanded, setOrdersColumnExpanded] = useState(false)
	const { theme, setTheme } = useTheme()
	const { user, logout, isAuthenticated, loading } = useAuth()
	const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
	const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null)

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const clienteGuardado = localStorage.getItem('clientePorDefecto');
			if (clienteGuardado) {
				try {
					const cliente = JSON.parse(clienteGuardado);
					setSelectedCliente(cliente);
					console.log('📥 Cliente por defecto cargado desde localStorage:', cliente.nombre_completo);
					
				} catch (error) {
					console.error('❌ Error cargando cliente desde localStorage:', error);
				}
			}
		}
	}, [currentOrder, selectedBodega]);

	// 🔥 NUEVO EFFECT PARA CARGAR ÓRDENES DEL BACKEND
	useEffect(() => {
		const loadOrders = async () => {
			try {
				// Cargar solo las órdenes pendientes/activas (puedes ajustar los parámetros si el backend lo permite)
				const response = await apiClient.get('/pos/pedidos'); 
				
				const backendOrders = response.data.data || [];
				
				const newOrders = backendOrders.map(mapBackendOrderToFrontend);
				
				// Reemplazar las órdenes locales (que antes se perdían) con las del backend
				setOrders(newOrders);
				console.log(`📥 Pedidos cargados desde backend: ${newOrders.length}`);

				// Si no hay currentOrder, seleccionar el primero de los pendientes, o crear uno nuevo
				if (!currentOrder && newOrders.length > 0) {
					setCurrentOrder(newOrders[0]);
				} else if (!currentOrder) {
					// Opcional: crea una nueva orden automáticamente si no hay ninguna
					// createNewOrder();
				}

			} catch (error) {
				console.error('❌ Error cargando pedidos desde el backend:', error);
			}
		};

		loadOrders();
	}, []);

	// Si no está autenticado, mostrar página de login
	if (!isAuthenticated && !loading) {
		return <LoginPage />
	}

	// Mostrar loading mientras verifica autenticación
	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-foreground">Verificando autenticación...</p>
				</div>
			</div>
		)
	}

	const mapBackendOrderToFrontend = (backendOrder: any): Order => {
		const frontendItems: OrderItem[] = (backendOrder.detalles || []).map((detalle: any, index: number): OrderItem => ({
			consecutivo: index + 1,
			id_producto: detalle.id_producto,
			nombre: detalle.descripcion,
			cantidad: Number.parseFloat(detalle.cantidad),
			costo: Number.parseFloat(detalle.costo),
			subtotal: Number.parseFloat(detalle.subtotal),
			descuento_porcentaje: Number.parseFloat(detalle.descuento_porcentaje),
			descuento_valor: Number.parseFloat(detalle.descuento_valor),
			iva_porcentaje: Number.parseFloat(detalle.iva_porcentaje),
			iva_valor: Number.parseFloat(detalle.iva_valor),
			total: Number.parseFloat(detalle.total),
			concepto: "",
		}));

		// Sumar IVAs de los detalles para obtener el total_iva de la cabecera
		const totalIva = frontendItems.reduce((sum, item) => sum + item.iva_valor, 0);

		return {
			// ID temporal único basado en el ID real del backend
			id: `order-${backendOrder.id}`, 
			id_backend: backendOrder.id, // ID real del backend
			id_ubicacion: backendOrder.id_ubicacion,
			// Usar el nombre del cliente o un valor por defecto si no está
			ubicacion_nombre: backendOrder.cliente?.nombre_completo.trim() || "Pedido Web", 
			productos: frontendItems,
			subtotal: Number.parseFloat(backendOrder.subtotal),
			iva: totalIva,
			total: Number.parseFloat(backendOrder.total_factura),
			fecha: backendOrder.created_at,
			// Mapear estado: 1 (pendiente/activo) -> "pendiente", otro -> "completado"
			estado: backendOrder.estado === 1 ? "pendiente" : "completado",
		};
	};

	const createNewOrder = async (locationId?: number, locationName?: string) => {
		// 🔥 CARGAR CLIENTE POR DEFECTO SIEMPRE AL CREAR NUEVO PEDIDO
		let clienteDefault = selectedCliente;
		
		if (!clienteDefault && typeof window !== 'undefined') {
			const clienteGuardado = localStorage.getItem('clientePorDefecto');
			if (clienteGuardado) {
				try {
					clienteDefault = JSON.parse(clienteGuardado);
					setSelectedCliente(clienteDefault);
					console.log('📥 Cliente por defecto cargado en nuevo pedido:', clienteDefault?.nombre_completo);
				} catch (error) {
					console.error('❌ Error cargando cliente por defecto:', error);
				}
			}
		}

		const newOrder: Order = {
			id: `order-${Date.now()}`,
			id_backend: null,
			id_ubicacion: locationId || null,
			ubicacion_nombre: locationName || "Mostrador",
			productos: [],
			subtotal: 0,
			iva: 0,
			total: 0,
			fecha: new Date().toISOString(),
			estado: "pendiente",
		}

		setOrders((prev) => {
			const existing = prev.filter(o => o.id_backend !== null);
			return [...existing, newOrder]; // Mantener solo las que tienen ID de backend y el nuevo
		});
		setCurrentOrder(newOrder);
		
		// ✅ GUARDAR EL NUEVO PEDIDO CON EL CLIENTE POR DEFECTO
		try {
			const savedOrder = await saveOrderToBackend(newOrder, clienteDefault, selectedBodega)
			
			if (savedOrder?.id_backend) {
				const orderWithBackendId = { ...newOrder, id_backend: savedOrder.id_backend }
				setCurrentOrder(orderWithBackendId)
				setOrders((prev) => prev.map((o) => (o.id === newOrder.id ? orderWithBackendId : o)))
			}
		} catch (error) {
			console.error('Error creando nuevo pedido:', error)
		}
	}

	const addProductToOrder = async (product: Product, quantity = 1) => {
		if (!currentOrder) {
			await createNewOrder(selectedLocation?.id, selectedLocation?.nombre)
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

		// ✅ GUARDAR AUTOMÁTICAMENTE EN EL BACKEND
		try {
			await saveOrderToBackend(updatedOrder, selectedCliente, selectedBodega)
			console.log('✅ Producto agregado y pedido guardado')
		} catch (error) {
			console.error('❌ Error guardando pedido automáticamente:', error)
		}
	}

	// Función para actualizar la bodega:
	const handleUpdateBodega = async (bodega: Bodega | null) => {
		setSelectedBodega(bodega)

		// ✅ GUARDAR AUTOMÁTICAMENTE cuando se cambia la bodega
		if (currentOrder) {
			try {
				await saveOrderToBackend(currentOrder, selectedCliente, bodega) // ← Agregar bodega
			} catch (error) {
			console.error('Error guardando pedido al cambiar bodega:', error)
			}
		}
	}

	// Función para actualizar el cliente:
	const handleUpdateCliente = async (cliente: Cliente | null) => {
		setSelectedCliente(cliente)
		
		// ✅ GUARDAR AUTOMÁTICAMENTE cuando se cambia el cliente
		if (currentOrder) {
			try {
				await saveOrderToBackend(currentOrder, cliente, selectedBodega)
			} catch (error) {
				console.error('Error guardando pedido al cambiar cliente:', error)
			}
		}
	}

	// Función para guardar el pedido en el backend:
	const saveOrderToBackend = async (order: Order, cliente: Cliente | null, bodega: Bodega | null) => {
		try {
			const payload = {
				productos: order.productos,
				id_ubicacion: order.id_ubicacion,
				id_bodega: bodega?.id?.toString() || "1", // 🔥 Usar la bodega seleccionada
				consecutivo: order.id.replace('order-', ''),
				id_cliente: cliente?.id?.toString() || "1",
				fecha_manual: new Date().toISOString().split('T')[0],
				id_resolucion: "1",
				id_vendedor: null,
				id_pedido: order.id_backend ? order.id_backend.toString() : null,
				observacion: `Pedido desde POS - ${order.ubicacion_nombre}`
			}

			const response = await apiClient.post('/pos/pedido', payload)
			console.log('✅ Pedido guardado:', response.data)

			const backendId = response.data.data?.id 
			return { ...order, id_backend: backendId || order.id_backend }
			
		} catch (error: any) {
			console.error('❌ Error guardando pedido:', error)
			// Aquí podrías mostrar una notificación al usuario
			// o implementar un sistema de reintentos
			throw error
		}
	}

	// Modifica la función processPayment para guardar el pedido:
	const processPayment = async (paymentData: any) => {
		if (currentOrder) {
			try {
				// Guardar el pedido en el backend antes de procesar el pago
				await saveOrderToBackend(currentOrder, selectedCliente, selectedBodega)
				
				const completedOrder = { ...currentOrder, estado: "completado" as const }
				setOrders((prev) => prev.map((order) => (order.id === completedOrder.id ? completedOrder : order)))
				setCurrentOrder(null)
				setSelectedCliente(null)
				setShowPaymentModal(false)
			} catch (error) {
				console.error('Error procesando pedido:', error)
				// Aquí podrías mostrar un mensaje de error al usuario
			}
		}
	}

	const updateProductQuantity = async (productId: number, newQuantity: number) => {
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

		// ✅ GUARDAR AUTOMÁTICAMENTE
		try {
			await saveOrderToBackend(updatedOrder, selectedCliente, selectedBodega)
		} catch (error) {
			console.error('Error guardando pedido automáticamente:', error)
		}
	}

	const removeProductFromOrder = async (productId: number) => {
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

		// ✅ GUARDAR AUTOMÁTICAMENTE
		try {
			await saveOrderToBackend(updatedOrder, selectedCliente, selectedBodega)
		} catch (error) {
			console.error('Error guardando pedido automáticamente:', error)
		}
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

	const updateProductInOrder = async (updatedProduct: OrderItem) => {
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

		updatedOrder.subtotal = updatedOrder.productos.reduce((sum, item) => sum + item.subtotal, 0)
		updatedOrder.iva = updatedOrder.productos.reduce((sum, item) => sum + item.iva_valor, 0)
		updatedOrder.total = updatedOrder.subtotal + updatedOrder.iva

		setCurrentOrder(updatedOrder)
		setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))

		// ✅ GUARDAR AUTOMÁTICAMENTE
		try {
			await saveOrderToBackend(updatedOrder, selectedCliente, selectedBodega)
		} catch (error) {
			console.error('Error guardando pedido automáticamente:', error)
		}
	}

	const handleLogout = () => {
		logout()
		// Redirigir a login
		window.location.href = '/'
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border bg-card">
				<div className="flex items-center justify-between px-6 py-4">
				{/* Lado izquierdo */}
				<div className="flex items-center gap-4">
					<h1 className="text-2xl font-bold text-foreground">Sistema POS</h1>
					<div className="text-sm text-muted-foreground">
					{selectedLocation ? `Ubicación: ${selectedLocation.nombre}` : "Seleccionar ubicación"}
					</div>
				</div>

				{/* Lado derecho - Menú compacto */}
				<div className="flex items-center gap-2">
					{/* Botón de tema */}
					<Button
						variant="outline"
						size="sm"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						className="gap-2 hidden sm:flex"
						title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
					>
						{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
					</Button>

					{/* Contador de pedidos */}
					<Button 
						variant="outline" 
						size="sm"
						onClick={() => setShowOrdersManager(true)}
						className="gap-2"
						title="Ver pedidos pendientes"
					>
					<Users className="h-4 w-4" />
						<span className="hidden sm:inline">
							({orders.filter((o) => o.estado === "pendiente").length})
						</span>
					</Button>

					{/* Menú desplegable principal */}
					<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="gap-2">
						<Menu className="h-4 w-4" />
						<span className="hidden sm:inline">Menú</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						{/* Información del usuario */}
						<DropdownMenuLabel className="flex flex-col">
						<div className="flex items-center gap-2">
							<User className="h-4 w-4" />
							<span>{user?.username || 'Usuario'}</span>
						</div>
						<span className="text-xs text-muted-foreground font-normal">
							{user?.email || 'usuario@ejemplo.com'}
						</span>
						</DropdownMenuLabel>
						
						<DropdownMenuSeparator />

						{/* Opciones de gestión */}
						<DropdownMenuItem onClick={() => setShowOrdersTable(true)}>
						<Table className="h-4 w-4 mr-2" />
						Gestión de Pedidos
						</DropdownMenuItem>

						<DropdownMenuItem onClick={() => setShowOrdersManager(true)}>
						<Users className="h-4 w-4 mr-2" />
						Pedidos Pendientes
						<span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
							{orders.filter((o) => o.estado === "pendiente").length}
						</span>
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						{/* Configuración y temas */}
						<DropdownMenuLabel className="text-xs">Preferencias</DropdownMenuLabel>
						
						<DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
						{theme === "dark" ? (
							<Sun className="h-4 w-4 mr-2" />
						) : (
							<Moon className="h-4 w-4 mr-2" />
						)}
						{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
						</DropdownMenuItem>

						<DropdownMenuItem>
						<Settings className="h-4 w-4 mr-2" />
						Configuración
						</DropdownMenuItem>

						<DropdownMenuItem>
						<CreditCard className="h-4 w-4 mr-2" />
						Métodos de Pago
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						{/* Ayuda y soporte */}
						<DropdownMenuItem>
						<HelpCircle className="h-4 w-4 mr-2" />
						Ayuda y Soporte
						</DropdownMenuItem>

						<DropdownMenuItem>
						<Bell className="h-4 w-4 mr-2" />
						Notificaciones
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						{/* Cerrar sesión */}
						<DropdownMenuItem 
						onClick={handleLogout}
						className="text-destructive focus:text-destructive"
						>
						<LogOut className="h-4 w-4 mr-2" />
						Cerrar Sesión
						</DropdownMenuItem>
					</DropdownMenuContent>
					</DropdownMenu>
				</div>
				</div>
			</header>

			{/* El resto de tu contenido permanece igual */}
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
								onLocationSelect={setSelectedLocation}
								selectedLocation={selectedLocation}
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
							onUpdateProduct={updateProductInOrder}
							onUpdateCliente={handleUpdateCliente}
							onUpdateBodega={handleUpdateBodega}
							onCancelOrder={cancelCurrentOrder}
							selectedCliente={selectedCliente}
  							selectedBodega={selectedBodega}
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

export default function POSPage() {
	return (
		<ProtectedRoute>
			<POSContent />
		</ProtectedRoute>
	)
}