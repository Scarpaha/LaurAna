import { DEFAULT_IMAGE } from '@/lib/constants'

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzVoOt1ho2uHnGPzzze9kIIkvxjk5oVh47ZKjUEyUfV-Mqe1XWFONpDeBemtOkpHVKfCw/exec'

export interface Producto {
  codigoBarras: string
  nombre: string
  categoria: string
  mesesDuracionEstandar: number
  imagen: string
}

export interface VentaDiaria {
  fecha: string
  ventaBoleta: number
  ventaSinBoleta: number
  consumoPropio: number
  totalDia: number
}

export interface PanelPapa {
  mesActual: string
  inversionTotal: number
  metaVenta: number
  ventaReal: number
  diferencia: number
}

export interface LoteInventario {
  codigoBarras: string
  producto: string
  cantidad: number
  fechaVencimiento: string
  fechaElaboracion: string
  mesesDuracion: number
  vencimientoFinal: string
  costoNetoUnitario: number
  ivaCredito: number
  totalFactura: number
  estado: string
  linkImagen: string
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

const str = (val: unknown): string => (typeof val === 'string' ? val : '')
const num = (val: unknown): number => {
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

export async function fetchMaestroProductos(): Promise<Producto[]> {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getMaestroProductos`, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Error al cargar productos')
    const data = await response.json()
    if (data.success && data.data) {
      return data.data.map((item: Record<string, unknown>) => ({
        codigoBarras: str(
          item.codigoBarras || item['Código de Barras'] || item.codigo_barras || item.id
        ),
        nombre: str(
          item.nombre || item['Nombre del Producto'] || item.nombreProducto || item.nombre_producto
        ),
        categoria: str(
          item.categoria || item['Categoría'] || item.categoria || 'Sin categoría'
        ),
        mesesDuracionEstandar: num(
          item.mesesDuracionEstandar ||
            item['Meses Duración Estándar'] ||
            item.meses_duracion ||
            item.meses_duracion_estandar
        ),
        imagen: convertDriveImageUrl(
          str(
            item.imagen ||
              item['Link de la Imagen'] ||
              item.linkImagen ||
              item.link_imagen ||
              item.foto
          )
        ),
      }))
    }
    return []
  } catch (error) {
    console.error('Error fetching productos:', error)
    return []
  }
}

export async function fetchCajaDiaria(): Promise<VentaDiaria[]> {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getCajaDiaria`, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Error al cargar caja diaria')
    const data = await response.json()
    if (data.success && data.data) {
      return data.data.map((item: Record<string, unknown>) => ({
        fecha: str(item.fecha || item['Fecha']),
        ventaBoleta: num(item.ventaBoleta || item['Venta con Boleta'] || item.venta_con_boleta),
        ventaSinBoleta: num(
          item.ventaSinBoleta || item['Venta sin Boleta'] || item.venta_sin_boleta
        ),
        consumoPropio: num(item.consumoPropio || item['Consumo Propio'] || item.consumo_propio),
        totalDia: num(item.totalDia || item['Total Día'] || item.total_dia),
      }))
    }
    return []
  } catch (error) {
    console.error('Error fetching caja diaria:', error)
    return []
  }
}

export async function registrarVentaDiaria(venta: {
  fecha: string
  ventaBoleta: number
  ventaSinBoleta: number
  consumoPropio: number
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'registrarVentaDiaria',
        ...venta,
      }),
    })
    const data = await response.json()
    return {
      success: data.success ?? true,
      message: data.message ?? 'Venta registrada correctamente',
    }
  } catch (error) {
    console.error('Error registrando venta:', error)
    return { success: false, message: 'Error al registrar la venta' }
  }
}

export async function fetchPanelPapa(): Promise<PanelPapa | null> {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getPanelPapa`, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Error al cargar panel')
    const data = await response.json()
    if (data.success && data.data) {
      const d = data.data
      return {
        mesActual: str(d.mesActual || d['MES ACTUAL'] || d.mes_actual || ''),
        inversionTotal: num(
          d.inversionTotal || d['INVERSIÓN TOTAL (Facturas + IVA)'] || d.inversion_total
        ),
        metaVenta: num(d.metaVenta || d['META DE VENTA (1.2x)'] || d.meta_venta),
        ventaReal: num(d.ventaReal || d['VENTA REAL ACUMULADA'] || d.venta_real),
        diferencia: num(d.diferencia || d['DIFERENCIA / UTILIDAD'] || d.utilidad),
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching panel papa:', error)
    return null
  }
}

export async function fetchInventarioLotes(): Promise<LoteInventario[]> {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getInventarioLotes`, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Error al cargar inventario')
    const data = await response.json()
    if (data.success && data.data) {
      return data.data.map((item: Record<string, unknown>) => ({
        codigoBarras: str(
          item.codigoBarras || item['Código de Barras'] || item.codigo_barras
        ),
        producto: str(item.producto || item['Producto'] || item.nombre),
        cantidad: num(item.cantidad || item['Cantidad']),
        fechaVencimiento: str(
          item.fechaVencimiento || item['Fecha Vencimiento'] || item.fecha_vencimiento || ''
        ),
        fechaElaboracion: str(
          item.fechaElaboracion || item['Fecha Elaboración'] || item.fecha_elaboracion || ''
        ),
        mesesDuracion: num(
          item.mesesDuracion || item['Meses Duración'] || item.meses_duracion
        ),
        vencimientoFinal: str(
          item.vencimientoFinal ||
            item['Vencimiento Final'] ||
            item.vencimiento_final ||
            item.fechaVencimiento ||
            ''
        ),
        costoNetoUnitario: num(
          item.costoNetoUnitario || item['Costo Neto Unitario'] || item.costo_neto_unitario
        ),
        ivaCredito: num(item.ivaCredito || item['IVA Crédito (19%)'] || item.iva_credito),
        totalFactura: num(item.totalFactura || item['Total Factura Lote'] || item.total_factura),
        estado: str(item.estado || item['Estado'] || 'Activo'),
        linkImagen: convertDriveImageUrl(
          str(item.linkImagen || item['Link de la Imagen'] || item.link_imagen || '')
        ),
      }))
    }
    return []
  } catch (error) {
    console.error('Error fetching inventario:', error)
    return []
  }
}

export async function registrarLote(lote: {
  codigoBarras: string
  producto: string
  cantidad: number
  fechaVencimiento: string
  fechaElaboracion: string
  mesesDuracion: number
  costoNetoUnitario: number
  ivaCredito: number
  totalFactura: number
  linkImagen: string
  tipo: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'registrarLote',
        ...lote,
      }),
    })
    const data = await response.json()
    return {
      success: data.success ?? true,
      message: data.message ?? 'Lote registrado correctamente',
    }
  } catch (error) {
    console.error('Error registrando lote:', error)
    return { success: false, message: 'Error al registrar el lote' }
  }
}

export async function registrarLotesMultiple(lotes: Array<{
  codigoBarras: string
  producto: string
  cantidad: number
  fechaVencimiento: string
  fechaElaboracion: string
  mesesDuracion: number
  costoNetoUnitario: number
  ivaCredito: number
  totalFactura: number
  linkImagen: string
  tipo: string
}>): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'registrarLotesMultiple',
        lotes,
      }),
    })
    const data = await response.json()
    return {
      success: data.success ?? true,
      message: data.message ?? 'Lotes registrados correctamente',
    }
  } catch (error) {
    console.error('Error registrando lotes:', error)
    return { success: false, message: 'Error al registrar los lotes' }
  }
}

export function calcularVencimientoFinal(
  fechaElaboracion: string,
  mesesDuracion: number
): string {
  if (!fechaElaboracion || !mesesDuracion) return ''
  const fecha = new Date(fechaElaboracion + 'T12:00:00')
  fecha.setMonth(fecha.getMonth() + mesesDuracion)
  return fecha.toISOString().split('T')[0]
}

export function diasParaVencer(fechaVencimiento: string): number {
  if (!fechaVencimiento) return 999
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fechaVencimiento + 'T12:00:00')
  venc.setHours(0, 0, 0, 0)
  const diff = venc.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
