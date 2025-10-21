// app/page.tsx

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useConfirmation } from "@/components/ConfirmationContext";
import { LocationSelector } from "@/components/location-selector"
import { Ubicacion } from '@/types/ubicacion';
import { ProductGrid } from "@/components/product-grid"
import { OrderPanel } from "@/components/order-panel"
import { PaymentModal } from "@/components/payment-modal"
import { OrdersTableView } from "@/components/orders-table-view"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { 
	Sun, 
	Moon, 
	Table, 
	LogOut, 
	Menu,
	User,
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
import { OrdersManagerPanel } from "@/components/OrdersManagerPanel" 

// --- INTERFACES ---
export interface Product {
	id: number
	codigo: string
	nombre: string
	precio: string
	inventarios: Array<{ cantidad: string }>
	familia: {
		nombre: string
		cuenta_venta_iva?: {
			impuesto?: {
				porcentaje: number
			}
		}
		cuenta_venta_retencion?: {
			impuesto?: {
				porcentaje: number
				base: number
			}
		}
	}
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
	retencion_porcentaje: number
	retencion_valor: number
	total: number
	concepto: string
}

export interface Order {
    id: string
    id_backend: number | null
    id_ubicacion: number | null
    id_bodega: number | null
	id_venta: number | null
	id_cliente: number | null
	cliente: any
	bodega: any
	ubicacion: any
    ubicacion_nombre: string
    productos: OrderItem[]
    subtotal: number
    iva: number
    retencion: number
	porcentaje_retencion: number | null,
    total: number
    fecha: string
    estado: "pendiente" | "completado"
    iva_desglose?: { [key: number]: number }
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
	updated_at: string | null
	text: string | null
}

export interface BackendPedido {
	id: number
	consecutivo: string
	subtotal: string
	total_iva: string
	total_factura: string
	total_rete_fuente: string
	porcentaje_rete_fuente: string
	created_at: string
	estado: number;
	id_ubicacion: number | null
	id_venta: number | null
	id_cliente: number | null
	id_bodega: number | null
	cliente: any
	bodega: any
	ubicacion: any
	iva_desglose?: { [key: number]: number }
	detalles: any[]
}

// Interfaz para la configuración de validación
interface ValidationConfig {
	iva_incluido: boolean
}

function POSContent() {
	const { theme, setTheme } = useTheme()
	const confirmDialog = useConfirmation()
	const [orders, setOrders] = useState<Order[]>([])
	const { user, logout, isAuthenticated, loading } = useAuth()
	const [showOrdersTable, setShowOrdersTable] = useState(false)
	const [showPaymentModal, setShowPaymentModal] = useState(false) 
	const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
	const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null)
	const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
	const [selectedLocation, setSelectedLocation] = useState<Ubicacion | null>(null);
	// NUEVOS ESTADOS PARA LA CONFIGURACIÓN
	const [topeRetencion, setTopeRetencion] = useState<number>(0)
	const [ivaIncluido, setIvaIncluido] = useState<boolean>(false)
	const [porcentajeRetencion, setPorcentajeRetencion] = useState<number>(0)
	const [validationConfig, setValidationConfig] = useState<ValidationConfig | null>(null)
	// MOSTRAR UBICACIONES ACTIVAS
	const occupiedLocationIds = useMemo(() => {
		return orders
			.filter(o => o.id_ubicacion !== null && o.estado !== 'completado')
			.map(o => o.id_ubicacion!)
			.filter((value, index, self) => self.indexOf(value) === index); // Obtener únicos
	}, [orders]);

	// CARGAR CONFIGURACIÓN AL INICIAR
	useEffect(() => {
		const loadValidationConfig = async () => {
			try {
				const response = await apiClient.get('/pos/validate')
				const config: ValidationConfig = response.data.data
				const estadoIvaInlucido = config.iva_incluido

				setValidationConfig(config)
				setIvaIncluido(estadoIvaInlucido || false)

			} catch (error) {
				console.error('❌ Error cargando configuración:', error)
				// setIvaIncluido(false)
			}
		}

		loadValidationConfig()
	}, [])

	const handleLogout = () => {
		logout();
	};
	
	const calculateOrderTotals = (order: Order): Order => {
		let iva = 0;
		let retencion = 0;
		let descuento = 0;
		let total = 0;
		let valorBruto = 0;
		let redondeo = 0;

		// Calcular valores base (IGUAL A TU JAVASCRIPT)
		order.productos.forEach(producto => {
			iva += producto.iva_valor;
			descuento += producto.descuento_valor;
			valorBruto += (producto.cantidad * producto.costo) - producto.descuento_valor;
		});

		// Ajustar valorBruto si el IVA está incluido (IGUAL A TU JAVASCRIPT)
		if (ivaIncluido) valorBruto -= iva;

		total = ivaIncluido ? valorBruto : valorBruto + iva;

		// Calcular retención (IGUAL A TU JAVASCRIPT)
		if (total >= topeRetencion) {
			retencion = porcentajeRetencion ? (valorBruto * porcentajeRetencion) / 100 : 0;
		}

		// Ajuste final del total (IGUAL A TU JAVASCRIPT)
		if (ivaIncluido) total = total + iva;

		const ivaPorTasas = order.productos.reduce((acc, item) => {
			const tasa = item.iva_porcentaje;

			if (tasa === 0) {
				return acc;
			}

			if (!acc[tasa]) {
				acc[tasa] = 0;
			}

			acc[tasa] += item.iva_valor;
			return acc;
		}, {} as { [key: number]: number });
		
		return { 
			...order, 
			subtotal: valorBruto, 
			iva, 
			retencion, 
			total,
			iva_desglose: ivaPorTasas
		};
	}

	// Función de mapeo envuelta en useCallback
	const mapBackendOrderToFrontend = useCallback((backendOrder: BackendPedido): Order => {

		const frontendItems: OrderItem[] = (backendOrder.detalles || []).map((detalle: any, index: number): OrderItem => {
			const subtotalNum = Number.parseFloat(detalle.subtotal || '0');
			const ivaValorNum = Number.parseFloat(detalle.iva_valor || '0');
			const totalNum = Number.parseFloat(detalle.total || '0');
			const retencionValorNum = Number.parseFloat(detalle.retencion_valor || '0');
			const retencionPorcentajeNum = Number.parseFloat(detalle.retencion_porcentaje || '0');
			
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
				retencion_porcentaje: retencionPorcentajeNum,
				retencion_valor: retencionValorNum,
				total: totalNum,
				concepto: "",
			}
		});

		var ivaCalculo = 0
		var retencionCalculo = 0
		var descuentoCalculo = 0
		var totalCalculo = 0
		var redondeoCalculo = 0
		var valorBrutoCalculo = 0

		for (let index = 0; index < backendOrder.detalles.length; index++) {
			const producto = backendOrder.detalles[index];

			let impuestoPorcentaje = 0;
            let topeValor = 0;

			if (producto.cuenta_retencion && producto.cuenta_retencion.impuesto) {
            	impuestoPorcentaje = parseFloat(producto.cuenta_retencion.impuesto.porcentaje);
            	topeValor = parseFloat(producto.cuenta_retencion.impuesto.base);
            }

			if (impuestoPorcentaje > porcentajeRetencion) {
				setPorcentajeRetencion(impuestoPorcentaje)
				setTopeRetencion(topeValor)
            }

			ivaCalculo+= parseFloat(producto.iva_valor)
			descuentoCalculo+= parseFloat(producto.descuento_valor)
			valorBrutoCalculo+= (parseFloat(producto.cantidad) * parseFloat(producto.costo)) - parseFloat(producto.descuento_valor)
		}

		if (ivaIncluido) {
			valorBrutoCalculo-= ivaCalculo;
		}

		totalCalculo = ivaIncluido ? valorBrutoCalculo : valorBrutoCalculo + ivaCalculo;
		if (totalCalculo >= topeRetencion) {
			retencionCalculo = porcentajeRetencion ? (valorBrutoCalculo * porcentajeRetencion) / 100 : 0;
		}

		if (ivaIncluido) {
			totalCalculo = totalCalculo + ivaCalculo;
		}

		const totalIva = frontendItems.reduce((sum, item) => sum + item.iva_valor, 0);
		// 🔥 CALCULAR IVA AGRUPADO POR TASA
		const ivaPorTasas = backendOrder.detalles.reduce((acc, item) => {
			const tasa = item.iva_porcentaje;

			if (tasa === 0) {
				return acc;
			}

			if (!acc[tasa]) {
				acc[tasa] = 0;
			}

			acc[tasa] += item.iva_valor;
			return acc;
		}, {} as { [key: number]: number });

		return {
			id: `order-${backendOrder.id}`, 
			id_backend: backendOrder.id, 
			id_ubicacion: backendOrder.id_ubicacion,
			id_bodega: backendOrder.id_bodega,
			id_venta: backendOrder.id_venta,
			id_cliente: backendOrder.id_cliente,
			cliente: backendOrder.cliente,
			bodega: backendOrder.bodega,
			ubicacion: backendOrder.ubicacion,
			ubicacion_nombre: backendOrder.cliente?.nombre_completo.trim() || "Pedido Mostrador", 
			productos: frontendItems,
			subtotal: Number.parseFloat(backendOrder.subtotal),
			iva: totalIva,
			retencion: Number.parseFloat(backendOrder.total_rete_fuente),
			porcentaje_retencion: Number.parseFloat(backendOrder.porcentaje_rete_fuente),
			total: valorBrutoCalculo,
			fecha: backendOrder.created_at,
			iva_desglose: ivaPorTasas,
			estado: backendOrder.estado === 1 ? "pendiente" : "completado",
		};
	}, []);
	
	// Función para guardar en el backend
	const saveOrderToBackend = async (
		order: Order,
		cliente: Cliente | null,
		location: Ubicacion | null,
		bodega: Bodega | null,
	): Promise<Order> => {
		try {
			const clienteId = cliente?.id || null
			const bodegaId = bodega?.id || null
			const locationId = location?.id || null

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
					retencion_porcentaje: p.retencion_porcentaje.toString(),
					retencion_valor: p.retencion_valor.toString(),
					total: p.total.toString(),
				})),
				id_ubicacion: locationId,
				id_bodega: bodegaId, 
				consecutivo: order.id.replace('order-', ''),
				id_cliente: clienteId,
				fecha_manual: new Date().toISOString().split('T')[0],
				id_resolucion: null,
				id_vendedor: null,
				id_pedido: order.id_backend ? order.id_backend.toString() : null,
				observacion: `Pedido desde POS - ${order.ubicacion_nombre}`
			}

			const response = await apiClient.post('/pos/pedido', payload)
			const backendId = response.data.data?.id 
			
			return { ...order, id_backend: backendId || order.id_backend }
			
		} catch (error: any) {
			console.error('❌ Error guardando pedido:', error)
			return order
		}
	}

	const saveSaleToBackend = async (order: Order, paymentData: any): Promise<Order> => {
		try {
			paymentData.id_cliente = selectedCliente ? selectedCliente.id : null
			
			const response = await apiClient.post('/pos/venta', paymentData)
			const backendId = response.data.data?.id 
			
			return { 
				...order,
				id_backend: backendId || order.id_backend,
				estado: "completado"
			}
			
		} catch (error: any) {
			console.error('❌ Error guardando pedido:', error)
			return order
		}
	}
	
	// 🔥 FUNCIÓN CENTRAL DE ACTUALIZACIÓN
	const updateOrderLocallyAndRemotely = useCallback(async (updatedOrder: Order, currentCliente: Cliente | null, currentLocation: Ubicacion | null, currentBodega: Bodega | null) => {
        setCurrentOrder(updatedOrder);
        setOrders(prev => prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));
		
        try {
            const savedOrder = await saveOrderToBackend(updatedOrder, currentCliente, currentLocation, currentBodega);

            if (savedOrder.id_backend && (!updatedOrder.id_backend || savedOrder.id_backend !== updatedOrder.id_backend)) {
                setCurrentOrder(savedOrder);
                setOrders(prev => prev.map(o => (o.id === savedOrder.id ? savedOrder : o)));
            }
        } catch (error) {
            console.error("Error actualizando pedido en backend:", error);
        }
    }, [selectedBodega]);

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
				const detailsOrder = response.data.data.length ? response.data.data[0].detalles : []
				
				const newOrders = backendOrders
					.filter(o => o.estado === 1)
					.map(mapBackendOrderToFrontend)
				
				setOrders(newOrders)

				const bodega = newOrders[0].bodega;
				const cliente = newOrders[0].cliente;
				const ubicacion = newOrders[0].ubicacion;

				if (bodega) {
					const dataBodega = {
						id: bodega ? bodega.id : null,
						codigo: bodega ? bodega.codigo : null,
						nombre: bodega ? bodega.nombre : null,
						ubicacion: bodega ? bodega.ubicacion : null,
						id_centro_costos: bodega ? bodega.id_centro_costos : null,
						id_responsable: bodega ? bodega.id_responsable : null,
						id_cuenta_cartera: bodega ? bodega.id_cuenta_cartera : null,
						consecutivo: bodega ? bodega.consecutivo : null,
						consecutivo_parqueadero: bodega ? bodega.consecutivo_parqueadero : null,
						created_by: bodega ? bodega.created_by : null,
						updated_by: bodega ? bodega.updated_by : null,
						created_at: bodega ? bodega.created_at : null,
						updated_at: bodega ? bodega.updated_at : null,
						text: bodega ? bodega.codigo+' - '+bodega.nombre : null,
					}
					setSelectedBodega(dataBodega)
				}

				if (cliente) {
					const dataCliente = {
						id: cliente.id,
						id_tipo_documento: cliente.id_tipo_documento,
						id_ciudad: cliente.id_ciudad,
						primer_nombre: cliente.primer_nombre,
						segundo_nombre: cliente.segundo_nombre,
						primer_apellido: cliente.primer_apellido,
						segundo_apellido: cliente.segundo_apellido,
						email: cliente.email,
						sumar_aiu: cliente.sumar_aiu,
						porcentaje_aiu: cliente.porcentaje_aiu,
						porcentaje_reteica: cliente.porcentaje_reteica,
						apartamentos: cliente.apartamentos,
						id_responsabilidades: cliente.id_responsabilidades,
						telefono: cliente.telefono,
						text: cliente.text,
						nombre_completo: cliente.nombre_completo
					}
					setSelectedCliente(dataCliente)
				}

				if (ubicacion) {
					const pedidoUbi = ubicacion.pedido;
					const dataUbicacion = {
						id: ubicacion.id,
						nombre: ubicacion.nombre,
						text: ubicacion.nombre+' - '+ubicacion.codigo,
						codigo: ubicacion.codigo,
						pedido: {
							id: pedidoUbi ? pedidoUbi.id : null,
							id_venta: pedidoUbi ? pedidoUbi.id_venta : null
						}
					}
					setSelectedLocation(dataUbicacion)
				}

				if (!currentOrder && newOrders.length > 0) {
					setCurrentOrder(newOrders[0])
				}

			} catch (error) {
				console.error('❌ Error cargando pedidos desde el backend:', error);
			}
		};

		loadOrders();
	}, [mapBackendOrderToFrontend]);


	// --- FUNCIONES DE MANEJO DE ORDENES ---

	const selectOrder = (order: Order) => {
		
		const orderBodega = order.bodega;
		const orderCliente = order.cliente;
		const orderUbicacion = order.ubicacion;

		if (orderBodega) {
			const dataBodega = {
				id: orderBodega ? orderBodega.id : null,
				codigo: orderBodega ? orderBodega.codigo : null,
				nombre: orderBodega ? orderBodega.nombre : null,
				ubicacion: orderBodega ? orderBodega.ubicacion : null,
				id_centro_costos: orderBodega ? orderBodega.id_centro_costos : null,
				id_responsable: orderBodega ? orderBodega.id_responsable : null,
				id_cuenta_cartera: orderBodega ? orderBodega.id_cuenta_cartera : null,
				consecutivo: orderBodega ? orderBodega.consecutivo : null,
				consecutivo_parqueadero: orderBodega ? orderBodega.consecutivo_parqueadero : null,
				created_by: orderBodega ? orderBodega.created_by : null,
				updated_by: orderBodega ? orderBodega.updated_by : null,
				created_at: orderBodega ? orderBodega.created_at : null,
				updated_at: orderBodega ? orderBodega.updated_at : null,
				text: orderBodega ? orderBodega.codigo+' - '+orderBodega.nombre : null,
			}
			setSelectedBodega(dataBodega)
		} else {
			setSelectedBodega(null)
		}

		if (orderCliente) {
			const dataCliente = {
				id: orderCliente.id,
				id_tipo_documento: orderCliente.id_tipo_documento,
				id_ciudad: orderCliente.id_ciudad,
				primer_nombre: orderCliente.primer_nombre,
				segundo_nombre: orderCliente.segundo_nombre,
				primer_apellido: orderCliente.primer_apellido,
				segundo_apellido: orderCliente.segundo_apellido,
				email: orderCliente.email,
				sumar_aiu: orderCliente.sumar_aiu,
				porcentaje_aiu: orderCliente.porcentaje_aiu,
				porcentaje_reteica: orderCliente.porcentaje_reteica,
				apartamentos: orderCliente.apartamentos,
				id_responsabilidades: orderCliente.id_responsabilidades,
				telefono: orderCliente.telefono,
				text: orderCliente.text,
				nombre_completo: orderCliente.nombre_completo
			}
			setSelectedCliente(dataCliente)
		} else {
			setSelectedCliente(null)
		}

		if (orderUbicacion) {
			const pedidoUbi = orderUbicacion.pedido;
			const dataUbicacion = {
				id: orderUbicacion.id,
				nombre: orderUbicacion.nombre,
				text: orderUbicacion.nombre+' - '+orderUbicacion.codigo,
				codigo: orderUbicacion.codigo,
				pedido: {
					id: pedidoUbi ? pedidoUbi.id : null,
					id_venta: pedidoUbi ? pedidoUbi.id_venta : null
				}
			}
			setSelectedLocation(dataUbicacion)
		} else {
			setSelectedLocation(null)
		}
		
		setCurrentOrder(order)
	}

	const createNewOrder = async () => {

		const clienteGuardado = localStorage.getItem('clientePorDefecto');
		var clienteSeteado = null
		if (clienteGuardado) {
			clienteSeteado = JSON.parse(clienteGuardado);
			try {
				setSelectedCliente(clienteSeteado);
			} catch (error) {
				console.error('❌ Error cargando cliente desde localStorage:', error);
			}
		}

		setSelectedLocation(null);

		const newOrder: Order = {
			id: `order-${Date.now()}`,
			id_backend: null,
			id_venta: null,
			id_bodega: selectedBodega ? selectedBodega.id : null,
			bodega: selectedBodega,
			id_cliente: clienteSeteado ? clienteSeteado.id : null,
			cliente: clienteSeteado,
			id_ubicacion: null,
			ubicacion: null,
			ubicacion_nombre: "Mostrador",
			productos: [],
			subtotal: 0,
			iva: 0,
			retencion: 0,
			porcentaje_retencion: 0,
			total: 0,
			fecha: new Date().toISOString(),
			estado: "pendiente",
		}

		setOrders((prev) => [...prev, newOrder]);
		setCurrentOrder(newOrder);
		
		try {
			const savedOrder = await saveOrderToBackend(newOrder, selectedCliente, null, selectedBodega)
			
			if (savedOrder?.id_backend) {
				setCurrentOrder(savedOrder)
				setOrders((prev) => prev.map((o) => (o.id === newOrder.id ? savedOrder : o)))
			}
		} catch (error) {
			console.error('Error creando nuevo pedido:', error)
		}
	}
	
	// 🔥 FUNCIÓN MEJORADA PARA AGREGAR PRODUCTOS CON LA LÓGICA DE IVA
	const addProductToOrder = async (product: Product, quantity = 1) => {

		if (!selectedCliente || !selectedBodega) {
			let missing: string[] = [];
			if (!selectedCliente) {
				missing.push('Cliente');
			}
			if (!selectedBodega) {
				missing.push('Bodega');
			}

			const message = `No puedes agregar productos sin: ${missing.join(' y ')}.`;

			// 1. Mostrar el Toast con el mensaje dinámico
			window.dispatchEvent(new CustomEvent('showToast', {
				detail: { 
					message: message,
					type: 'warning',
					autoClose: true,
					duration: 5000
				}
			}));
			return
		}

		if (!currentOrder) {
			await createNewOrder()
			return
		}
		
		const existingProductIndex = currentOrder.productos.findIndex((item) => item.id_producto === product.id)
		let updatedProducts: OrderItem[]

		let impuestoPorcentaje = 0;
		let topeValor = 0;

		if (product.familia && product.familia.cuenta_venta_retencion && product.familia.cuenta_venta_retencion.impuesto) {
			impuestoPorcentaje = product.familia.cuenta_venta_retencion.impuesto.porcentaje;
        	topeValor = product.familia.cuenta_venta_retencion.impuesto.base;
			
			if (impuestoPorcentaje > porcentajeRetencion) {
				impuestoPorcentaje = impuestoPorcentaje;
				topeValor = topeValor;
				setPorcentajeRetencion(impuestoPorcentaje)
				setTopeRetencion(topeValor)
			} else {
				impuestoPorcentaje = porcentajeRetencion;
				topeValor = topeRetencion;
			}

		}

		if (existingProductIndex >= 0) {
			
			updatedProducts = [...currentOrder.productos]
			const item = updatedProducts[existingProductIndex]
			
			const newQuantity = item.cantidad + quantity
			const totals = calculateProductTotals(product, newQuantity)
			
			item.cantidad = newQuantity
			item.subtotal = totals.subtotal
			item.iva_valor = totals.ivaValor
			item.retencion_porcentaje = totals.retencionPorcentaje
			item.retencion_valor = totals.retencionValor
			item.total = totals.totalProducto
			
		} else {
			
			const totals = calculateProductTotals(product, quantity)
			
			const orderItem: OrderItem = {
				consecutivo: currentOrder.productos.length + 1,
				id_producto: product.id,
				nombre: `${product.codigo} - ${product.nombre}`,
				cantidad: quantity,
				costo: Number.parseFloat(product.precio),
				subtotal: totals.subtotal,
				descuento_porcentaje: 0,
				descuento_valor: totals.descuentoValor,
				iva_porcentaje: totals.ivaPorcentaje,
				iva_valor: totals.ivaValor,
				retencion_porcentaje: totals.retencionPorcentaje,
				retencion_valor: totals.retencionValor,
				total: totals.totalProducto,
				concepto: "",
			}

			updatedProducts = [...currentOrder.productos, orderItem]
		}
		
		const updatedOrder = calculateOrderTotals({ ...currentOrder, productos: updatedProducts })
		await updateOrderLocallyAndRemotely(updatedOrder, selectedCliente, selectedLocation, selectedBodega)
	}

	const calculateProductTotals = (product: Product, quantity: number = 1) => {

		// 1. Inicialización con valores por unidad
		const precioUnitario = Number.parseFloat(product.precio);
		let descuentoValor = 0; // Asumiendo 0 como en la función antigua
		let ivaPorcentaje = 0;
		let subtotalUnitario = precioUnitario; // Base para el subtotal ANTES de IVA (por unidad)
		let ivaValorUnitario = 0;
		let totalProductoUnitario = precioUnitario - descuentoValor; // Base para el total ANTES de IVA (por unidad)

		// Variables locales para retención (para el cálculo de este producto)
		let retencionPorcentaje = 0;
		let retencionValorUnitario = 0;

		// OBTENER IVA DEL PRODUCTO
		if (product.familia?.cuenta_venta_iva?.impuesto) {
			ivaPorcentaje = product.familia.cuenta_venta_iva.impuesto.porcentaje;
		}

		// OBTENER RETE-FUENTE DEL PRODUCTO (Solo cálculo local, NO Lógica Global)
		if (product.familia?.cuenta_venta_retencion?.impuesto) {
			// 🔥 SIMPLEMENTE ASIGNAMOS EL PORCENTAJE DEL PRODUCTO. 
			// La lógica de "cuál es el máximo" debe ir en addProductToOrder.
			retencionPorcentaje = product.familia.cuenta_venta_retencion.impuesto.porcentaje;
		}

		// CÁLCULO DE IVA POR UNIDAD (Lógica Exacta de la Función Antigua)
		// ... (El resto de la lógica de IVA es correcta, la omito por brevedad)
		if (ivaPorcentaje > 0) {
			if (ivaIncluido) {
				ivaValorUnitario = (precioUnitario - descuentoValor) - ((precioUnitario - descuentoValor) / (1 + (ivaPorcentaje / 100)));
			} else {
				ivaValorUnitario = (precioUnitario - descuentoValor) * (ivaPorcentaje / 100);
			}
		}

		// AJUSTE DEL TOTAL Y SUBTOTAL POR UNIDAD (Lógica Exacta de la Función Antigua)
		totalProductoUnitario = precioUnitario - descuentoValor;
		
		if (!ivaIncluido) {
			totalProductoUnitario += ivaValorUnitario;
		} else {
			subtotalUnitario -= ivaValorUnitario;
		}
		
		// CÁLCULO DE RETENCIÓN POR UNIDAD (Se calcula con el porcentaje del producto, NO el global)
		if (retencionPorcentaje > 0) {
			// La retención se calcula sobre el subtotal (precio - descuento), que se considera la base.
			retencionValorUnitario = (precioUnitario - descuentoValor) * (retencionPorcentaje / 100);
		}
		
		// 2. Aplicar la cantidad al final
		const subtotal = subtotalUnitario * quantity;
		const ivaValor = ivaValorUnitario * quantity;
		const retencionValor = retencionValorUnitario * quantity;
		const totalProducto = totalProductoUnitario * quantity;

		return {
			subtotal,
			ivaValor,
			retencionValor,
			totalProducto,
			ivaPorcentaje,
			retencionPorcentaje,
			descuentoValor
		};
	}

	const updateProductQuantity = async (productId: number, newQuantity: number) => {
		if (!currentOrder) return;

		if (newQuantity <= 0) {
			removeProductFromOrder(productId);
			return;
		}

		const productToUpdate = currentOrder.productos.find(item => item.id_producto === productId);
		if (!productToUpdate) return;

		// 🔥 CALCULAR NUEVOS VALORES SEGÚN TU LÓGICA DE JAVASCRIPT
		const totalPorCantidad = productToUpdate.costo * newQuantity;
		let totalIva = 0;
		let totalDescuento = 0;
		let totalProducto = 0;

		if (productToUpdate.descuento_porcentaje) {
			totalDescuento = totalPorCantidad * (productToUpdate.descuento_porcentaje / 100);
		}

		totalProducto = totalPorCantidad - totalDescuento;

		if (productToUpdate.iva_porcentaje) {
			totalIva = (totalPorCantidad - totalDescuento) * (productToUpdate.iva_porcentaje / 100);
			if (ivaIncluido) {
				totalIva = (totalPorCantidad - totalDescuento) - ((totalPorCantidad - totalDescuento) / (1 + (productToUpdate.iva_porcentaje / 100)));
			}
		}

		if (!ivaIncluido) {
			totalProducto += totalIva;
		}

		const updatedProducts = currentOrder.productos.map((item) => {
			if (item.id_producto === productId) {
				return {
					...item,
					cantidad: newQuantity,
					subtotal: totalPorCantidad - totalDescuento,
					descuento_valor: totalDescuento,
					iva_valor: totalIva,
					total: totalProducto
				};
			}
			return item;
		});

		const updatedOrder = calculateOrderTotals({ ...currentOrder, productos: updatedProducts });
		await updateOrderLocallyAndRemotely(updatedOrder, selectedCliente, selectedLocation, selectedBodega);
	};

	const removeProductFromOrder = async (productId: number) => {
		if (!currentOrder) return

		const updatedProducts = currentOrder.productos.filter((item) => item.id_producto !== productId)
		
		const updatedOrder = calculateOrderTotals({ ...currentOrder, productos: updatedProducts })
		await updateOrderLocallyAndRemotely(updatedOrder, selectedCliente, selectedLocation, selectedBodega)
	}

	const updateProductInOrder = async (updatedProduct: OrderItem) => {
		if (!currentOrder) return

		const updatedProducts = currentOrder.productos.map((item) => 
			item.consecutivo === updatedProduct.consecutivo ? updatedProduct : item
		)

		const updatedOrder = calculateOrderTotals({ ...currentOrder, productos: updatedProducts })
		await updateOrderLocallyAndRemotely(updatedOrder, selectedCliente, selectedLocation, selectedBodega)
	}
	
	const handleUpdateBodega = async (bodega: Bodega | null) => {
		setSelectedBodega(bodega)
		if (currentOrder && selectedCliente && bodega) {
			await updateOrderLocallyAndRemotely(currentOrder, selectedCliente, selectedLocation, bodega) 
		}
	}

	const handleUpdateCliente = async (cliente: Cliente | null) => {
		setSelectedCliente(cliente)
		if (currentOrder && selectedBodega && cliente) {
			await updateOrderLocallyAndRemotely(currentOrder, cliente, selectedLocation, selectedBodega)
		}
	}

	const handleUpdateUbicacion = async (ubicacion: Ubicacion | null) => {
    
		// Si la ubicación es null, simplemente la seteamos y si hay pedido, lo desasignamos.
		if (!ubicacion) {
			// Lógica para desasignar (cubierta en el punto 3/4)
			if (currentOrder) {
				await updateOrderLocallyAndRemotely(
					{...currentOrder, id_ubicacion: null, ubicacion: null, ubicacion_nombre: "Sin Ubicación"}, 
					selectedCliente, 
					null, 
					selectedBodega
				);
			}
			setSelectedLocation(null);
			return;
		}

		// 🔥 1. Manejo del pedido ya existente en la nueva ubicación (Lógica basada en el estado VIVO 'orders')
		
		// Buscamos un pedido PENDIENTE que ya esté usando esta ubicación en nuestro estado local 'orders'
		const pedidoOcupandoUbicacion = orders.find(
			order => order.id_ubicacion === ubicacion.id && order.estado === 'pendiente' 
		);

		if (pedidoOcupandoUbicacion) {
			// Si hay un pedido activo ocupando la ubicación:
			
			// Si ya estamos en ese pedido, no hacemos nada (simplemente aseguramos la selección visual)
			if (currentOrder && currentOrder.id === pedidoOcupandoUbicacion.id) {
				setSelectedLocation(ubicacion);
				return;
			}

			// Si es otro pedido, cambiamos a ese pedido (Pedido 1 en tu ejemplo)
			selectOrder(pedidoOcupandoUbicacion);
			
			window.emitToast({
				message: `Cambiando a Pedido #${pedidoOcupandoUbicacion.id_backend} en ${ubicacion.nombre}.`,
				type: 'info',
			});
			return; // Termina la función aquí
		}

		// ----------------------------------------------------------------------
		// 2. Si la ubicación está libre (según 'orders'), actualizamos la ubicación del currentOrder
		// ----------------------------------------------------------------------
		
		// Si no hay currentOrder, solo seteamos la ubicación seleccionada para futuras acciones
		if (!currentOrder) {
			setSelectedLocation(ubicacion);
			return;
		}
		
		// 3. Crear una copia del currentOrder y asignarle la nueva ubicación
		let updatedOrder = { ...currentOrder };

		// b) Asignar la nueva ubicación
		updatedOrder.id_ubicacion = ubicacion.id;
		updatedOrder.ubicacion = ubicacion;
		updatedOrder.ubicacion_nombre = ubicacion.nombre;

		// 4. Actualizar el estado local y remoto
		try {
			await updateOrderLocallyAndRemotely(
				updatedOrder, 
				selectedCliente, 
				ubicacion,
				selectedBodega
			);
			
			setSelectedLocation(ubicacion);
			
			window.emitToast({
				message: `Ubicación actualizada a ${ubicacion.nombre}.`,
				type: 'success',
			});
		} catch (error) {
			console.error("Error al actualizar ubicación del pedido:", error);
			window.emitToast({
				message: 'Error al cambiar la ubicación. Intenta de nuevo.',
				type: 'error',
			});
		}
	};
	
	const deleteOrder = async(orderId: number) => {
		
		const payload = {
			id: orderId
		}

		const response = await apiClient.delete('/pos/pedidos', {
			data: payload
		});

		if (response.data.success) {
			setOrders((prev) => prev.filter((order) => order.id_backend !== orderId))
			if (currentOrder?.id_backend === orderId) {
				const remainingOrders = orders.filter(o => o.id_backend !== orderId && o.estado === 'pendiente')
				setCurrentOrder(remainingOrders.length > 0 ? remainingOrders[0] : null)
			}
		}

	}

	const cancelCurrentOrder = async () => {
		if (!currentOrder) return;

		const isConfirmed = await confirmDialog.confirm({
			title: "Eliminar Pedido Activo",
			message: `¿Realmente deseas eliminar el pedido activo "${currentOrder.id}"? Esta acción no se puede deshacer.`,
			confirmText: "Sí, Eliminar Permanentemente",
			cancelText: "Cancelar",
			confirmButtonVariant: 'destructive'
		});

		if (isConfirmed) {
			if (currentOrder.id_backend !== null) {
				deleteOrder(currentOrder.id_backend);
			}
			// useToast().show({ message: `Pedido ${currentOrder.id} eliminado.`, type: 'success' }); // Opcional
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

				const savedOrder = await saveSaleToBackend(currentOrder, paymentData)
				// const completedOrder = { ...savedOrder, estado: "completado" as const }
				// setOrders((prev) => prev.map((order) => (order.id === currentOrder.id ? completedOrder : order)))
				
				// const remainingOrders = orders.filter(o => o.id !== currentOrder.id && o.estado === 'pendiente')
				// setCurrentOrder(remainingOrders.length > 0 ? remainingOrders[0] : null)
				// setSelectedCliente(null)
				// setShowPaymentModal(false)
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

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border bg-card">
				<div className="flex items-center justify-between px-6 py-4">
				<div className="flex items-center gap-4">
					<h1 className="text-2xl font-bold text-foreground">Sistema POS</h1>
					<div className="text-sm px-2 py-1 rounded bg-muted">
						{ivaIncluido ? 'IVA Incluido' : ''}
					</div>
				</div>

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

			<div className="flex h-[calc(100vh-65px)] overflow-hidden">
				<OrdersManagerPanel
					orders={orders}
					currentOrder={currentOrder}
					onSelectOrder={selectOrder}
					onNewOrder={() => createNewOrder()}
				/>

				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="p-4 border-b border-border flex-shrink-0">
						<LocationSelector 
							onNewOrder={createNewOrder}
							selectedLocation={selectedLocation}
							onLocationSelect={handleUpdateUbicacion}
        					occupiedLocationIds={occupiedLocationIds}
						/>
					</div>

					<div className="flex-1 overflow-auto">
						<ProductGrid onProductSelect={addProductToOrder} />
					</div>
				</div>

				<div className="h-screen flex">
					<OrderPanel
						currentOrder={currentOrder}
						onCompleteOrder={completeOrder}
						onNewOrder={() => createNewOrder()}
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

			{showOrdersTable && (
				<OrdersTableView
					orders={orders}
					onSelectOrder={selectOrder}
					onDeleteOrder={cancelCurrentOrder}
					onClose={() => setShowOrdersTable(false)}
				/>
			)}

			{showPaymentModal && currentOrder && (
				<PaymentModal
					order={currentOrder}
					onPayment={processPayment}
					onClose={() => setShowPaymentModal(false)}
				/>
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