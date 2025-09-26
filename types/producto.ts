export interface Inventario {
    id: number
    id_producto: number
    id_bodega: number
    cantidad: string
}

export interface Familia {
    id: number
    codigo: string
    nombre: string
    text: string
}

export interface Producto {
    id: number
    codigo: string
    nombre: string
    precio: string
    precio_inicial: string
    text: string
    familia: Familia
    inventarios: Inventario[]
    imagen?: string | null
}