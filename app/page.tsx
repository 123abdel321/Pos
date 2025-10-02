// app/page.tsx

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import apiClient from "@/app/api/apiClient" 
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 🔥 NUEVO COMPONENTE LATERAL IZQUIERDO
import { OrdersManagerPanel } from "@/components/OrdersManagerPanel" 


// --- INTERFACES (Definiciones para que el código compile) ---
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

// Interfaz para la respuesta del backend
export interface BackendPedido {
	id: number;
	consecutivo: string;
	subtotal: string;
	total_iva: string;
	total_factura: string;
	created_at: string;
	estado: number; 
	id_ubicacion: number | null;
	cliente: { nombre_completo: string };
	detalles: any[];
}


function POSContent() {
	const [selectedLocation, setSelectedLocation] = useState<Ubicacion | null>(null);
	const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
	const [orders, setOrders] = useState<Order[]>([])
	const [showOrdersTable, setShowOrdersTable] = useState(false) // Necesario para el menú
	const [showPaymentModal, setShowPaymentModal] = useState(false) 
	const { theme, setTheme } = useTheme()
	const { user, logout, isAuthenticated, loading } = useAuth()
	const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
	const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null)

	const handleLogout = () => {
		logout();
	};
	
	// Función helper para calcular los totales de la orden
	const calculateOrderTotals = (order: Order): Order => {
		const subtotal = order.productos.reduce((sum, item) => sum + item.subtotal, 0)
		const iva = order.productos.reduce((sum, item) => sum + item.iva_valor, 0)
		const total = subtotal + iva
		return { ...order, subtotal, iva, total }
	}

	// Función de mapeo envuelta en useCallback
	const mapBackendOrderToFrontend = useCallback((backendOrder: BackendPedido): Order => {
		const frontendItems: OrderItem[] = (backendOrder.detalles || []).map((detalle: any, index: number): OrderItem => {
			const subtotalNum = Number.parseFloat(detalle.subtotal || '0');
			const ivaValorNum = Number.parseFloat(detalle.iva_valor || '0');
			const totalNum = Number.parseFloat(detalle.total || '0');
			
			return {
				consecutivo: index + 1,
				id_producto: detalle.id_producto,
				nombre: detalle.descripcion,
				cantidad: Number.parseFloat(detalle.cantidad || '0'),
				costo: Number.parseFloat(detalle.costo || '0'),
				subtotal: subtotalNum,
				descuento_porcentaje: Number.parseFloat(detalle.descuento_porcentaje || '0'),
				descuento_valor: Number.parseFloat(detalle.descuento_valor || '0'),
				iva_porcentaje: Number.parseFloat(detalle.iva_porcentaje || '0'),
				iva_valor: ivaValorNum,
				total: totalNum,
				concepto: "",
			}
		});

		const totalIva = frontendItems.reduce((sum, item) => sum + item.iva_valor, 0);

		return {
			id: `order-${backendOrder.id}`, 
			id_backend: backendOrder.id, 
			id_ubicacion: backendOrder.id_ubicacion,
			ubicacion_nombre: backendOrder.cliente?.nombre_completo.trim() || "Pedido Mostrador", 
			productos: frontendItems,
			subtotal: Number.parseFloat(backendOrder.subtotal),
			iva: totalIva,
			total: Number.parseFloat(backendOrder.total_factura),
			fecha: backendOrder.created_at,
			estado: backendOrder.estado === 1 ? "pendiente" : "completado",
		};
	}, []);
	
	// Función para guardar en el backend (LA DEJAMOS IGUAL)
	const saveOrderToBackend = async (order: Order, cliente: Cliente | null, bodega: Bodega | null): Promise<Order> => {
		try {
			// Asumiendo que el cliente por defecto es siempre id=1 si no hay uno seleccionado
			const clienteId = cliente?.id?.toString() || "1"
			const bodegaId = bodega?.id?.toString() || "1"

			const payload = {
				productos: order.productos.map(p => ({
					...p,
					cantidad: p.cantidad.toString(),
					costo: p.costo.toString(),
					subtotal: p.subtotal.toString(),
					descuento_porcentaje: p.descuento_porcentaje.toString(),
					descuento_valor: p.descuento_valor.toString(),
					iva_porcentaje: p.iva_porcentaje.toString(),
					iva_valor: p.iva_valor.toString(),
					total: p.total.toString(),
				})),
				id_ubicacion: order.id_ubicacion,
				id_bodega: bodegaId, 
				consecutivo: order.id.replace('order-', ''),
				id_cliente: clienteId,
				fecha_manual: new Date().toISOString().split('T')[0],
				id_resolucion: "1",
				id_vendedor: null,
				id_pedido: order.id_backend ? order.id_backend.toString() : null,
				observacion: `Pedido desde POS - ${order.ubicacion_nombre}`
			}

			const response = await apiClient.post('/pos/pedido', payload)
			const backendId = response.data.data?.id 
			
			return { ...order, id_backend: backendId || order.id_backend }
			
		} catch (error: any) {
			console.error('❌ Error guardando pedido:', error)
			// Aquí manejarías un error de sincronización
			return order // Devuelve la orden sin el ID de backend si falla la sincronización
		}
	}
	
	// 🔥 FUNCIÓN CENTRAL DE ACTUALIZACIÓN (LOCAL Y REMOTA)
	const updateOrderLocallyAndRemotely = useCallback(async (updatedOrder: Order) => {
        setCurrentOrder(updatedOrder);
        setOrders(prev => prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));

        try {
            const savedOrder = await saveOrderToBackend(updatedOrder, selectedCliente, selectedBodega);
            if (savedOrder.id_backend && (!updatedOrder.id_backend || savedOrder.id_backend !== updatedOrder.id_backend)) {
                setCurrentOrder(savedOrder);
                setOrders(prev => prev.map(o => (o.id === savedOrder.id ? savedOrder : o)));
            }
        } catch (error) {
            console.error("Error actualizando pedido en backend:", error);
        }
    }, [selectedCliente, selectedBodega]);

	// --- LOGICA DE CARGA INICIAL Y CLIENTE ---
	
	// Carga Cliente por defecto desde localStorage 
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const clienteGuardado = localStorage.getItem('clientePorDefecto');
			if (clienteGuardado) {
				try {
					setSelectedCliente(JSON.parse(clienteGuardado));
				} catch (error) {
					console.error('❌ Error cargando cliente desde localStorage:', error);
				}
			}
		}
	}, []);

	// Carga inicial de Pedidos del Backend
	useEffect(() => {
		const loadOrders = async () => {
			try {
				const response = await apiClient.get('/pos/pedidos'); 
				const backendOrders: BackendPedido[] = response.data.data || [];
				
				const newOrders = backendOrders
					.filter(o => o.estado === 1) 
					.map(mapBackendOrderToFrontend);
				
				setOrders(newOrders);
				console.log(`📥 Pedidos cargados desde backend: ${newOrders.length}`);

				if (!currentOrder && newOrders.length > 0) {
					setCurrentOrder(newOrders[0]);
				} 

			} catch (error) {
				console.error('❌ Error cargando pedidos desde el backend:', error);
			}
		};

		loadOrders();
	}, [mapBackendOrderToFrontend]);


	// --- FUNCIONES DE MANEJO DE ORDENES ---

	const selectOrder = (order: Order) => {
		setCurrentOrder(order)
	}

	const createNewOrder = async (locationId?: number, locationName?: string) => {
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

		setOrders((prev) => [...prev, newOrder]);
		setCurrentOrder(newOrder);
		
		try {
			const savedOrder = await saveOrderToBackend(newOrder, selectedCliente, selectedBodega)
			
			if (savedOrder?.id_backend) {
				setCurrentOrder(savedOrder)
				setOrders((prev) => prev.map((o) => (o.id === newOrder.id ? savedOrder : o)))
			}
		} catch (error) {
			console.error('Error creando nuevo pedido:', error)
		}
	}
	
	const addProductToOrder = async (product: Product, quantity = 1) => {
		// Crea una nueva orden si no hay una activa
		if (!currentOrder) {
			await createNewOrder(selectedLocation?.id, selectedLocation?.nombre)
			// Espera un ciclo para que currentOrder se actualice antes de continuar
			return
		}

		const existingProductIndex = currentOrder.productos.findIndex((item) => item.id_producto === product.id)
		let updatedProducts: OrderItem[]

		if (existingProductIndex >= 0) {
			updatedProducts = [...currentOrder.productos]
			const item = updatedProducts[existingProductIndex]
			
			item.cantidad += quantity
			item.subtotal = item.costo * item.cantidad
			item.iva_valor = item.subtotal * (item.iva_porcentaje / 100)
			item.total = item.subtotal + item.iva_valor
		} else {
			const precio = Number.parseFloat(product.precio)
			const iva_porcentaje = 19
			const subtotal = precio * quantity
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
			updatedProducts = [...currentOrder.productos, orderItem]
		}
		
		const updatedOrder = calculateOrderTotals({ ...currentOrder, productos: updatedProducts })
		await updateOrderLocallyAndRemotely(updatedOrder)
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

		const updatedOrder = calculateOrderTotals({ ...currentOrder, productos: updatedProducts })
		await updateOrderLocallyAndRemotely(updatedOrder)
	}

	const removeProductFromOrder = async (productId: number) => {
		if (!currentOrder) return

		const updatedProducts = currentOrder.productos.filter((item) => item.id_producto !== productId)
		
		const updatedOrder = calculateOrderTotals({ ...currentOrder, productos: updatedProducts })
		await updateOrderLocallyAndRemotely(updatedOrder)
	}

	const updateProductInOrder = async (updatedProduct: OrderItem) => {
		if (!currentOrder) return

		const updatedProducts = currentOrder.productos.map((item) => 
			item.consecutivo === updatedProduct.consecutivo ? updatedProduct : item
		)

		const updatedOrder = calculateOrderTotals({ ...currentOrder, productos: updatedProducts })
		await updateOrderLocallyAndRemotely(updatedOrder)
	}
	
	const handleUpdateBodega = async (bodega: Bodega | null) => {
		setSelectedBodega(bodega)
		if (currentOrder) {
			await updateOrderLocallyAndRemotely(currentOrder) 
		}
	}

	const handleUpdateCliente = async (cliente: Cliente | null) => {
		setSelectedCliente(cliente)
		if (currentOrder) {
			await updateOrderLocallyAndRemotely(currentOrder)
		}
	}
	
	const deleteOrder = (orderId: string) => {
		setOrders((prev) => prev.filter((order) => order.id !== orderId))
		if (currentOrder?.id === orderId) {
			const remainingOrders = orders.filter(o => o.id !== orderId && o.estado === 'pendiente')
			setCurrentOrder(remainingOrders.length > 0 ? remainingOrders[0] : null)
		}
		// Pendiente: Llamada DELETE al backend
	}

	const cancelCurrentOrder = () => {
		if (currentOrder) {
			deleteOrder(currentOrder.id)
		}
	}

	const completeOrder = () => {
		if (currentOrder) {
			setShowPaymentModal(true)
		}
	}
	
	const processPayment = async (paymentData: any) => {
		if (currentOrder) {
			try {
				// 1. Guardar antes de facturar
				const savedOrder = await saveOrderToBackend(currentOrder, selectedCliente, selectedBodega)
				
				// 2. Proceso de facturación (aquí iría la llamada final al backend para facturar y cambiar estado)
				
				// 3. Actualizar estado local (simulado)
				const completedOrder = { ...savedOrder, estado: "completado" as const }
				setOrders((prev) => prev.map((order) => (order.id === currentOrder.id ? completedOrder : order)))
				
				// 4. Seleccionar el siguiente pedido
				const remainingOrders = orders.filter(o => o.id !== currentOrder.id && o.estado === 'pendiente')
				setCurrentOrder(remainingOrders.length > 0 ? remainingOrders[0] : null)
				setSelectedCliente(null)
				setShowPaymentModal(false)
			} catch (error) {
				console.error('Error procesando pedido:', error)
			}
		}
	}
	
	// --- Verificación de autenticación ---

	if (!isAuthenticated && !loading) {
		return <LoginPage />
	}

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


	// --- RENDERIZADO PRINCIPAL (ESTRUCTURA DE 3 COLUMNAS) ---

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border bg-card">
				<div className="flex items-center justify-between px-6 py-4">
				{/* Lado izquierdo */}
				<div className="flex items-center gap-4">
					<h1 className="text-2xl font-bold text-foreground">Sistema POS</h1>
					<div className="text-sm text-muted-foreground hidden sm:block">
					{selectedLocation ? `Ubicación: ${selectedLocation.nombre}` : "Seleccionar ubicación"}
					</div>
				</div>

				{/* Lado derecho - Menú compacto */}
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						className="gap-2 hidden sm:flex"
						title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
					>
						{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
					</Button>

					<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="gap-2">
						<Menu className="h-4 w-4" />
						<span className="hidden sm:inline">Menú</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						{/* ... Opciones de menú ... */}
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
						
						<DropdownMenuItem 
							onClick={() => setShowOrdersTable(true)} 
						>
							<Table className="h-4 w-4 mr-2" />
							Gestión de Pedidos
						</DropdownMenuItem>

						<DropdownMenuItem>
						<Users className="h-4 w-4 mr-2" />
						Pedidos Activos
						<span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
							{orders.filter((o) => o.estado === "pendiente").length}
						</span>
						</DropdownMenuItem>

						<DropdownMenuSeparator />
						
						<DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
						{theme === "dark" ? (<Sun className="h-4 w-4 mr-2" />) : (<Moon className="h-4 w-4 mr-2" />)}
						{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem 
						// 🔥 CORRECCIÓN: Usar handleLogout
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

			{/* CONTENIDO PRINCIPAL: ESTRUCTURA DE 3 COLUMNAS */}
			<div className="flex h-[calc(100vh-65px)] overflow-hidden">
				
				{/* 1. PANEL LATERAL DE PEDIDOS (IZQUIERDA) */}
				<OrdersManagerPanel
					orders={orders}
					currentOrder={currentOrder}
					onSelectOrder={selectOrder}
					onNewOrder={() => createNewOrder(selectedLocation?.id, selectedLocation?.nombre)}
				/>

				{/* 2. CONTENIDO CENTRAL (PRODUCTOS) */}
				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="p-4 border-b border-border flex-shrink-0">
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

				{/* 3. PANEL DE ORDEN ACTUAL (DERECHA - OrderPanel) */}
				<div className="h-screen flex">
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

			{/* Modales */}
			{/* Se mantiene OrdersTableView, aunque se ha eliminado OrdersManager */}
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