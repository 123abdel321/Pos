"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
	ChevronLeft, 
	ChevronRight, 
	ShoppingCart, 
	User, 
	Clock,
	ListOrdered,
    Plus,
	MapPin,
} from "lucide-react"
import type { Order } from "@/app/page"

interface OrdersManagerPanelProps {
	orders: Order[]
	currentOrder: Order | null
	onSelectOrder: (order: Order) => void
	onNewOrder: () => void
	loadingOrderId?: string | null
	disableCollapse?: boolean
}

export function OrdersManagerPanel({
	orders,
	currentOrder,
	onSelectOrder,
	onNewOrder,
	loadingOrderId,
	disableCollapse = false,
}: OrdersManagerPanelProps) {
	// Estado local: si disableCollapse es true, forzamos true y el usuario no puede colapsar
	const [isExpanded, setIsExpanded] = useState(!disableCollapse);

	// Si disableCollapse cambia (ej. por resize), forzamos expansión
	useEffect(() => {
		if (disableCollapse) {
			setIsExpanded(true);
		}
	}, [disableCollapse]);

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("es-CO", {
			style: "currency",
			currency: "COP",
			minimumFractionDigits: 0,
		}).format(price)
	}

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString("es-CO", {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		})
	}
	
	const activeOrders = orders.filter(o => o.estado === 'pendiente')

	const renderOrderItem = (order: Order) => {
		const isCurrent = currentOrder?.id === order.id
		const isLoading = loadingOrderId === order.id
		
		if (!isExpanded) {
			// Vista colapsada (solo para escritorio cuando se colapsa manualmente)
			return (
				<Button
					key={order.id}
					variant={isCurrent ? "default" : "outline"}
					size="icon"
					onClick={() => !isLoading && onSelectOrder(order)}
					disabled={isLoading}
					className={`w-10 h-10 mb-2 relative ${isCurrent ? 'bg-primary hover:bg-primary/90' : 'hover:bg-accent'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
				>
					{isLoading ? (
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : (
						<ListOrdered className="h-4 w-4" />
					)}
					{order.id_backend && (
						<Badge 
							className={`absolute -top-1 -right-1 h-3 min-w-3 p-0 text-[8px] font-bold justify-center ${isCurrent ? 'bg-yellow-400 text-black' : 'bg-primary-foreground text-primary'}`}
						>
							{order.id_backend}
						</Badge>
					)}
				</Button>
			)
		}

		// Vista expandida
		return (
			<Card
				key={order.id}
				onClick={() => !isLoading && onSelectOrder(order)}
				className={`
					p-3 cursor-pointer transition-all mb-2 relative
					${isCurrent 
						? "border-2 border-primary bg-primary/5 shadow-md" 
						: "hover:bg-accent/50 border border-transparent"
					}
					${isLoading ? 'opacity-50 cursor-wait pointer-events-none' : ''}
				`}
			>
				{isLoading && (
					<div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					</div>
				)}
				
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						{isLoading ? (
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						) : (
							<ListOrdered className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
						)}
						<div className="space-y-0.5">
							{order.id_backend ? (
								<Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-400 text-black hover:bg-yellow-500 font-bold">
									PEDIDO #{order.id_backend}
								</Badge>
							) : (
								<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono tracking-wider">
									TEMP: {order.id.replace('order-', '').slice(-6)}
								</Badge>
							)}
							<div className="text-[10px] text-muted-foreground flex items-center gap-1">
								<Clock className="h-2.5 w-2.5" />
								<span>{formatDateTime(order.fecha)}</span>
							</div>
						</div>
					</div>
					<div className="text-right flex flex-col items-end">
						<div className="text-sm font-extrabold leading-none text-foreground">
							{formatPrice(order.total)}
						</div>
						<div className="text-[10px] text-muted-foreground leading-none mt-0.5">
							{order.productos.length} items
						</div>
					</div>
				</div>

				<Separator className="my-2" />

				<div className="space-y-1">
					{order.cliente && (
						<div className="flex items-center text-[11px] text-foreground/80 gap-1">
							<User className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
							<span className="truncate font-medium" title={`${order.cliente.numero_documento} - ${order.cliente.nombre_completo}`}>
								{order.cliente.nombre_completo} 
							</span>
							<span className="text-muted-foreground text-[10px] flex-shrink-0">
								({order.cliente.numero_documento})
							</span>
						</div>
					)}
					{order.ubicacion && (
						<div className="flex items-center text-[11px] text-foreground/80 gap-1">
							<MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
							<span className="truncate" title={`${order.ubicacion.codigo} - ${order.ubicacion.nombre}`}>
								{order.ubicacion.codigo} - {order.ubicacion.nombre}
							</span>
						</div>
					)}
				</div>
			</Card>
		)
	}

	// Determinar el ancho: si disableCollapse es true, usamos "w-full", sino el comportamiento normal
	const widthClass = disableCollapse 
		? "w-full" 
		: (isExpanded ? "w-64" : "w-16");

	return (
		<div
			className={`
				h-full flex flex-col transition-all duration-300 ease-in-out flex-shrink-0
				${widthClass}
				border-r border-border bg-background/95 backdrop-blur-sm 
			`}
		>
			{/* Header */}
			<div className="flex justify-between items-center p-2 border-b border-border">
				{isExpanded && (
					<h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
						<ListOrdered className="h-4 w-4 text-primary" />
						Pedidos Activos ({activeOrders.length})
					</h2>
				)}
				{/* Mostrar botón de colapso SOLO si no está deshabilitado */}
				{!disableCollapse && (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsExpanded(!isExpanded)}
						className="h-7 w-7 p-0 ml-auto"
						aria-label={isExpanded ? "Colapsar pedidos" : "Expandir pedidos"}
					>
						{isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
					</Button>
				)}
			</div>
			
			{/* Botón Nuevo Pedido */}
			<div className={`p-2 ${!isExpanded && 'flex justify-center'}`}>
				<Button 
					onClick={onNewOrder} 
					variant="default" 
					className={`gap-1 ${isExpanded ? 'w-full' : 'w-10 h-10 p-0'}`}
					title={isExpanded ? '' : 'Nuevo Pedido'}
				>
					<Plus className="h-4 w-4" />
					{isExpanded && 'Nuevo Pedido'}
				</Button>
			</div>

			{/* Lista de pedidos */}
			<div className={`flex-1 overflow-y-auto p-2 ${!isExpanded && 'flex flex-col items-center'}`}>
				{activeOrders.length === 0 && isExpanded && !disableCollapse ? (
					<div className="text-center p-4">
						<ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
						<p className="text-xs text-muted-foreground">No hay pedidos pendientes.</p>
					</div>
				) : (
					activeOrders.map(renderOrderItem)
				)}
			</div>
		</div>
	)
}