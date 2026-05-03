import { DEFAULT_IMAGE } from '@/lib/constants'

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzVoOt1ho2uHnGPzzze9kIIkvxjk5oVh47ZKjUEyUfV-Mqe1XWFONpDeBemtOkpHVKfCw/exec'

export interface Producto {
  id: string
  nombre: string
  precio: number
  categoria: string
  imagen: string
  codigoBarras: string
  fechaVencimiento: string
  stock: number
}

export interface VentaDiaria {
  fecha: string
  producto: string
  cantidad: number
  total: number
  metodoPago: string
}

export interface LoteInventario {
  producto: string
  cantidad: number
  neto: number
  iva: number
  total: number
  fechaVencimiento: string
  fechaElaboracion: string
  mesesVidaUtil: number
}

export function convertDriveImageUrl(url: string): string {
  if (!url || url.trim() === '') return DEFAULT_IMAGE

  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match) {
    return `https://lh3.googleusercontent.com/u/0/d/${match[1]}`
  }

  if (url.includes('lh3.googleusercontent.com')) {
    return url
  }

  return url
}

export async function fetchProducts(): Promise<Producto[]> {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getProductos`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Error al cargar productos')
    }

    const data = await response.json()

    if (data.success && data.data) {
      return data.data.map((item: Record<string, unknown>) => ({
        id: item.id || item.ID || item.codigo || '',
        nombre: item.nombre || item.Nombre || item.producto || '',
        precio: Number(item.precio || item.Precio || item.precio_venta || 0),
        categoria: item.categoria || item.Categoria || 'Sin categoría',
        imagen: convertDriveImageUrl(
          item.imagen || item.Imagen || item.foto || item.url_imagen || ''
        ),
        codigoBarras:
          item.codigoBarras ||
          item.codigo_barras ||
          item.CodigoBarras ||
          item.barcode ||
          '',
        fechaVencimiento:
          item.fechaVencimiento ||
          item.fecha_vencimiento ||
          item.vencimiento ||
          '',
        stock: Number(item.stock || item.Stock || item.cantidad || 0),
      }))
    }

    return []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function registerSale(sale: {
  producto: string
  cantidad: number
  total: number
  metodoPago: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'registrarVenta',
        ...sale,
        fecha: new Date().toISOString().split('T')[0],
      }),
    })

    const data = await response.json()
    return {
      success: data.success ?? true,
      message: data.message ?? 'Venta registrada correctamente',
    }
  } catch (error) {
    console.error('Error registering sale:', error)
    return { success: false, message: 'Error al registrar la venta' }
  }
}

export async function fetchSalesSummary(): Promise<{
  inversionTotal: number
  metaVenta: number
  ventaReal: number
}> {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getVentasResumen`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Error al cargar resumen de ventas')
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        inversionTotal: Number(data.data.inversionTotal || data.data.inversion_total || 0),
        metaVenta: Number(data.data.metaVenta || data.data.meta_venta || 0),
        ventaReal: Number(data.data.ventaReal || data.data.venta_real || 0),
      }
    }

    return { inversionTotal: 0, metaVenta: 0, ventaReal: 0 }
  } catch (error) {
    console.error('Error fetching sales summary:', error)
    return { inversionTotal: 0, metaVenta: 0, ventaReal: 0 }
  }
}

export async function fetchExpiringProducts(days: number = 15): Promise<Producto[]> {
  try {
    const response = await fetch(
      `${SCRIPT_URL}?action=getProductosPorVencer&days=${days}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      throw new Error('Error al cargar productos por vencer')
    }

    const data = await response.json()

    if (data.success && data.data) {
      return data.data.map((item: Record<string, unknown>) => ({
        id: item.id || item.ID || '',
        nombre: item.nombre || item.Nombre || '',
        precio: Number(item.precio || item.Precio || 0),
        categoria: item.categoria || item.Categoria || 'Sin categoría',
        imagen: convertDriveImageUrl(item.imagen || item.Imagen || ''),
        codigoBarras: item.codigoBarras || item.codigo_barras || '',
        fechaVencimiento:
          item.fechaVencimiento || item.fecha_vencimiento || item.vencimiento || '',
        stock: Number(item.stock || item.Stock || 0),
      }))
    }

    return []
  } catch (error) {
    console.error('Error fetching expiring products:', error)
    return []
  }
}

export async function submitInvoice(invoice: {
  producto: string
  cantidad: number
  neto: number
  iva: number
  total: number
  fechaVencimiento: string
  fechaElaboracion: string
  mesesVidaUtil: number
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'registrarLote',
        ...invoice,
      }),
    })

    const data = await response.json()
    return {
      success: data.success ?? true,
      message: data.message ?? 'Lote registrado correctamente',
    }
  } catch (error) {
    console.error('Error submitting invoice:', error)
    return { success: false, message: 'Error al registrar el lote' }
  }
}

export async function searchByBarcode(barcode: string): Promise<Producto | null> {
  try {
    const products = await fetchProducts()
    return products.find(
      (p) => p.codigoBarras === barcode || p.id === barcode
    ) || null
  } catch (error) {
    console.error('Error searching by barcode:', error)
    return null
  }
}
