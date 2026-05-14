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
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { useAuthStorage } from '@/hooks/useAuthStorage'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { 
	Sun, 
	Moon, 
	Table, 
	LogOut, 
	Menu,
	User,
	Warehouse,
	ChevronDown,
	Search,
	ShoppingCart,
	ClipboardList,
	Package,
} from "lucide-react" // Añadidos iconos para la barra móvil
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
import { Input } from "@/components/ui/input";

// --- INTERFACES ---
export interface Product {
	id: number
	codigo: string
	nombre: string
	precio: string
	inventarios: Array<{ cantidad: string }>
	familia: {
		nombre: string
		cuenta_venta_descuento?: {
			id: number
		}
		cuenta_venta_iva?: {
			id?: number
			impuesto?: {
				porcentaje: string
			}
		}
		cuenta_venta_retencion?: {
			id?: number
			impuesto?: {
				porcentaje: string
				base: string
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
	id_cuenta_venta_iva: number | null
	id_cuenta_venta_descuento: number | null
	id_cuenta_venta_retencion: number | null
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
	const { getToken, getUser } = useAuthStorage()
	const { theme, setTheme } = useTheme()
	const confirmDialog = useConfirmation()
	const [orders, setOrders] = useState<Order[]>([])
	const [empresa, setEmpresa] = useState<Empresa | null>(null)
	const { user, logout, isAuthenticated, loading } = useAuth()
	const [showOrdersTable, setShowOrdersTable] = useState(false) // Ya no se usará en móvil, pero se mantiene para escritorio
	const [showPaymentModal, setShowPaymentModal] = useState(false) 
	const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
	const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)
	const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
	const [selectedLocation, setSelectedLocation] = useState<Ubicacion | null>(null);
	const [topeRetencion, setTopeRetencion] = useState<number>(0)
	const [ivaIncluido, setIvaIncluido] = useState<boolean>(false)
	const [clienteDefecto, setClienteDefecto] = useState<Cliente | null>(null)
	const [bodegaDefecto, setBodegaDefecto] = useState<Bodega | null>(null)
	const [porcentajeRetencion, setPorcentajeRetencion] = useState<number>(0)
	const [validationConfig, setValidationConfig] = useState<ValidationConfig | null>(null)
	const [empresaToken, setEmpresaToken] = useState<string | null>(null)

	// Búsqueda de bodegas
	const [allBodegas, setAllBodegas] = useState<Bodega[]>([]);
	const [bodegasResultado, setBodegasResultado] = useState<Bodega[]>([]);
	const [searchBodega, setSearchBodega] = useState('');
	const [loadingBodegas, setLoadingBodegas] = useState(false);
	const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null);

	// NUEVO: Estado para la pestaña activa en móvil/tablet
	const [activeTab, setActiveTab] = useState<'products' | 'order' | 'orders'>('products');
	// NUEVO: Detectar si es pantalla pequeña (< 1024px)
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkScreen = () => setIsMobile(window.innerWidth < 1024);
		checkScreen();
		window.addEventListener('resize', checkScreen);
		return () => window.removeEventListener('resize', checkScreen);
	}, []);

	// MOSTRAR UBICACIONES ACTIVAS
	const occupiedLocationIds = useMemo(() => {
		return orders
			.filter(o => o.id_ubicacion !== null && o.estado !== 'completado')
			.map(o => o.id_ubicacion!)
			.filter((value, index, self) => self.indexOf(value) === index); // Obtener únicos
	}, [orders]);

	//CARGAR TODAS LAS BODEGAS AL INICIAR COMPONENTE
	useEffect(() => {
		const fetchBodegas = async () => {
			setLoadingBodegas(true);
			try {
				const response = await apiClient.get('/bodega/combo-bodega'); // tu endpoint
				const data = response.data.data || response.data;
				const bodegasList = Array.isArray(data) ? data : [];
				setAllBodegas(bodegasList);
				setBodegasResultado(bodegasList); // inicialmente mostrar todas
			} catch (error) {
				console.error('Error cargando bodegas:', error);
				setAllBodegas([]);
				setBodegasResultado([]);
			} finally {
				setLoadingBodegas(false);
			}
		};
		fetchBodegas();
	}, []);

	//FILTRAR LOCALMENTE LAS BODEGAS
	useEffect(() => {
		if (!searchBodega.trim()) {
			setBodegasResultado(allBodegas);
			return;
		}
		const lowerSearch = searchBodega.toLowerCase();
		const filtered = allBodegas.filter(bodega =>
			bodega.codigo?.toLowerCase().includes(lowerSearch) ||
			bodega.nombre?.toLowerCase().includes(lowerSearch) ||
			bodega.ubicacion?.toLowerCase().includes(lowerSearch)
		);
		setBodegasResultado(filtered);
	}, [searchBodega, allBodegas]);

	// CARGAR CONFIGURACIÓN AL INICIAR
	useEffect(() => {
		const loadValidationConfig = async () => {
			try {
				const response = await apiClient.get('/pos/validate')
				const config: ValidationConfig = response.data.data
				const estadoIvaInlucido = config.iva_incluido

				setEmpresa(config.empresa)
				setValidationConfig(config)
				setIvaIncluido(estadoIvaInlucido || false)
				setClienteDefecto(config.cliente)
				setBodegaDefecto(config.bodega)
				setEmpresaToken(config.empresa?.token_db);

			} catch (error) {
				console.error('❌ Error cargando configuración:', error)
				// setIvaIncluido(false)
			}
		}

		loadValidationConfig()
	}, [])

	// Efecto para buscar bodegas en el header
	useEffect(() => {
		if (searchBodega.trim() === "") {
			setBodegasResultado([])
			return
		}
		const delayDebounceFn = setTimeout(async () => {
			try {
			setLoadingBodegas(true)
			const response = await apiClient.get('/bodega/combo-bodega', {
				params: { search: searchBodega }
			})
			const data = response.data.data || response.data
			setBodegasResultado(Array.isArray(data) ? data : [])
			} catch (error) {
			console.error('Error searching bodegas:', error)
			setBodegasResultado([])
			} finally {
			setLoadingBodegas(false)
			}
		}, 500)
		return () => clearTimeout(delayDebounceFn)
	}, [searchBodega])

	const handleLogout = () => {
		logout();
	};
	
	const calculateOrderTotals = (order: Order): Order => {
		let iva = 0;
		let retencion = 0;
		let descuento = 0;
		let total = 0;
		let valorBruto = 0;

		// Calcular valores base (IGUAL A TU JAVASCRIPT)
		order.productos.forEach(producto => {
			iva += producto.iva_valor;
			descuento += producto.descuento_valor;
			valorBruto += (producto.cantidad * producto.costo) - producto.descuento_valor;
		});

		// Ajustar valorBruto si el IVA está incluido (IGUAL A TU JAVASCRIPT)
		if (ivaIncluido) valorBruto -= iva;

		total = ivaIncluido ? valorBruto : valorBruto + iva;

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

		console.log('ivaPorTasas: ',ivaPorTasas);

		// Calcular retención (IGUAL A TU JAVASCRIPT)
		if (topeRetencion > 0 && total >= topeRetencion) {
			retencion = porcentajeRetencion ? (valorBruto * porcentajeRetencion) / 100 : 0;
		}

		if (retencion) {
			total -= retencion;
		}
		
		return { 
			...order, 
			subtotal: valorBruto, 
			iva, 
			retencion, 
			total,
			porcentaje_retencion: porcentajeRetencion,
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
				id_cuenta_venta_iva: detalle.id_cuenta_venta_iva,
				id_cuenta_venta_descuento: detalle.id_cuenta_venta_descuento,
				id_cuenta_venta_retencion: detalle.id_cuenta_venta_retencion
			}
		});

		console.log('frontendItems: ',frontendItems);

		var ivaCalculo = 0
		var retencionCalculo = 0
		var descuentoCalculo = 0
		var totalCalculo = 0
		var redondeoCalculo = 0
		var valorBrutoCalculo = 0

		console.log('backendOrder: ',backendOrder);

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
		if (totalCalculo > 0 && totalCalculo >= topeRetencion) {
			retencionCalculo = porcentajeRetencion ? (valorBrutoCalculo * porcentajeRetencion) / 100 : 0;
		}

		if (ivaIncluido) {
			totalCalculo = totalCalculo + ivaCalculo;
		}

		const totalIva = frontendItems.reduce((sum, item) => sum + item.iva_valor, 0);
		//  CALCULAR IVA AGRUPADO POR TASA
		const ivaPorTasas = backendOrder.detalles.reduce((acc, item) => {
			const tasa = item.iva_porcentaje;

			if (tasa === 0) {
				return acc;
			}

			if (!acc[tasa]) {
				acc[tasa] = 0;
			}

			acc[tasa] += parseFloat(item.iva_valor);
			return acc;
		}, {} as { [key: number]: number });

		console.log('ivaPorTasas: ',ivaPorTasas);

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
			iva: Number.parseFloat(backendOrder.total_iva),
			retencion: Number.parseFloat(backendOrder.total_rete_fuente),
			porcentaje_retencion: Number.parseFloat(backendOrder.porcentaje_rete_fuente),
			total: Number.parseFloat(backendOrder.total_factura),
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
				id_cuenta_venta_iva: detalle.id_cuenta_venta_iva,
				id_cuenta_venta_descuento: detalle.id_cuenta_venta_descuento,
				id_cuenta_venta_retencion: detalle.id_cuenta_venta_retencion
            }
        });

        // Cálculos simplificados para un solo pedido
        const totalIva = frontendItems.reduce((sum, item) => sum + item.iva_valor, 0);
        const totalDescuento = frontendItems.reduce((sum, item) => sum + item.descuento_valor, 0);
        const valorBruto = frontendItems.reduce((sum, item) => 
            sum + (item.cantidad * item.costo) - item.descuento_valor, 0
        );

        //  CALCULAR IVA AGRUPADO POR TASA
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

	const refreshOrders = useCallback(async () => {
		try {
			const response = await apiClient.get('/pos/pedidos');
			const backendOrders: BackendPedido[] = response.data.data || [];
			const newOrders = backendOrders
			.filter(o => o.estado === 1) // solo pendientes
			.map(mapBackendOrderToFrontend);
			
			setOrders(newOrders);
			
			// Si el currentOrder ya no existe (ej. fue eliminado), limpiar
			if (currentOrder && !newOrders.find(o => o.id_backend === currentOrder.id_backend)) {
			setCurrentOrder(null);
			} else if (currentOrder) {
			// Actualizar el currentOrder si existe
			const updatedCurrent = newOrders.find(o => o.id_backend === currentOrder.id_backend);
			if (updatedCurrent) setCurrentOrder(updatedCurrent);
			}
		} catch (error) {
			console.error('Error refreshing orders:', error);
		}
	}, [mapBackendOrderToFrontend, currentOrder]);

	const handleRealtimeEvent = useCallback((data: any) => {
		const usuario = getUser();
		
		if (data.usuario_id === usuario?.id) {
			return;
		}
		
		switch (data.tipo) {
			case 'pedido_creado':
			case 'pedido_actualizado':
			case 'pedido_completado':
				refreshOrders(); // recarga la lista completa
			break;
			case 'pedido_eliminado':
				// Eliminar localmente sin recargar toda la lista (optimización)
				setOrders(prev => prev.filter(o => o.id_backend !== data.id_pedido));
				if (currentOrder?.id_backend === data.id_pedido) {
					setCurrentOrder(null);
				}
			break;
			default:
			break;
		}
	}, [refreshOrders, currentOrder]);

	useRealtimeOrders({
		empresaToken,
		onEvent: handleRealtimeEvent,
	});
	
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
	
	//  FUNCIÓN CENTRAL DE ACTUALIZACIÓN
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
				const newOrders = backendOrders
					.filter(o => o.estado === 1)
					.map(mapBackendOrderToFrontend)
				
				setOrders(newOrders)

				if (newOrders.length === 0) {
					return;
				}

				const cliente = newOrders[0].cliente;
				const ubicacion = newOrders[0].ubicacion;

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

			let detalleOrden = [];
			if (orderResponse && orderResponse.detalles) {
				detalleOrden = orderResponse.detalles.map((detalle: any, index: number): OrderItem => {
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
						concepto: detalle.concepto || '',
						id_cuenta_venta_iva: detalle.id_cuenta_venta_iva,
						id_cuenta_venta_descuento: detalle.id_cuenta_venta_descuento,
						id_cuenta_venta_retencion: detalle.id_cuenta_venta_retencion
					}
				});
			}
			
			const orderWithUpdatedItems = {
				...order,
				productos: detalleOrden,
				...(orderResponse && {
					subtotal: Number.parseFloat(orderResponse.subtotal || '0'),
					total_iva: Number.parseFloat(orderResponse.total_iva || '0'),
					total_descuento: Number.parseFloat(orderResponse.total_descuento || '0'),
					total_factura: Number.parseFloat(orderResponse.total_factura || '0'),
				})
			};

			setCurrentOrder(orderWithUpdatedItems)
			
			setOrders(prevOrders => 
				prevOrders.map(o => 
					o.id === order.id ? orderWithUpdatedItems : o
				)
			);

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
	
	// FUNCIÓN MEJORADA PARA AGREGAR PRODUCTOS CON LA LÓGICA DE IVA
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
			impuestoPorcentaje = parseFloat(product.familia.cuenta_venta_retencion.impuesto.porcentaje);
        	topeValor = parseFloat(product.familia.cuenta_venta_retencion.impuesto.base);
			
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
				id_cuenta_venta_iva: product.familia?.cuenta_venta_iva?.id ?? null,
				id_cuenta_venta_descuento: product.familia?.cuenta_venta_descuento?.id ?? null,
				id_cuenta_venta_retencion: product.familia?.cuenta_venta_retencion?.id ?? null,
			}

			updatedProducts = [...currentOrder.productos, orderItem]
		}
		
		const updatedOrder = calculateOrderTotals({ ...currentOrder, productos: updatedProducts })
		await updateOrderLocallyAndRemotely(updatedOrder, clienteToUse, selectedLocation, bodegaToUse)
	}

	const calculateProductTotals = (product: Product, quantity: number = 1) => {
		//ESTA MAL EL DESCUENTO, DEBE SER (precioUnitario * CANTIDAD) - descuentoValor
		// 1. Inicialización con valores por unidad
		const precioUnitario = Number.parseFloat(product.precio);
		let descuentoValor = 0; // Asumiendo 0 como en la función antigua
		let ivaPorcentaje = 0;
		let subtotalUnitario = precioUnitario * quantity; // Base para el subtotal ANTES de IVA (por unidad)
		let ivaValorUnitario = 0;
		let totalProductoUnitario = (precioUnitario * quantity )- descuentoValor; // Base para el total ANTES de IVA (por unidad)

		// Variables locales para retención (para el cálculo de este producto)
		let retencionPorcentaje = 0;
		let retencionValorUnitario = 0;

		// OBTENER IVA DEL PRODUCTO
		if (product.familia?.cuenta_venta_iva?.impuesto) {
			ivaPorcentaje = parseFloat(product.familia.cuenta_venta_iva.impuesto.porcentaje);
		}

		// OBTENER RETE-FUENTE DEL PRODUCTO (Solo cálculo local, NO Lógica Global)
		if (product.familia?.cuenta_venta_retencion?.impuesto) {
			retencionPorcentaje = parseFloat(product.familia.cuenta_venta_retencion.impuesto.porcentaje);
		}

		// CÁLCULO DE IVA POR UNIDAD (Lógica Exacta de la Función Antigua)
		if (ivaPorcentaje > 0) {
			if (ivaIncluido) {
				ivaValorUnitario = totalProductoUnitario * (ivaPorcentaje / (ivaPorcentaje + 100));
			} else {
				ivaValorUnitario = totalProductoUnitario * (ivaPorcentaje / 100);
			}
		}

		// AJUSTE DEL TOTAL Y SUBTOTAL POR UNIDAD (Lógica Exacta de la Función Antigua)
		if (ivaIncluido) {
			subtotalUnitario -= ivaValorUnitario;
		} else {
			totalProductoUnitario += ivaValorUnitario;
		}
		
		// CÁLCULO DE RETENCIÓN POR UNIDAD (Se calcula con el porcentaje del producto, NO el global)
		if (retencionPorcentaje > 0) {
			retencionValorUnitario = (precioUnitario - descuentoValor) * (retencionPorcentaje / 100);
		}
		
		// 2. Aplicar la cantidad al final
		const subtotal = subtotalUnitario;
		const ivaValor = ivaValorUnitario;
		const retencionValor = retencionValorUnitario;
		const totalProducto = totalProductoUnitario;

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

		const costoProducto = productToUpdate.costo;
		const cantidadProducto = newQuantity;
		const ivaProducto = productToUpdate.iva_porcentaje;
		const descuentoProducto = productToUpdate.descuento_porcentaje;

		var subTotal = newQuantity * costoProducto;
        var totalPorCantidad = 0;
        var totalIva = 0;
        var totalDescuento = 0;
        var totalProducto = 0;

		if (cantidadProducto > 0) {
            totalPorCantidad = cantidadProducto * costoProducto;
        }

		if (descuentoProducto > 0) {
            totalDescuento = totalPorCantidad * (descuentoProducto / 100);
            subTotal -= totalDescuento;
        }

		totalProducto = totalPorCantidad - totalDescuento;

		if (ivaProducto > 0) {
            totalIva = (totalPorCantidad - totalDescuento) * ivaProducto / 100;
            if (ivaIncluido) {
                subTotal = (totalPorCantidad - totalDescuento);
                totalIva = subTotal * (ivaProducto / (ivaProducto + 100));
            }
        }

		if (ivaIncluido) {
			subTotal-= totalIva;
		} else {
            totalProducto+= totalIva;
		}

		totalProducto = Math.round(totalProducto * 100) / 100;

		const updatedProducts = currentOrder.productos.map((item) => {
			if (item.id_producto === productId) {
				return {
					...item,
					cantidad: newQuantity,
					subtotal: subTotal,
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
						const token = getToken();
						const pdfUrl = `https://app.portafolioerp.com/pos/venta-print/${token}/${savedOrder.id_venta}`;

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
				{/* Header sin cambios (igual que en tu código actual) */}
				<div className="flex h-14 items-center justify-between px-4 sm:px-6">
					{/* Logo + nombre empresa */}
					<div className="flex items-center gap-2">
						{empresa?.logo ? (
							<img src={empresa.logo} className="h-7 w-7 rounded-lg object-cover" alt="logo" />
						) : (
							<div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
								<span className="text-xs font-black text-primary">
									{empresa?.razon_social?.charAt(0) || 'P'}
									{empresa?.razon_social?.charAt(1) || 'P'}
								</span>
							</div>
						)}
						<h1 className="text-sm font-bold hidden sm:block">{empresa?.razon_social || "POS"}</h1>
					</div>

					{/* Selector de bodega */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-8 gap-1 px-2">
								<Warehouse className="h-4 w-4" />
								<span className="text-xs truncate max-w-[100px]">
									{selectedBodega ? `${selectedBodega.codigo} - ${selectedBodega.nombre}` : "Bodega"}
								</span>
								<ChevronDown className="h-3 w-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-64 p-1">
							<div className="relative mb-1">
								<Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
								<Input
									placeholder="Buscar bodega..."
									value={searchBodega}
									onChange={(e) => setSearchBodega(e.target.value)}
									className="pl-6 h-6 text-xs"
								/>
							</div>
							<div className="max-h-44 overflow-auto">
								{loadingBodegas ? (
									<div className="text-center py-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
										<p className="text-[10px] mt-1 text-muted-foreground">Cargando bodegas...</p>
									</div>
								) : bodegasResultado.length > 0 ? (
									bodegasResultado.map((bodega) => (
										<DropdownMenuItem
											key={bodega.id}
											onClick={() => {
												setSearchBodega("");
												handleUpdateBodega(bodega);
											}}
											className="flex flex-col items-start p-2 mb-1"
										>
											<div className="font-medium text-[11px] leading-tight">
												{bodega.codigo} - {bodega.nombre}
											</div>
											<div className="text-[10px] text-muted-foreground">{bodega.ubicacion}</div>
										</DropdownMenuItem>
									))
								) : (
									<div className="text-center py-2 text-muted-foreground text-[11px]">
										{allBodegas.length === 0 ? "No tiene bodegas asignadas" : "Sin resultados"}
									</div>
								)}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Botón de pedidos pendientes (solo en desktop/tablet) */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowOrdersTable(true)}
						className="hidden md:flex h-8 gap-1 text-muted-foreground"
					>
						<Table className="h-4 w-4" />
						<span className="text-xs">Pedidos</span>
						<Badge variant="secondary" className="h-5 px-1 text-[10px]">
							{orders.filter(o => o.estado === "pendiente").length}
						</Badge>
					</Button>

					{/* Botón de tema */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						className="hidden sm:flex h-8 w-8"
					>
						{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
					</Button>

					{/* Menú de usuario */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 rounded-full p-0">
								<div className="relative h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
									<span className="text-xs font-bold">
										{user?.firstname ? user.firstname.slice(0, 2).toUpperCase() : 'US'}
									</span>
								</div>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel>{user?.username || 'Usuario'}</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="sm:hidden">
								{theme === "dark" ? "Modo claro" : "Modo oscuro"}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setShowOrdersTable(true)} className="md:hidden">
								Ver pedidos pendientes ({orders.filter(o => o.estado === "pendiente").length})
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleLogout} className="text-destructive">
								Cerrar sesión
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			{/* ========== LAYOUT PARA ESCRITORIO (>= lg) ========== */}
			<div className="hidden lg:flex flex-row h-[calc(100vh-65px)] overflow-hidden relative">
				{/* Panel de gestión de pedidos */}
				<div className="flex-shrink-0 border-r border-border overflow-y-auto bg-muted/20">
					<OrdersManagerPanel
						orders={orders}
						currentOrder={currentOrder}
						onSelectOrder={selectOrder}
						onNewOrder={() => createNewOrder()}
						loadingOrderId={loadingOrderId}
					/>
				</div>

				{/* Área central */}
				<div className="flex-1 flex flex-col overflow-hidden min-h-0">
					<LocationSelector
						selectedLocation={selectedLocation}
						onLocationSelect={handleUpdateUbicacion}
						occupiedLocationIds={occupiedLocationIds}
					/>
					<div className="flex-1 overflow-auto">
						<ProductGrid
							onProductSelect={addProductToOrder}
							bodegaId={selectedBodega?.id ?? null}
							selectedCliente={selectedCliente}
						/>
					</div>
				</div>

				{/* OrderPanel */}
				<div className="flex-shrink-0">
					<OrderPanel
						currentOrder={currentOrder}
						onCompleteOrder={completeOrder}
						onNewOrder={() => createNewOrder()}
						onUpdateQuantity={updateProductQuantity}
						onRemoveProduct={removeProductFromOrder}
						onUpdateProduct={updateProductInOrder}
						onUpdateCliente={handleUpdateCliente}
						onCancelOrder={cancelCurrentOrder}
						selectedCliente={selectedCliente}
						selectedBodega={selectedBodega}
						ivaIncluido={ivaIncluido}
					/>
				</div>
			</div>

			{/* ========== LAYOUT PARA MÓVIL/TABLET (< lg) ========== */}
			<div className="lg:hidden flex flex-col h-[calc(100vh-65px)] overflow-hidden relative">
				{/* LocationSelector solo cuando no estamos en la pestaña de pedidos (opcional) */}
				{activeTab !== 'orders' && (
					<div className="flex-shrink-0 p-2 border-b border-border">
						<LocationSelector
							selectedLocation={selectedLocation}
							onLocationSelect={handleUpdateUbicacion}
							occupiedLocationIds={occupiedLocationIds}
						/>
					</div>
				)}

				{/* Contenido según pestaña activa */}
				<div className="flex-1 overflow-auto">
					{activeTab === 'products' && (
						<ProductGrid
							onProductSelect={addProductToOrder}
							bodegaId={selectedBodega?.id ?? null}
							selectedCliente={selectedCliente}
						/>
					)}
					{activeTab === 'order' && (
						<OrderPanel
							currentOrder={currentOrder}
							onCompleteOrder={completeOrder}
							onNewOrder={() => createNewOrder()}
							onUpdateQuantity={updateProductQuantity}
							onRemoveProduct={removeProductFromOrder}
							onUpdateProduct={updateProductInOrder}
							onUpdateCliente={handleUpdateCliente}
							onCancelOrder={cancelCurrentOrder}
							selectedCliente={selectedCliente}
							selectedBodega={selectedBodega}
							ivaIncluido={ivaIncluido}
							disableCollapse={true}
						/>
					)}
					{activeTab === 'orders' && (
						<OrdersManagerPanel
							orders={orders}
							currentOrder={currentOrder}
							onSelectOrder={selectOrder}
							onNewOrder={() => createNewOrder()}
							loadingOrderId={loadingOrderId}
							disableCollapse={true}
						/>
					)}
				</div>

				{/* Barra inferior con 3 botones (pestañas) */}
				<div className="flex-shrink-0 border-t border-border bg-background/90 backdrop-blur-sm p-2">
					<div className="flex justify-around gap-2">
						<Button
							variant={activeTab === 'products' ? 'default' : 'ghost'}
							className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
							onClick={() => setActiveTab('products')}
						>
							<Package className="h-5 w-5" />
							<span className="text-xs">Productos</span>
						</Button>
						<Button
							variant={activeTab === 'order' ? 'default' : 'ghost'}
							className="flex-1 flex flex-col items-center gap-1 h-auto py-2 relative"
							onClick={() => setActiveTab('order')}
						>
							<ShoppingCart className="h-5 w-5" />
							<span className="text-xs">Pedido</span>
							{currentOrder && currentOrder.productos.length > 0 && (
								<Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
									{currentOrder.productos.length}
								</Badge>
							)}
						</Button>
						<Button
							variant={activeTab === 'orders' ? 'default' : 'ghost'}
							className="flex-1 flex flex-col items-center gap-1 h-auto py-2 relative"
							onClick={() => setActiveTab('orders')}
						>
							<ClipboardList className="h-5 w-5" />
							<span className="text-xs">Pedidos</span>
							{orders.filter(o => o.estado === 'pendiente').length > 0 && (
								<Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
									{orders.filter(o => o.estado === 'pendiente').length}
								</Badge>
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Modales (para escritorio y consistencia) */}
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