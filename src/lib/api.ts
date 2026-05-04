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
  tipo: string
  detalle: string
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

async function readSheet(sheetName: string): Promise<unknown[][]> {
  try {
    const response = await fetch(`${SCRIPT_URL}?sheet=${encodeURIComponent(sheetName)}`, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Error al cargar ${sheetName}`)
    const data = await response.json()
    if (Array.isArray(data) && data.length > 1) {
      const headers = data[0]
      const rows = data.slice(1)
      return rows.map((row) => {
        const obj: Record<string, unknown> = {}
        headers.forEach((h: string, i: number) => {
          obj[h] = row[i] ?? ''
        })
        return obj
      })
    }
    return []
  } catch (error) {
    console.error(`Error leyendo hoja ${sheetName}:`, error)
    return []
  }
}

async function writeRow(sheetName: string, values: unknown[]): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ targetSheet: sheetName, values }),
    })
    const text = await response.text()
    return { success: response.ok, message: text }
  } catch (error) {
    console.error(`Error escribiendo en ${sheetName}:`, error)
    return { success: false, message: 'Error de conexión' }
  }
}

export async function fetchMaestroProductos(): Promise<Producto[]> {
  const rows = await readSheet('Maestro_Productos')
  return rows.map((item) => ({
    codigoBarras: str(item['Código de Barras'] || item.id || ''),
    nombre: str(item['Nombre del Producto'] || item.nombre || ''),
    categoria: str(item['Categoría'] || 'Sin categoría'),
    mesesDuracionEstandar: num(item['Meses Duración Estándar']),
    imagen: convertDriveImageUrl(str(item['Link de la Imagen'] || '')),
  }))
}

export async function fetchCajaDiaria(): Promise<VentaDiaria[]> {
  const rows = await readSheet('Caja_Diaria')
  return rows.map((item) => {
    const fechaRaw = item['Fecha']
    let fecha = ''
    if (fechaRaw instanceof Date) {
      fecha = fechaRaw.toISOString().split('T')[0]
    } else if (typeof fechaRaw === 'string') {
      fecha = fechaRaw
    }
    const vb = num(item['Venta con Boleta'])
    const vsb = num(item['Venta sin Boleta'])
    const cp = num(item['Consumo Propio'])
    return {
      fecha,
      ventaBoleta: vb,
      ventaSinBoleta: vsb,
      consumoPropio: cp,
      totalDia: vb + vsb + cp,
    }
  }).filter((v) => v.fecha)
}

export async function registrarVentaDiaria(venta: {
  fecha: string
  ventaBoleta: number
  ventaSinBoleta: number
  consumoPropio: number
}): Promise<{ success: boolean; message: string }> {
  const total = venta.ventaBoleta + venta.ventaSinBoleta + venta.consumoPropio
  return writeRow('Caja_Diaria', [
    venta.fecha,
    venta.ventaBoleta,
    venta.ventaSinBoleta,
    venta.consumoPropio,
    total,
  ])
}

export async function updateCajaDiaria(venta: {
  fecha: string
  ventaBoleta: number
  ventaSinBoleta: number
  consumoPropio: number
}): Promise<{ success: boolean; message: string }> {
  const total = venta.ventaBoleta + venta.ventaSinBoleta + venta.consumoPropio
  return writeRow('Caja_Diaria', [
    venta.fecha,
    venta.ventaBoleta,
    venta.ventaSinBoleta,
    venta.consumoPropio,
    total,
  ])
}

export async function deleteCajaDiaria(_fecha: string): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'Eliminar requiere Apps Script con lógica de borrado. Por ahora, edita y pon todo en 0.' }
}

export async function fetchPanelPapa(): Promise<PanelPapa | null> {
  const rows = await readSheet('Panel_Papa')
  if (rows.length === 0) return null
  const d = rows[0]
  return {
    mesActual: str(d['MES ACTUAL'] || ''),
    inversionTotal: num(d['INVERSIÓN TOTAL (Facturas + IVA)']),
    metaVenta: num(d['META DE VENTA (1.2x)']),
    ventaReal: num(d['VENTA REAL ACUMULADA']),
    diferencia: num(d['DIFERENCIA / UTILIDAD']),
  }
}

export async function fetchInventarioLotes(): Promise<LoteInventario[]> {
  const rows = await readSheet('Inventario_Lotes')
  return rows.map((item) => {
    const fechaVencimiento = item['Fecha Vencimiento'] instanceof Date
      ? (item['Fecha Vencimiento'] as Date).toISOString().split('T')[0]
      : str(item['Fecha Vencimiento'])
    const fechaElaboracion = item['Fecha Elaboración'] instanceof Date
      ? (item['Fecha Elaboración'] as Date).toISOString().split('T')[0]
      : str(item['Fecha Elaboración'])
    const vencimientoFinal = item['Vencimiento Final'] instanceof Date
      ? (item['Vencimiento Final'] as Date).toISOString().split('T')[0]
      : (item['Fecha Vencimiento'] instanceof Date
        ? (item['Fecha Vencimiento'] as Date).toISOString().split('T')[0]
        : str(item['Vencimiento Final'] || item['Fecha Vencimiento']))

    return {
      codigoBarras: str(item['Código de Barras']),
      producto: str(item['Producto']),
      tipo: str(item['Tipo'] || item['Categoría'] || ''),
      detalle: str(item['Detalle'] || ''),
      cantidad: num(item['Cantidad']),
      fechaVencimiento,
      fechaElaboracion,
      mesesDuracion: num(item['Meses Duración']),
      vencimientoFinal,
      costoNetoUnitario: num(item['Costo Neto Unitario']),
      ivaCredito: num(item['IVA Crédito (19%)']),
      totalFactura: num(item['Total Factura Lote']),
      estado: str(item['Estado'] || 'Activo'),
      linkImagen: convertDriveImageUrl(str(item['Link de la Imagen'])),
    }
  }).filter((l) => l.producto)
}

export async function registrarLote(lote: {
  codigoBarras: string
  producto: string
  tipo: string
  detalle: string
  cantidad: number
  fechaVencimiento: string
  fechaElaboracion: string
  mesesDuracion: number
  costoNetoUnitario: number
  ivaCredito: number
  totalFactura: number
  linkImagen: string
}): Promise<{ success: boolean; message: string }> {
  return writeRow('Inventario_Lotes', [
    lote.codigoBarras,
    lote.producto,
    lote.cantidad,
    lote.fechaVencimiento,
    lote.fechaElaboracion,
    lote.mesesDuracion,
    lote.fechaVencimiento,
    lote.costoNetoUnitario,
    lote.ivaCredito,
    lote.totalFactura,
    'Activo',
    lote.linkImagen,
  ])
}

export async function registrarLotesMultiple(lotes: Array<{
  codigoBarras: string
  producto: string
  tipo: string
  detalle: string
  cantidad: number
  fechaVencimiento: string
  fechaElaboracion: string
  mesesDuracion: number
  costoNetoUnitario: number
  ivaCredito: number
  totalFactura: number
  linkImagen: string
}>): Promise<{ success: boolean; message: string }> {
  for (const lote of lotes) {
    await registrarLote(lote)
  }
  return { success: true, message: `${lotes.length} productos registrados` }
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
