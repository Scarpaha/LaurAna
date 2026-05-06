'use client'

import { useState, useEffect } from 'react'
import {
  registrarLote,
  registrarLotesMultiple,
  registrarProducto,
  calcularVencimientoFinal,
} from '@/lib/api'
import {
  Package,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Printer,
} from 'lucide-react'

type AdminTab = 'individual' | 'factura'
type PriceMode = 'neto' | 'total'
type DateMode = 'fecha' | 'calcular' | 'anio'

interface LoteItem {
  id: string
  codigoBarras: string
  producto: string
  tipo: string
  detalle: string
  cantidad: number
  fechaVencimiento: string
  fechaElaboracion: string
  mesesDuracion: number
  anioVencimiento: string
  dateMode: DateMode
  precioUnitario: number
  priceMode: PriceMode
  linkImagen: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('individual')
  // Cascading date picker parts for vencimiento (days -> months -> years)
  const [dateParts, setDateParts] = useState({ day: '1', month: '01', year: String(new Date().getFullYear()) })
  // Sync initial parts from existing fecha if present
  useEffect(() => {
    // No-op if no existing date
  }, [])
  const [eliminarCodigo, setEliminarCodigo] = useState('')
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">
          Productos
        </h1>
        <p className="font-slogan text-lavanda text-lg">
          Ingreso de productos y facturas
        </p>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-md print:hidden">
        <button
          onClick={() => setActiveTab('individual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'individual'
              ? 'bg-rosa-intenso text-white shadow-md'
              : 'text-carbon hover:bg-lavanda/20'
          }`}
        >
          <Package className="w-5 h-5" />
          Individual
        </button>
        <button
          onClick={() => setActiveTab('factura')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'factura'
              ? 'bg-rosa-intenso text-white shadow-md'
              : 'text-carbon hover:bg-lavanda/20'
          }`}
        >
          <FileText className="w-5 h-5" />
          Por Factura
        </button>
      </div>

      {activeTab === 'individual' && <FormularioIndividual />}
      {activeTab === 'factura' && <FormularioFactura />}

      <section className="card border-2 border-gray-200 p-4 sm:p-6 bg-white print:hidden">
        <h3 className="text-xl font-bold mb-2">Eliminar Producto (soft)</h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={eliminarCodigo}
            onChange={(e) => setEliminarCodigo(e.target.value)}
            placeholder="Código de Barras"
            className="input-field flex-1"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={async () => {
              if (!eliminarCodigo.trim()) return
              const api = await import('@/lib/api')
              const { eliminarProducto } = api
              const { success, message } = await eliminarProducto(eliminarCodigo.trim())
              setDeleteStatus(message || (success ? 'Eliminación registrada' : 'Error'))
              // Limpiar código solo si se eliminó con éxito
              if (success) setEliminarCodigo('')
            }}
          >
            Eliminar
          </button>
        </div>
        {deleteStatus && <p className="text-sm text-gray-600 mt-2">{deleteStatus}</p>}
      </section>
    </div>
  )
}

const TIPOS_PRODUCTO = [
  'Lácteos', 'Carnes', 'Embutidos', 'Panes', 'Bebidas',
  'Snacks', 'Aseo', 'Verduras', 'Frutas', 'Enlatados',
  'Congelados', 'Endulzantes', 'Aceites', 'Harinas', 'Especias', 'Otro',
]

function calcTotals(precio: number, cantidad: number, mode: PriceMode) {
  if (mode === 'neto') {
    const neto = precio * cantidad
    const iva = Math.round(neto * 0.19)
    return { neto, iva, total: neto + iva, netoUnitario: precio }
  }
  const total = precio * cantidad
  const neto = Math.round(total / 1.19)
  const iva = total - neto
  return { neto, iva, total, netoUnitario: neto / cantidad }
}

function FormularioIndividual() {
  const [fechaParts, setFechaParts] = useState({ day: '1', month: '01', year: String(new Date().getFullYear()) })
  const [form, setForm] = useState({
    codigoBarras: '',
    tipo: '',
    producto: '',
    detalle: '',
    cantidad: 1,
    precioUnitario: '',
    precioCliente: '',
    priceMode: 'neto' as PriceMode,
    linkImagen: '',
  })
  const [vencimiento, setVencimiento] = useState({
    modo: 'fecha' as DateMode,
    fechaVencimiento: '',
    fechaElaboracion: '',
    mesesDuracion: 6,
    anioVencimiento: '',
  })
  const [calculatedDate, setCalculatedDate] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const price = Number(form.precioUnitario || 0)
  const totals = calcTotals(price, form.cantidad, form.priceMode)

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
    return dateStr
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.producto || !form.tipo || price <= 0) return

    let fechaVencimiento = ''
    if (vencimiento.modo === 'fecha') {
      fechaVencimiento = vencimiento.fechaVencimiento
    } else if (vencimiento.modo === 'calcular') {
      fechaVencimiento = calculatedDate
    } else if (vencimiento.modo === 'anio') {
      const y = vencimiento.anioVencimiento
      fechaVencimiento = y ? `${y}-12-31` : ''
    }

    const precioCliente = Number(form.precioCliente || 0)

    const prodResult = await registrarProducto({
      codigoBarras: form.codigoBarras || '',
      nombre: form.producto,
      categoria: form.tipo,
      precioCliente: precioCliente || price,
      imagen: form.linkImagen,
    })

    // No registramos en Inventario_Lotes para ingresos individuales (stock existente)
    // Solo registramos en Maestro_Productos para el catálogo
    // Si necesitas registrar el lote físico, usa "Por Factura" en lugar de "Individual"

    setStatus(prodResult.success ? 'success' : 'error')
    setMessage(prodResult.message)

    if (prodResult.success) {
      setForm({
        codigoBarras: '',
        tipo: '',
        producto: '',
        detalle: '',
        cantidad: 1,
        precioUnitario: '',
        precioCliente: '',
        priceMode: 'neto',
        linkImagen: '',
      })
      setVencimiento({ modo: 'fecha', fechaVencimiento: '', fechaElaboracion: '', mesesDuracion: 6, anioVencimiento: '' })
      setCalculatedDate('')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="card space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Package className="w-7 h-7 text-rosa-intenso" />
        Ingreso Individual
      </h2>

      {status === 'success' && (
        <div className="p-4 bg-green-100 border border-exito rounded-xl flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-exito" />
          <span className="font-semibold text-green-800">{message}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="p-4 bg-red-100 border border-error rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-error" />
          <span className="font-semibold text-red-800">{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-field">Código de Barras (opcional)</label>
          <input
            type="text"
            value={form.codigoBarras}
            onChange={(e) => setForm((p) => ({ ...p, codigoBarras: e.target.value }))}
            className="input-field"
            placeholder="8400000000000"
          />
        </div>

        <div>
          <label className="label-field">Tipo de Producto *</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
            className="input-field"
            required
          >
            <option value="">Seleccionar tipo...</option>
            {TIPOS_PRODUCTO.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field">Nombre del Producto *</label>
          <input
            type="text"
            value={form.producto}
            onChange={(e) => setForm((p) => ({ ...p, producto: e.target.value }))}
            className="input-field"
            placeholder="Ej: Vienesa Frankfurt"
            required
          />
        </div>

        <div>
          <label className="label-field">Detalle Extra (opcional)</label>
          <input
            type="text"
            value={form.detalle}
            onChange={(e) => setForm((p) => ({ ...p, detalle: e.target.value }))}
            className="input-field"
            placeholder="Ej: Marca Super, Pack x10..."
          />
        </div>

        <div>
          <label className="label-field">Cantidad *</label>
          <input
            type="number"
            min="1"
            value={form.cantidad}
            onChange={(e) => setForm((p) => ({ ...p, cantidad: Number(e.target.value) }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label-field">Modo de Precio</label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, priceMode: 'neto' }))}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                form.priceMode === 'neto'
                  ? 'bg-rosa-intenso text-white'
                  : 'bg-white border-2 border-lavanda'
              }`}
            >
              Valor Neto
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, priceMode: 'total' }))}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                form.priceMode === 'total'
                  ? 'bg-rosa-intenso text-white'
                  : 'bg-white border-2 border-lavanda'
              }`}
            >
              Valor Total (con IVA)
            </button>
          </div>
          <label className="label-field">
            {form.priceMode === 'neto' ? 'Costo Neto Unitario ($)' : 'Precio Total Unitario ($)'}
          </label>
          <input
            type="number"
            min="0"
            value={form.precioUnitario}
            onChange={(e) => setForm((p) => ({ ...p, precioUnitario: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label-field">Precio al Cliente ($) *</label>
          <input
            type="number"
            min="0"
            value={form.precioCliente}
            onChange={(e) => setForm((p) => ({ ...p, precioCliente: e.target.value }))}
            className="input-field"
            placeholder="Precio de venta al público"
            required
          />
        </div>

        <div className="card bg-lavanda/10 border-2 border-lavanda">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl">
              <p className="text-sm text-gray-500">Neto</p>
              <p className="text-xl font-bold text-lavanda">${totals.neto.toLocaleString('es-CL')}</p>
            </div>
            <div className="p-3 bg-white rounded-xl">
              <p className="text-sm text-gray-500">IVA (19%)</p>
              <p className="text-xl font-bold text-lavanda">${totals.iva.toLocaleString('es-CL')}</p>
            </div>
            <div className="p-3 bg-rosa-intenso/10 rounded-xl">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-rosa-intenso">${totals.total.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="label-field">Link de Imagen (opcional)</label>
          <input
            type="url"
            value={form.linkImagen}
            onChange={(e) => setForm((p) => ({ ...p, linkImagen: e.target.value }))}
            className="input-field"
            placeholder="https://drive.google.com/file/d/..."
          />
        </div>

        <div className="card bg-pastel border-2 border-pink-200">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Fecha de Vencimiento
          </h3>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setVencimiento((p) => ({ ...p, modo: 'fecha' }))}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all text-sm ${
                vencimiento.modo === 'fecha'
                  ? 'bg-rosa-intenso text-white'
                  : 'bg-white border-2 border-lavanda'
              }`}
            >
              Fecha exacta
            </button>
            <button
              type="button"
              onClick={() => setVencimiento((p) => ({ ...p, modo: 'calcular' }))}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all text-sm ${
                vencimiento.modo === 'calcular'
                  ? 'bg-rosa-intenso text-white'
                  : 'bg-white border-2 border-lavanda'
              }`}
            >
              Calcular
            </button>
            <button
              type="button"
              onClick={() => setVencimiento((p) => ({ ...p, modo: 'anio' }))}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all text-sm ${
                vencimiento.modo === 'anio'
                  ? 'bg-rosa-intenso text-white'
                  : 'bg-white border-2 border-lavanda'
              }`}
            >
              Solo año
            </button>
          </div>

          {vencimiento.modo === 'fecha' && (
            <div>
              <label className="label-field">Fecha de Vencimiento</label>
              <div className="flex gap-2">
                <select value={fechaParts.day} onChange={(e)=>{ setFechaParts(p => ({ ...p, day: e.target.value })); setVencimiento((pp)=>({ ...pp, fechaVencimiento: `${fechaParts.year}-${fechaParts.month}-${e.target.value}` })); }} className="input-field">
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>
                  ))}
                </select>
                <select value={fechaParts.month} onChange={(e)=>{ setFechaParts(p => ({ ...p, month: e.target.value })); setVencimiento((pp)=>({ ...pp, fechaVencimiento: `${fechaParts.year}-${e.target.value}-${fechaParts.day}` })); }} className="input-field">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>
                  ))}
                </select>
                <select value={fechaParts.year} onChange={(e)=>{ setFechaParts(p => ({ ...p, year: e.target.value })); setVencimiento((pp)=>({ ...pp, fechaVencimiento: `${e.target.value}-${fechaParts.month}-${fechaParts.day}` })); }} className="input-field">
                  {Array.from({ length: 12 }, (_, i) => {
                    const y = Number(new Date().getFullYear()) - 0 + i
                    return <option key={y} value={String(y)}>{y}</option>
                  })}
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">Fecha seleccionada: {fechaParts.year}-{fechaParts.month}-{fechaParts.day}</p>
            </div>
          )}

          {vencimiento.modo === 'anio' && (
            <div>
              <label className="label-field">Año de Vencimiento</label>
              <input
                type="number"
                min="2024"
                max="2035"
                value={vencimiento.anioVencimiento}
                onChange={(e) => setVencimiento((p) => ({ ...p, anioVencimiento: e.target.value }))}
                className="input-field"
                placeholder="Ej: 2028"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Ideal para conservas y productos de larga duración</p>
            </div>
          )}

          {vencimiento.modo === 'calcular' && (
            <div className="space-y-3">
              <div>
                <label className="label-field">Fecha de Elaboración</label>
                <input
                  type="date"
                  value={vencimiento.fechaElaboracion}
                  onChange={(e) => setVencimiento((p) => ({ ...p, fechaElaboracion: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label-field">
                  Duración: {vencimiento.mesesDuracion} meses
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={vencimiento.mesesDuracion}
                  onChange={(e) => setVencimiento((p) => ({ ...p, mesesDuracion: Number(e.target.value) }))}
                  className="w-full accent-rosa-intenso"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setCalculatedDate(
                    calcularVencimientoFinal(vencimiento.fechaElaboracion, vencimiento.mesesDuracion)
                  )
                }
                className="btn-secondary w-full"
              >
                Calcular Vencimiento
              </button>
              {calculatedDate && (
                <div className="card bg-white border-2 border-rosa-intenso text-center">
                  <p className="text-sm text-gray-500">Consumir antes de:</p>
                  <p className="text-2xl font-extrabold text-rosa-intenso">
                    {new Date(calculatedDate + 'T12:00:00').toLocaleDateString('es-CL', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary w-full py-5 text-xl">
          Registrar Producto
        </button>
      </form>
    </div>
  )
}

function FormularioFactura() {
  const [items, setItems] = useState<LoteItem[]>([
    {
      id: '1', codigoBarras: '', producto: '', tipo: '', detalle: '',
      cantidad: 1, fechaVencimiento: '', fechaElaboracion: '', mesesDuracion: 6,
      anioVencimiento: '', dateMode: 'fecha',
      precioUnitario: 0, priceMode: 'neto', linkImagen: '',
    },
  ])
  const [vencimientoModo, setVencimientoModo] = useState<'igual' | 'individual'>('igual')
  const [vencimientoIgual, setVencimientoIgual] = useState({
    modo: 'fecha' as 'fecha' | 'calcular',
    fechaVencimiento: '',
    fechaElaboracion: '',
    mesesDuracion: 6,
  })
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const updateItem = (id: string, field: keyof LoteItem, value: unknown) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  const addItem = () => {
    setItems((p) => [
      ...p,
      {
        id: Date.now().toString(), codigoBarras: '', producto: '', tipo: '', detalle: '',
        cantidad: 1, fechaVencimiento: '', fechaElaboracion: '', mesesDuracion: 6,
        anioVencimiento: '', dateMode: 'fecha',
        precioUnitario: 0, priceMode: 'neto', linkImagen: '',
      },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((p) => p.filter((i) => i.id !== id))
  }

  const granTotal = items.reduce((sum, item) => {
    const t = calcTotals(item.precioUnitario, item.cantidad, item.priceMode)
    return sum + t.total
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const valid = items.filter((i) => i.producto && i.tipo && i.precioUnitario > 0)
    if (valid.length === 0) return

    const lotes = valid.map((item) => {
      let fechaVencimiento = ''
      let fechaElaboracion = ''
      let mesesDuracion = 0
      if (vencimientoModo === 'igual') {
        if (vencimientoIgual.modo === 'fecha') {
          fechaVencimiento = vencimientoIgual.fechaVencimiento
        } else {
          fechaElaboracion = vencimientoIgual.fechaElaboracion
          mesesDuracion = vencimientoIgual.mesesDuracion
          fechaVencimiento = calcularVencimientoFinal(fechaElaboracion, mesesDuracion)
        }
      } else {
        fechaVencimiento = item.fechaVencimiento
        fechaElaboracion = item.fechaElaboracion
        mesesDuracion = item.mesesDuracion
      }
      const t = calcTotals(item.precioUnitario, item.cantidad, item.priceMode)
      return {
        codigoBarras: item.codigoBarras || '',
        producto: item.producto,
        tipo: item.tipo,
        detalle: item.detalle,
        cantidad: item.cantidad,
        fechaVencimiento,
        fechaElaboracion,
        mesesDuracion,
        costoNetoUnitario: t.netoUnitario,
        ivaCredito: t.iva,
        totalFactura: t.total,
        linkImagen: item.linkImagen,
      }
    })

    const result = await registrarLotesMultiple(lotes)
    setStatus(result.success ? 'success' : 'error')
    setMessage(result.message)
    if (result.success) {
      setItems([
        {
          id: '1', codigoBarras: '', producto: '', tipo: '', detalle: '',
          cantidad: 1, fechaVencimiento: '', fechaElaboracion: '', mesesDuracion: 6,
          anioVencimiento: '', dateMode: 'fecha',
          precioUnitario: 0, priceMode: 'neto', linkImagen: '',
        },
      ])
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="card space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-7 h-7 text-rosa-intenso" />
          Ingreso por Factura
        </h2>
        <button type="button" onClick={() => window.print()} className="btn-secondary flex items-center gap-2 print:hidden">
          <Printer className="w-5 h-5" />
          Imprimir
        </button>
      </div>

      {status === 'success' && (
        <div className="p-4 bg-green-100 border border-exito rounded-xl flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-exito" />
          <span className="font-semibold text-green-800">{message}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="p-4 bg-red-100 border border-error rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-error" />
          <span className="font-semibold text-red-800">{message}</span>
        </div>
      )}

      <div className="print:hidden">
        <label className="label-field">¿Los productos vencen igual?</label>
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setVencimientoModo('igual')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${vencimientoModo === 'igual' ? 'bg-rosa-intenso text-white' : 'bg-white border-2 border-lavanda'}`}>
            Todos la misma fecha
          </button>
          <button type="button" onClick={() => setVencimientoModo('individual')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${vencimientoModo === 'individual' ? 'bg-rosa-intenso text-white' : 'bg-white border-2 border-lavanda'}`}>
            Cada uno distinto
          </button>
        </div>
      </div>

      {vencimientoModo === 'igual' && vencimientoIgual.modo === 'fecha' ? null : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {items.map((item, idx) => {
          const t = calcTotals(item.precioUnitario, item.cantidad, item.priceMode)
          return (
            <div key={item.id} className="card border-2 border-gray-200 print:border print:shadow-none">
              <div className="flex items-center justify-between mb-3 print:hidden">
                <span className="font-bold text-lg">Producto {idx + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-error hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Tipo *</label>
                  <select
                    value={item.tipo}
                    onChange={(e) => updateItem(item.id, 'tipo', e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {TIPOS_PRODUCTO.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Nombre *</label>
                  <input type="text" value={item.producto} onChange={(e) => updateItem(item.id, 'producto', e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label className="label-field">Detalle (opcional)</label>
                  <input type="text" value={item.detalle} onChange={(e) => updateItem(item.id, 'detalle', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Cantidad *</label>
                  <input type="number" min="1" value={item.cantidad} onChange={(e) => updateItem(item.id, 'cantidad', Number(e.target.value))} className="input-field" required />
                </div>
                <div>
                  <label className="label-field">Modo de Precio</label>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => updateItem(item.id, 'priceMode', 'neto')}
                      className={`flex-1 py-1 rounded text-sm font-semibold ${item.priceMode === 'neto' ? 'bg-rosa-intenso text-white' : 'border border-lavanda'}`}>
                      Neto
                    </button>
                    <button type="button" onClick={() => updateItem(item.id, 'priceMode', 'total')}
                      className={`flex-1 py-1 rounded text-sm font-semibold ${item.priceMode === 'total' ? 'bg-rosa-intenso text-white' : 'border border-lavanda'}`}>
                      Total
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label-field">Precio {item.priceMode === 'neto' ? 'Neto' : 'Total'} Unitario *</label>
                  <input type="number" min="0" value={item.precioUnitario || ''} onChange={(e) => updateItem(item.id, 'precioUnitario', Number(e.target.value))} className="input-field" required />
                </div>
                <div className="md:col-span-2 p-3 bg-lavanda/10 rounded-xl">
                  <p className="text-sm text-gray-500">Neto: ${t.neto.toLocaleString('es-CL')} | IVA: ${t.iva.toLocaleString('es-CL')} | <strong>Total: ${t.total.toLocaleString('es-CL')}</strong></p>
                </div>
              </div>
            </div>
          )
        })}

        <button type="button" onClick={addItem} className="btn-secondary w-full flex items-center justify-center gap-2 print:hidden">
          <Plus className="w-5 h-5" />
          Agregar otro producto
        </button>

        <div className="card bg-rosa-intenso/10 border-2 border-rosa-intenso text-center">
          <p className="text-sm text-gray-500">Total Factura (con IVA)</p>
          <p className="text-4xl font-extrabold text-rosa-intenso">${granTotal.toLocaleString('es-CL')}</p>
        </div>

        <button type="submit" className="btn-primary w-full py-5 text-xl print:hidden">
          Registrar Todos los Productos
        </button>
      </form>
    </div>
  )
}
