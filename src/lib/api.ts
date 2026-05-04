import { DEFAULT_IMAGE } from '@/lib/constants'

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzVoOt1ho2uHnGPzzze9kIIkvxjk5oVh47ZKjUEyUfV-Mqe1XWFONpDeBemtOkpHVKfCw/exec'

export interface Producto {
  codigoBarras: string
  nombre: string
  categoria: string
  mesesDuracionEstandar: number
  precioCliente: number
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

function parseFlexibleDate(raw: unknown): string {
  if (!raw) return ''
  
  // Handle Date objects from Sheets
  if (raw instanceof Date) {
    const d = raw as Date
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const s = String(raw).trim()
  if (!s) return ''

  // Handle ISO format like "2026-06-08T04:00:00.000Z"
  if (s.includes('T') && s.includes('Z')) {
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  // Try standard ISO first
  const d = new Date(s + 'T12:00:00')
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parts = s.split(/[-/.\s]/)
  
  if (parts.length === 3) {
    const combos = [
      [2, 1, 0],  // DD-MM-YYYY (most common in Chile)
      [1, 0, 2],  // MM-DD-YYYY
      [0, 1, 2],  // YYYY-MM-DD
    ]
    for (const [di, mi, yi] of combos) {
      let day = Number(parts[di])
      let month = Number(parts[mi])
      let year = Number(parts[yi])
      if (year < 100) year += 2000
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        const test = new Date(year, month - 1, day)
        if (!isNaN(test.getTime()) && test.getMonth() === month - 1 && test.getDate() === day) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }
      }
    }
  }
  
  if (parts.length === 2) {
    const yearPart = parts.find(p => p.length === 4 && Number(p) >= 2000 && Number(p) <= 2100)
    if (yearPart) {
      return `${yearPart}-01-01`
    }
  }
  
  if (parts.length === 1 && Number(parts[0]) >= 2000 && Number(parts[0]) <= 2100) {
    return `${parts[0]}-01-01`
  }
  
  return s
}

async function readSheet(sheetName: string): Promise<Record<string, unknown>[]> {
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
      mode: 'no-cors',
      body: JSON.stringify({ targetSheet: sheetName, values }),
    })
    return { success: true, message: 'Guardado correctamente' }
  } catch (error) {
    console.error(`Error escribiendo en ${sheetName}:`, error)
    return { success: false, message: 'Error de conexión' }
  }
}

export async function fetchMaestroProductos(): Promise<Producto[]> {
  const rows = await readSheet('Maestro_Productos')
  
  if (rows.length === 0) return []
  
  const firstRow = rows[0]
  const keys = Object.keys(firstRow)
  
  // Try to find columns by name or position
  const findColumn = (names: string[], fallbackIndex: number): unknown => {
    for (const name of names) {
      if (firstRow[name] !== undefined) return firstRow[name]
    }
    // Fallback to index
    const values = Object.values(firstRow)
    if (values.length > fallbackIndex) return values[fallbackIndex]
    return undefined
  }
  
  return rows.map((item) => {
    const values = Object.values(item)
    return {
      codigoBarras: str(item['Código de Barras'] || values[0] || ''),
      nombre: str(item['Nombre del Producto'] || values[1] || ''),
      categoria: str(item['Categoría'] || values[2] || 'Sin categoría'),
      mesesDuracionEstandar: num(item['Meses Duración Estándar'] || values[3] || 0),
      precioCliente: num(item['Precio al Cliente'] || values[4] || 0),
      imagen: convertDriveImageUrl(str(item['Link de la Imagen'] || values[5] || '')),
    }
  }).filter((p) => p.nombre)
}

export async function fetchCajaDiaria(): Promise<VentaDiaria[]> {
  const rows = await readSheet('Caja_Diaria')
  return rows.map((item) => {
    const fechaRaw = item['Fecha']
    let fecha = ''
    if (fechaRaw) {
      const d = new Date(String(fechaRaw))
      if (!isNaN(d.getTime())) {
        fecha = d.toISOString().split('T')[0]
      }
    }
    if (!fecha && typeof fechaRaw === 'string') fecha = fechaRaw.trim()
    
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

export async function registrarProducto(producto: {
  codigoBarras: string
  nombre: string
  categoria: string
  precioCliente: number
  imagen: string
}): Promise<{ success: boolean; message: string }> {
  return writeRow('Maestro_Productos', [
    producto.codigoBarras,
    producto.nombre,
    producto.categoria,
    0,
    producto.precioCliente,
    producto.imagen,
  ])
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
    const fechaVencimiento = parseFlexibleDate(item['Fecha Vencimiento'])
    const fechaElaboracion = parseFlexibleDate(item['Fecha Elaboración'])
    const vencimientoFinal = item['Vencimiento Final'] instanceof Date
      ? (item['Vencimiento Final'] as Date).toISOString().split('T')[0]
      : parseFlexibleDate(item['Vencimiento Final'] || item['Fecha Vencimiento'])

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
  // Orden según columnas: Código de Barras|Producto|Cantidad|Fecha Vencimiento|Fecha Elaboración|Meses Duración|Vencimiento Final|Costo Neto Unitario|IVA Crédito (19%)|Total Factura Lote|Estado|Link de la Imagen
  return writeRow('Inventario_Lotes', [
    lote.codigoBarras,      // 1: Código de Barras
    lote.producto,            // 2: Producto
    lote.cantidad,            // 3: Cantidad
    lote.fechaVencimiento,    // 4: Fecha Vencimiento
    lote.fechaElaboracion,    // 5: Fecha Elaboración
    lote.mesesDuracion,       // 6: Meses Duración
    lote.fechaVencimiento,    // 7: Vencimiento Final (igual a Fecha Vencimiento)
    lote.costoNetoUnitario,   // 8: Costo Neto Unitario
    lote.ivaCredito,         // 9: IVA Crédito (19%)
    lote.totalFactura,        // 10: Total Factura Lote
    'Activo',                 // 11: Estado
    lote.linkImagen,         // 12: Link de la Imagen
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
