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

export interface Empresa {
	id: number;
	nit: string;
	dv: string | null;
	razon_social: string;
	otros_nombres: string | null;
	primer_nombre: string | null;
	segundo_nombre: string | null;
	primer_apellido: string | null;
	segundo_apellido: string | null;
	direccion: string | null;
	email: string | null;
	telefono: string;
	tipo_contribuyente: number;
	codigos_responsabilidades: string;
	id_nit: number | null;
	fecha_ultimo_cierre: string | null;
	fecha_retiro: string | null;
	id_empresa_referido: number | null;
	id_usuario_owner: number;
	estado: number;
	notas_negociacion: string | null;
	token_db: string;
	logo: string;
	servidor: string;
	hash: string;
	created_at: string;
	updated_at: string;
}

// Interfaz para la configuración de validación
interface ValidationConfig {
	iva_incluido: boolean
	bodega: Bodega,
	cliente: Cliente,
	empresa: Empresa
}

function POSContent() {
	const { theme, setTheme } = useTheme()
	const confirmDialog = useConfirmation()
	const [orders, setOrders] = useState<Order[]>([])
	const [empresa, setEmpresa] = useState<Empresa | null>(null)
	const { user, logout, isAuthenticated, loading } = useAuth()
	const [showOrdersTable, setShowOrdersTable] = useState(false)
	const [showPaymentModal, setShowPaymentModal] = useState(false) 
	const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
	const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)
	const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null)
	const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
	const [selectedLocation, setSelectedLocation] = useState<Ubicacion | null>(null);
	// NUEVOS ESTADOS PARA LA CONFIGURACIÓN
	const [topeRetencion, setTopeRetencion] = useState<number>(0)
	const [ivaIncluido, setIvaIncluido] = useState<boolean>(false)
	const [clienteDefecto, setClienteDefecto] = useState<Cliente | null>(null)
	const [bodegaDefecto, setBodegaDefecto] = useState<Bodega | null>(null)
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
				console.log('response: ',response);
				setEmpresa(config.empresa)
				setValidationConfig(config)
				setIvaIncluido(estadoIvaInlucido || false)
				setClienteDefecto(config.cliente)
				setBodegaDefecto(config.bodega)


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

	const mapSingleBackendOrderToFrontend = useCallback((backendOrder: BackendPedido): Order => {
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

        // Cálculos simplificados para un solo pedido
        const totalIva = frontendItems.reduce((sum, item) => sum + item.iva_valor, 0);
        const totalDescuento = frontendItems.reduce((sum, item) => sum + item.descuento_valor, 0);
        const valorBruto = frontendItems.reduce((sum, item) => 
            sum + (item.cantidad * item.costo) - item.descuento_valor, 0
        );

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
            total: valorBruto,
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
			paymentData.id_cliente = selectedCliente ? selectedCliente.id : null;
		
			const response = await apiClient.post('/pos/venta', paymentData);

			if (response.data.success) {
				const idVenta = response.data?.id_venta ?? null;
				const idBackend = response.data?.id ?? null;

				const updatedOrder: Order = {
					...order,
					id_backend: idBackend,
					id_venta: idVenta,
					estado: "completado",
				};

				return updatedOrder;
			}

			const updatedOrder: Order = {
				...order
			};

			return updatedOrder;
			
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
	
	// Carga Cliente 7 Bodega por defecto desde localStorage 
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

			const bodegaGuardado = localStorage.getItem('bodegaPorDefecto');
			if (bodegaGuardado) {
				try {
					setSelectedBodega(JSON.parse(bodegaGuardado));
				} catch (error) {
					console.error('❌ Error cargando bodega desde localStorage:', error);
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

	const selectOrder = async (order: Order, findInBakend = true) => {

		setLoadingOrderId(order.id)
		
		try {
			var orderResponse = null
			if (findInBakend) {
				const response = await apiClient.get(`/pos/pedidos/${order.id_backend}`);
				orderResponse = response.data.data
			}
		
			const orderBodega = orderResponse ? orderResponse.bodega : order.bodega;
			const orderCliente = orderResponse ? orderResponse.cliente : order.cliente;
			const orderUbicacion = orderResponse ? orderResponse.ubicacion : order.ubicacion;

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

		} catch (error) {
			console.error('Error al cargar el pedido:', error)
		} finally {
			setLoadingOrderId(null)
		}		
	}

	const createNewOrder = async (ubicacion: Ubicacion | null = null, currentCliente: Cliente | null = null, currentBodega: Bodega | null = null) => {

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

		const bodegaGuardado = localStorage.getItem('bodegaPorDefecto');
		var bodegaSeteado = null
		if (bodegaGuardado) {
			bodegaSeteado = JSON.parse(bodegaGuardado);
			try {
				setSelectedBodega(bodegaSeteado);
			} catch (error) {
				console.error('❌ Error cargando bodega desde localStorage:', error);
			}
		}

		if (ubicacion) {
			setSelectedLocation(ubicacion);
		} else {
			setSelectedLocation(null);
		}

		const newOrder: Order = {
			id: `order-${Date.now()}`,
			id_backend: null,
			id_venta: null,
			id_bodega: currentBodega ? currentBodega.id : null,
			bodega: currentBodega,
			id_cliente: currentCliente ? currentCliente.id : null,
			cliente: currentCliente,
			id_ubicacion: ubicacion ? ubicacion.id : null,
			ubicacion: ubicacion,
			ubicacion_nombre: ubicacion ? ubicacion.nombre : "Mostrador",
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
			const savedOrder = await saveOrderToBackend(newOrder, selectedCliente, ubicacion, selectedBodega)
			
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

		const clienteToUse = selectedCliente || clienteDefecto;
		const bodegaToUse = selectedBodega || bodegaDefecto; 

		if (!selectedCliente) {
			setSelectedCliente(clienteDefecto);
		}

		if (!selectedBodega) {
			setSelectedBodega(selectedBodega);
		}

		if (!currentOrder) {
			await createNewOrder(selectedLocation, clienteToUse, bodegaToUse)
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
		await updateOrderLocallyAndRemotely(updatedOrder, clienteToUse, selectedLocation, bodegaToUse)
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
    
		//ACTUALIZAR SIN UBICACIÓN
		if (!ubicacion) {
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

		const response = await apiClient.get(`/pos/pedidos/ubicacion/${ubicacion.id}`);
		const backendOrders: BackendPedido = response.data.data || null;

		if (backendOrders) {
			const frontendOrder = mapSingleBackendOrderToFrontend(backendOrders);
			setSelectedLocation(ubicacion);
			selectOrder(frontendOrder, false)
			return;
		}

		//BUSCAR PEDIDO PENDIENTE
		const pedidoOcupandoUbicacion = orders.find(
			order => order.id_ubicacion === ubicacion.id && order.estado === 'pendiente' 
		);
		if (pedidoOcupandoUbicacion) {
			if (currentOrder && currentOrder.id === pedidoOcupandoUbicacion.id) {
				setSelectedLocation(ubicacion);
				return
			}
			selectOrder(pedidoOcupandoUbicacion)
			return;
		}

		//CREAR NUEVO PEDIDO CON LA UBICACIÓN
		setSelectedLocation(ubicacion)
		createNewOrder(ubicacion)
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

				if (savedOrder.id_venta) {
					const completedOrder = { ...savedOrder, estado: "completado" as const }
					setOrders((prev) => prev.map((order) => (order.id === currentOrder.id ? completedOrder : order)))
					
					const remainingOrders = orders.filter(o => o.id !== currentOrder.id && o.estado === 'pendiente')
					setCurrentOrder(remainingOrders.length > 0 ? remainingOrders[0] : null)
					setShowPaymentModal(false)
	
					window.dispatchEvent(new CustomEvent('showToast', {
						detail: { 
							message: 'Venta creada con exito!',
							type: 'success',
							autoClose: true,
							duration: 5000
						}
					}));
	
					if (savedOrder.id_venta) {
						const pdfUrl = `https://app.portafolioerp.com/pos/venta-print/${savedOrder.id_venta}`;
						window.open(pdfUrl, '_blank');
					}
				}

			} catch (error) {
				console.error('Error procesando pedido:', error)
			}
		}
	}

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
			<header className="border-b border-border bg-card/70 backdrop-blur-xl sticky top-0 z-50">
				<div className="flex h-14 items-center justify-between px-6">
					
					{/* SECCIÓN IZQUIERDA: Marca & Status */}
					<div className="flex items-center gap-6"> 
					<div className="flex items-center gap-3">
						{empresa?.logo ? (
						<div className="relative flex-shrink-0">
							<div className="absolute inset-0 bg-primary/20 rounded-lg blur-[2px]" />
							<img 
							src={empresa.logo} 
							alt={empresa.razon_social}
							className="relative h-8 w-8 rounded-lg object-cover border border-white/20 shadow-sm ring-1 ring-border/50"
							/>
						</div>
						) : (
						<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner">
							<span className="text-xs font-black text-primary italic">
							{empresa?.razon_social?.charAt(0) || 'P'}
							</span>
						</div>
						)}
						
						<div className="flex flex-col -space-y-0.5">
						<h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
							{empresa?.razon_social || "POS SYSTEM"}
							<span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" title="Sistema Activo" />
						</h1>
						<div className="flex items-center gap-2">
							<span className="text-[10px] font-bold text-muted-foreground/60 tracking-[0.05em] uppercase">
							Terminal 01
							</span>
							{ivaIncluido && (
							<div className="flex items-center">
								<span className="text-muted-foreground/30 text-[10px] mr-1.5">•</span>
								<span className="text-[9px] font-bold leading-none text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-[4px] uppercase tracking-tighter">
								IVA INC
								</span>
							</div>
							)}
						</div>
						</div>
					</div>
					</div>

					{/* SECCIÓN DERECHA: Acciones & Perfil Rápido */}
					<div className="flex items-center gap-2">
					
					{/* Indicador de Pedidos Pendientes (Fuera del menú para visibilidad inmediata) */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowOrdersTable(true)}
						className="h-9 px-3 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all hidden md:flex"
					>
						<Table className="h-4 w-4" />
						<span className="text-xs font-semibold">Pedidos</span>
						<span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-primary-foreground">
						{orders.filter((o) => o.estado === "pendiente").length}
						</span>
					</Button>

					<div className="w-[1px] h-5 bg-border/60 mx-1 hidden sm:block" />

					{/* Botón de Tema (Icono más fino) */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent transition-transform active:scale-95"
					>
						{theme === "dark" ? <Sun className="h-[1.1rem] w-[1.1rem]" /> : <Moon className="h-[1.1rem] w-[1.1rem]" />}
					</Button>

					{/* Menú de Usuario con Avatar */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
						<Button 
							variant="ghost" 
							className="h-9 pl-1 pr-2 gap-2 rounded-full border border-transparent hover:border-border hover:bg-muted/50 transition-all"
						>
							<div className="relative h-8 w-8">
								{/* Sombra base */}
								<div className="absolute inset-0 rounded-full bg-primary/30 blur-[3px] opacity-60"></div>
								
								{/* Bola 3D */}
								<div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-primary/25 via-primary/30 to-primary/20 
												border-t border-primary/40 border-r border-primary/30 
												border-b border-primary/10 border-l border-primary/20
												shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3),inset_-1px_-1px_2px_rgba(0,0,0,0.1)] 
												flex items-center justify-center">
									
									{/* Brillo */}
									<div className="absolute top-1 left-1 h-2 w-2 bg-white/25 rounded-full blur-[1px]"></div>
									
									{/* Texto */}
									<span className="text-xs font-black">
									{user?.firstname ? user.firstname.slice(0, 2).toUpperCase() : 'US'}
									</span>
								</div>
								</div>
							<Menu className="h-3.5 w-3.5 text-muted-foreground" />
						</Button>
						</DropdownMenuTrigger>
						
						<DropdownMenuContent align="end" className="w-64 p-1.5 shadow-2xl border-border/80 ring-1 ring-black/5">
						<div className="px-3 py-3 mb-1 bg-gradient-to-b from-muted/50 to-transparent rounded-lg border border-border/40">
							<p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2">Sesión Iniciada</p>
							<div className="flex items-center gap-3">
							<div className="flex flex-col min-w-0">
								<span className="text-sm font-bold truncate text-foreground leading-none">
								{user?.username || 'Usuario'}
								</span>
								<span className="text-[11px] text-muted-foreground truncate mt-1">
								{user?.email || 'admin@sistema.com'}
								</span>
							</div>
							</div>
						</div>
						
						<DropdownMenuItem 
							onClick={() => setShowOrdersTable(true)}
							className="md:hidden rounded-md py-2 px-3 focus:bg-primary/5 cursor-pointer"
						>
							<Table className="h-4 w-4 mr-2 text-muted-foreground" />
							<span className="text-sm font-medium">Gestión de Pedidos</span>
						</DropdownMenuItem>

						<DropdownMenuSeparator className="opacity-50" />
						
						<DropdownMenuItem 
							onClick={handleLogout}
							className="rounded-md py-2 px-3 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-medium"
						>
							<LogOut className="h-4 w-4 mr-2" />
							<span className="text-sm">Cerrar Sesión</span>
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
					loadingOrderId={loadingOrderId}
				/>

				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="p-4 border-b border-border flex-shrink-0">
						<LocationSelector
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