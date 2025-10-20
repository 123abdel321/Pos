// components/OrdersManagerPanel.tsx

"use client"

import { useState } from "react"
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
}

export function OrdersManagerPanel({
	orders,
	currentOrder,
	onSelectOrder,
	onNewOrder,
}: OrdersManagerPanelProps) {
	// Estado local para manejar si el panel está expandido o colapsado
	const [isExpanded, setIsExpanded] = useState(false)

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
	
	// Filtra solo los pedidos que están activos (estado = pendiente)
	const activeOrders = orders.filter(o => o.estado === 'pendiente')

	// Renderiza un solo item de la lista de pedidos
	const renderOrderItem = (order: Order) => {
		const isCurrent = currentOrder?.id === order.id
		
		if (!isExpanded) {
			// Vista Colapsada (solo icono y ID de backend)
			return (
				<Button
					key={order.id}
					variant={isCurrent ? "default" : "outline"}
					size="icon"
					onClick={() => onSelectOrder(order)}
					className={`w-10 h-10 mb-2 relative ${isCurrent ? 'bg-primary hover:bg-primary/90' : 'hover:bg-accent'}`}
				>
					<ListOrdered className="h-4 w-4" />
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

		// Vista Expandida
		return (
			<Card
				key={order.id}
				onClick={() => onSelectOrder(order)}
				className={`
					p-3 cursor-pointer transition-all mb-2 
					${isCurrent 
						? "border-2 border-primary bg-primary/5 shadow-md" // Estilo más fuerte para la selección
						: "hover:bg-accent/50 border border-transparent" // Border más sutil para el hover
					}
				`}
			>
				{/* --- CABECERA: ID, TIEMPO y TOTAL --- */}
				<div className="flex items-start justify-between">
					
					{/* IZQUIERDA: ID y FECHA */}
					<div className="flex items-center gap-2">
						
						{/* Icono de Orden */}
						<ListOrdered 
							className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} 
						/>
						
						<div className="space-y-0.5">
							
							{/* ID de Pedido (Badge) */}
							{order.id_backend ? (
								<Badge 
									className="text-[10px] px-1.5 py-0 h-4 bg-yellow-400 text-black hover:bg-yellow-500 font-bold"
								>
									PEDIDO #{order.id_backend}
								</Badge>
							) : (
								<Badge 
									variant="secondary" 
									className="text-[10px] px-1.5 py-0 h-4 font-mono tracking-wider" // Fuente mono para ID temporal
								>
									TEMP: {order.id.replace('order-', '').slice(-6)}
								</Badge>
							)}
							
							{/* Fecha y Hora */}
							<div className="text-[10px] text-muted-foreground flex items-center gap-1">
								<Clock className="h-2.5 w-2.5" />
								<span>{formatDateTime(order.fecha)}</span>
							</div>
						</div>
					</div>
					
					{/* DERECHA: TOTAL y CANTIDAD DE ITEMS */}
					<div className="text-right flex flex-col items-end">
						<div className="text-sm font-extrabold leading-none text-foreground">
							{formatPrice(order.total)}
						</div>
						<div className="text-[10px] text-muted-foreground leading-none mt-0.5">
							{order.productos.length} items
						</div>
					</div>
				</div>

				{/* --- SEPARADOR (opcional, podrías quitarlo si quieres más compacto) --- */}
				<Separator className="my-2" />

				{/* --- PIE DE PÁGINA: CLIENTE y UBICACIÓN --- */}
				<div className="space-y-1">
					
					{/* Cliente */}
					{order.cliente && (
						<div className="flex items-center text-[11px] text-foreground/80 gap-1">
							<User className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
							<span 
								className="truncate font-medium" 
								title={`${order.cliente.numero_documento} - ${order.cliente.nombre_completo}`}
							>
								{/* Muestra solo el nombre y documento es el identificador en el title */}
								{order.cliente.nombre_completo} 
							</span>
							<span className="text-muted-foreground text-[10px] flex-shrink-0">
								({order.cliente.numero_documento})
							</span>
						</div>
					)}
					
					{/* Ubicación */}
					{order.ubicacion && (
						<div className="flex items-center text-[11px] text-foreground/80 gap-1">
							<MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
							<span 
								className="truncate" 
								title={`${order.ubicacion.codigo} - ${order.ubicacion.nombre}`}
							>
								{order.ubicacion.codigo} - {order.ubicacion.nombre}
							</span>
						</div>
					)}
				</div>
			</Card>
		)
	}

	return (
		<div
			className={`
				h-full flex flex-col transition-all duration-300 ease-in-out flex-shrink-0
				${isExpanded ? "w-64" : "w-16"}
				border-r border-border bg-background/95 backdrop-blur-sm 
			`}
		>
			{/* Header and Toggle */}
			<div className="flex justify-between items-center p-2 border-b border-border">
				{isExpanded && (
					<h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
						<ListOrdered className="h-4 w-4 text-primary" />
						Pedidos Activos ({activeOrders.length})
					</h2>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setIsExpanded(!isExpanded)}
					className="h-7 w-7 p-0 ml-auto"
					aria-label={isExpanded ? "Colapsar pedidos" : "Expandir pedidos"}
				>
					{isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
				</Button>
			</div>
			
			{/* New Order Button - Always visible */}
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

			{/* Orders List */}
			<div className={`flex-1 overflow-y-auto p-2 ${!isExpanded && 'flex flex-col items-center'}`}>
				{activeOrders.length === 0 && isExpanded ? (
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