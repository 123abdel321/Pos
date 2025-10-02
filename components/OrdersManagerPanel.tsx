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
    Plus
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
					p-2 cursor-pointer transition-colors mb-2
					${isCurrent ? "border-primary border-2 bg-primary/10" : "hover:bg-accent/50"}
				`}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ListOrdered className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
						<div>
							<div className="text-xs font-semibold leading-tight flex items-center gap-1">
								{order.id_backend ? (
									<Badge className="text-[10px] px-1 py-0 h-4 bg-yellow-400 text-black hover:bg-yellow-500">
										PEDIDO #{order.id_backend}
									</Badge>
								) : (
									<Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
										TEMP: {order.id.replace('order-', '').slice(-6)}
									</Badge>
								)}
							</div>
							<div className="text-[10px] text-muted-foreground mt-[2px] flex items-center gap-1">
								<Clock className="h-2.5 w-2.5" />
								{formatDateTime(order.fecha)}
							</div>
						</div>
					</div>
					<div className="text-right">
						<div className="text-sm font-bold leading-tight">
							{formatPrice(order.total)}
						</div>
						<div className="text-[11px] text-muted-foreground leading-tight mt-[2px]">
							{order.productos.length} items
						</div>
					</div>
				</div>
				<Separator className="my-1" />
				<div className="flex items-center text-[10px] text-muted-foreground gap-1">
					<User className="h-3 w-3" />
					<span className="truncate">{order.ubicacion_nombre}</span>
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