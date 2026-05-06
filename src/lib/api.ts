import { DEFAULT_IMAGE } from '@/lib/constants'

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzVoOt1ho2uHnGPzzze9kIIkvxjk5oVh47ZKjUEyUfV-Mqe1XWFONpDeBemtOkpHVKfCw/exec'

export interface Producto {
  nombre: string
  tipo: string
  precioCliente: number
  imagen: string
  mesesDuracion: number
  vencimientoFinal: string
  costoNetoUnitario: number
  ivaCredito: number
  totalFactura: number
  estado: string
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
  producto: string
  cantidad: number
  fechaVencimiento: string
  costoNeto: number
  totalFactura: number
  estado: string
}

export function convertDriveImageUrl(url: string): string {
  if (!url || url.trim() === '') return DEFAULT_IMAGE
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match) {
    return `https://lh3.googleusercontent.com/u/0/d/${match[1]}`
  }
  if (url.includes('lh3.googleusercontent.com') || url.includes('walmartimages') || url.includes('mlstatic') || url.includes('gstatic')) {
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
  if (s.includes('T') && s.includes('Z')) {
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
  const d = new Date(s + 'T12:00:00')
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const parts = s.split(/[-/.\s]/)
  if (parts.length === 3) {
    const combos = [[2, 1, 0], [1, 0, 2], [0, 1, 2]]
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
    if (yearPart) return `${yearPart}-01-01`
  }
  if (parts.length === 1 && Number(parts[0]) >= 2000 && Number(parts[0]) <= 2100) {
    return `${parts[0]}-01-01`
  }
  return s
}

async function readSheet(sheetName: string): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(`${SCRIPT_URL}?sheet=${encodeURIComponent(sheetName)}`, { cache: 'no-store' })
    if (!response.ok) throw new Error(`Error al cargar ${sheetName}`)
    const data = await response.json()
    if (Array.isArray(data) && data.length > 1) {
      const headers = data[0]
      const rows = data.slice(1)
      return rows.map((row) => {
        const obj: Record<string, unknown> = {}
        headers.forEach((h: string, i: number) => { obj[h] = row[i] ?? '' })
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
    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ targetSheet: sheetName, values }) })
    return { success: true, message: 'Guardado correctamente' }
  } catch (error) {
    console.error(`Error escribiendo en ${sheetName}:`, error)
    return { success: false, message: 'Error de conexión' }
  }
}

export async function fetchMaestroProductos(): Promise<Producto[]> {
  const rows = await readSheet('Productos')
  const grouped: Record<string, Producto> = {}
  for (const item of rows) {
    const nombre = str(item['Nombre'])
    if (!nombre) continue
    const key = nombre.toLowerCase().trim()
    if (!grouped[key]) {
      grouped[key] = {
        nombre,
        tipo: str(item['Tipo'] || ''),
        precioCliente: num(item['Precio Cliente'] || 0),
        imagen: convertDriveImageUrl(str(item['Link de la Imagen'] || '')),
        mesesDuracion: num(item['Meses Duración'] || 0),
        vencimientoFinal: parseFlexibleDate(item['Vencimiento Final']),
        costoNetoUnitario: num(item['Costo Neto Unitario'] || 0),
        ivaCredito: num(item['IVA Crédito (19%)'] || 0),
        totalFactura: num(item['Total Factura Lote'] || 0),
        estado: str(item['Estado'] || 'Activo'),
      }
    } else {
      grouped[key].precioCliente = grouped[key].precioCliente || num(item['Precio Cliente'] || 0)
      if (!grouped[key].imagen) grouped[key].imagen = convertDriveImageUrl(str(item['Link de la Imagen'] || ''))
    }
  }
  const inventario = await fetchInventarioLotes()
  for (const lote of inventario) {
    if (lote.estado === 'Eliminado' || lote.cantidad <= 0) continue
    const key = lote.producto.toLowerCase().trim()
    if (!grouped[key]) {
      grouped[key] = {
        nombre: lote.producto,
        tipo: '',
        precioCliente: 0,
        imagen: '',
        mesesDuracion: 0,
        vencimientoFinal: lote.fechaVencimiento,
        costoNetoUnitario: lote.costoNeto,
        ivaCredito: 0,
        totalFactura: lote.totalFactura,
        estado: 'Activo',
      }
    }
  }
  return Object.values(grouped).filter(p => p.nombre && p.estado !== 'Eliminado')
}

export async function fetchCajaDiaria(): Promise<VentaDiaria[]> {
  const rows = await readSheet('Caja_Diaria')
  const grouped: Record<string, { ventaBoleta: number; ventaSinBoleta: number; consumoPropio: number }> = {}
  for (const item of rows) {
    const fechaRaw = item['Fecha']
    let fecha = ''
    if (fechaRaw) {
      const d = new Date(String(fechaRaw))
      if (!isNaN(d.getTime())) fecha = d.toISOString().split('T')[0]
    }
    if (!fecha && typeof fechaRaw === 'string') fecha = fechaRaw.trim()
    if (!fecha) continue
    if (!grouped[fecha]) grouped[fecha] = { ventaBoleta: 0, ventaSinBoleta: 0, consumoPropio: 0 }
    grouped[fecha].ventaBoleta += num(item['Venta con Boleta'])
    grouped[fecha].ventaSinBoleta += num(item['Venta sin Boleta'])
    grouped[fecha].consumoPropio += num(item['Consumo Propio'])
  }
  return Object.entries(grouped).map(([fecha, vals]) => ({
    fecha,
    ventaBoleta: vals.ventaBoleta,
    ventaSinBoleta: vals.ventaSinBoleta,
    consumoPropio: vals.consumoPropio,
    totalDia: vals.ventaBoleta + vals.ventaSinBoleta + vals.consumoPropio,
  }))
}

export async function registrarVentaDiaria(venta: { fecha: string; ventaBoleta: number; ventaSinBoleta: number; consumoPropio: number }): Promise<{ success: boolean; message: string }> {
  const total = venta.ventaBoleta + venta.ventaSinBoleta + venta.consumoPropio
  return writeRow('Caja_Diaria', [venta.fecha, venta.ventaBoleta, venta.ventaSinBoleta, venta.consumoPropio, total])
}

export async function updateCajaDiaria(venta: { fecha: string; ventaBoleta: number; ventaSinBoleta: number; consumoPropio: number }): Promise<{ success: boolean; message: string }> {
  const total = venta.ventaBoleta + venta.ventaSinBoleta + venta.consumoPropio
  return writeRow('Caja_Diaria', [venta.fecha, venta.ventaBoleta, venta.ventaSinBoleta, venta.consumoPropio, total])
}

export async function deleteCajaDiaria(venta: { fecha: string; ventaBoleta: number; ventaSinBoleta: number; consumoPropio: number }): Promise<{ success: boolean; message: string }> {
  const total = -(venta.ventaBoleta + venta.ventaSinBoleta + venta.consumoPropio)
  return writeRow('Caja_Diaria', [venta.fecha, -venta.ventaBoleta, -venta.ventaSinBoleta, -venta.consumoPropio, total])
}

export async function registrarProducto(producto: { nombre: string; tipo: string; precioCliente: number; imagen: string; mesesDuracion?: number; vencimientoFinal?: string; costoNetoUnitario?: number; ivaCredito?: number; totalFactura?: number }): Promise<{ success: boolean; message: string }> {
  return writeRow('Productos', [
    producto.nombre,
    producto.tipo,
    producto.precioCliente,
    producto.imagen,
    producto.mesesDuracion || 0,
    producto.vencimientoFinal || '',
    producto.costoNetoUnitario || 0,
    producto.ivaCredito || 0,
    producto.totalFactura || 0,
    'Activo',
    producto.imagen,
  ])
}

export async function registrarLote(lote: { producto: string; cantidad: number; fechaVencimiento: string; costoNeto: number; totalFactura: number }): Promise<{ success: boolean; message: string }> {
  return writeRow('Inventario', [lote.producto, lote.cantidad, lote.fechaVencimiento, lote.costoNeto, lote.totalFactura, 'Activo'])
}

export async function registrarLotesMultiple(lotes: Array<{ producto: string; cantidad: number; fechaVencimiento: string; costoNeto: number; totalFactura: number }>): Promise<{ success: boolean; message: string; totalFactura: number }> {
  let totalFactura = 0
  for (const lote of lotes) {
    await registrarLote(lote)
    totalFactura += lote.totalFactura
  }
  return { success: true, message: `${lotes.length} productos registrados`, totalFactura }
}

export async function eliminarLote(producto: string, fechaVencimiento: string, cantidad: number = 1): Promise<{ success: boolean; message: string }> {
  return writeRow('Inventario', [producto, -cantidad, fechaVencimiento, 0, 0, 'Eliminado'])
}

export async function actualizarCantidadLote(producto: string, fechaVencimiento: string, nuevaCantidad: number): Promise<{ success: boolean; message: string }> {
  if (nuevaCantidad <= 0) {
    return writeRow('Inventario', [producto, 0, fechaVencimiento, 0, 0, 'Eliminado'])
  }
  return writeRow('Inventario', [producto, nuevaCantidad, fechaVencimiento, 0, 0, 'Activo'])
}

export async function registrarProductoCompleto(datos: { nombre: string; tipo: string; precioCliente: number; imagen: string; cantidad: number; fechaVencimiento: string; costoNetoUnitario: number; ivaCredito: number; totalFactura: number; mesesDuracion: number }): Promise<{ success: boolean; message: string }> {
  await registrarProducto({
    nombre: datos.nombre,
    tipo: datos.tipo,
    precioCliente: datos.precioCliente,
    imagen: datos.imagen,
    mesesDuracion: datos.mesesDuracion,
    vencimientoFinal: datos.fechaVencimiento,
    costoNetoUnitario: datos.costoNetoUnitario,
    ivaCredito: datos.ivaCredito,
    totalFactura: datos.totalFactura,
  })
  if (datos.cantidad > 0 && datos.fechaVencimiento) {
    await registrarLote({
      producto: datos.nombre,
      cantidad: datos.cantidad,
      fechaVencimiento: datos.fechaVencimiento,
      costoNeto: datos.costoNetoUnitario,
      totalFactura: datos.totalFactura,
    })
  }
  return { success: true, message: 'Producto registrado en catálogo e inventario' }
}

export async function actualizarInversion(monto: number): Promise<{ success: boolean; message: string }> {
  const rows = await readSheet('Dashboard')
  const current = rows.length > 0 ? num(rows[0]['inversión'] || rows[0]['inversión'] || 0) : 0
  const nuevaInversion = current + monto
  return writeRow('Dashboard', ['', nuevaInversion, Math.round(nuevaInversion * 1.2), num(rows[0]?.['venta real'] || rows[0]?.['venta real'] || 0), 0])
}

export async function fetchPanelPapa(): Promise<PanelPapa | null> {
  const rows = await readSheet('Dashboard')
  if (rows.length === 0) return null
  const d = rows[0]
  return {
    mesActual: str(d['Métricas'] || d['mesActual'] || ''),
    inversionTotal: num(d['inversión'] || d['inversionTotal'] || 0),
    metaVenta: num(d['meta'] || d['metaVenta'] || 0),
    ventaReal: num(d['venta real'] || d['ventaReal'] || 0),
    diferencia: num(d['diferencia'] || d['diferencia'] || 0),
  }
}

export async function fetchInventarioLotes(): Promise<LoteInventario[]> {
  const rows = await readSheet('Inventario')
  const grouped: Record<string, LoteInventario> = {}
  for (const item of rows) {
    const producto = str(item['producto'])
    if (!producto) continue
    const fechaVencimiento = parseFlexibleDate(item['fecha vencimiento'])
    const key = `${producto.toLowerCase().trim()}|${fechaVencimiento}`
    if (!grouped[key]) {
      grouped[key] = {
        producto,
        cantidad: 0,
        fechaVencimiento,
        costoNeto: num(item['costo neto'] || 0),
        totalFactura: num(item['total factura'] || 0),
        estado: str(item['estado'] || 'Activo'),
      }
    }
    const estado = str(item['estado'] || 'Activo')
    const cantidad = num(item['cantidad'])
    if (estado === 'Eliminado' && cantidad <= 0) {
      grouped[key].estado = 'Eliminado'
    } else if (estado === 'Eliminado') {
      grouped[key].cantidad -= Math.abs(cantidad)
      if (grouped[key].cantidad <= 0) grouped[key].estado = 'Eliminado'
    } else {
      grouped[key].cantidad += cantidad
    }
  }
  return Object.values(grouped).filter(l => l.producto && l.estado !== 'Eliminado' && l.cantidad > 0)
}

export function calcularVencimientoFinal(fechaElaboracion: string, mesesDuracion: number): string {
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
  return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}
