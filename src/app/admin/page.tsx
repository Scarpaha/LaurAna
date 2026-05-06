'use client'

import { useState, useEffect } from 'react'
import {
  registrarLote,
  registrarLotesMultiple,
  registrarProducto,
  calcularVencimientoFinal,
  fetchMaestroProductos,
  fetchInventarioLotes,
  eliminarLote,
  actualizarCantidadLote,
} from '@/lib/api'
import {
  Package,
  FileText,
  List,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Edit2,
  Loader2,
} from 'lucide-react'

type AdminTab = 'individual' | 'factura' | 'todos'
type PriceMode = 'neto' | 'total'
type DateMode = 'fecha' | 'calcular' | 'anio'

interface LoteItem {
  id: string
  producto: string
  tipo: string
  detalle: string
  cantidad: number
  fechaVencimiento: string
  fechaElaboracion: string
  mesesDuracion: number
  precioUnitario: number
  priceMode: PriceMode
  linkImagen: string
}

interface ProductoUnificado {
  id: string
  nombre: string
  categoria: string
  tipo: string
  precioCliente: number
  cantidad: number
  fechaVencimiento: string
  imagen: string
  fuente: 'maestro' | 'lote'
}

const TIPOS_PRODUCTO = [
  'Lácteos', 'Carnes', 'Embutidos', 'Panes', 'Bebidas',
  'Snacks', 'Aseo', 'Verduras', 'Frutas', 'Enlatados',
  'Congelados', 'Endulzantes', 'Aceites', 'Harinas', 'Especias', 'Otro',
]

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
const MESES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const ANIOS = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i))

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

function ListaTodos() {
  const [productos, setProductos] = useState<ProductoUnificado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ precioCliente: 0, cantidad: 0 })
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [maestro, lotes] = await Promise.all([
        fetchMaestroProductos(),
        fetchInventarioLotes(),
      ])
      const merged: ProductoUnificado[] = []
      const seen = new Set<string>()
      for (const p of maestro) {
        const key = p.nombre.toLowerCase().trim()
        if (!seen.has(key)) {
          merged.push({
            id: `m-${key}`,
            nombre: p.nombre,
            categoria: p.categoria,
            tipo: p.categoria,
            precioCliente: p.precioCliente,
            cantidad: 0,
            fechaVencimiento: '',
            imagen: p.imagen,
            fuente: 'maestro',
          })
          seen.add(key)
        }
      }
      for (const l of lotes) {
        const key = l.producto.toLowerCase().trim()
        if (seen.has(key)) {
          const existing = merged.find((m) => m.nombre.toLowerCase().trim() === key)
          if (existing) {
            existing.cantidad += l.cantidad
            if (l.vencimientoFinal || l.fechaVencimiento) {
              existing.fechaVencimiento = l.vencimientoFinal || l.fechaVencimiento
            }
          }
        } else {
          merged.push({
            id: `l-${key}-${l.fechaVencimiento}`,
            nombre: l.producto,
            categoria: l.tipo,
            tipo: l.tipo,
            precioCliente: 0,
            cantidad: l.cantidad,
            fechaVencimiento: l.vencimientoFinal || l.fechaVencimiento,
            imagen: l.linkImagen,
            fuente: 'lote',
          })
          seen.add(key)
        }
      }
      setProductos(merged)
      setLoading(false)
    }
    load()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleDelete = async (p: ProductoUnificado) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    if (p.fuente === 'lote') {
      const result = await eliminarLote(p.nombre, p.fechaVencimiento, p.cantidad)
      if (result.success) {
        showToast('Producto eliminado ✔')
        setProductos((prev) => prev.filter((x) => x.id !== p.id))
      }
    } else {
      setProductos((prev) => prev.filter((x) => x.id !== p.id))
      showToast('Producto removido de la lista ✔')
    }
  }

  const startEdit = (idx: number, p: ProductoUnificado) => {
    setEditIdx(idx)
    setEditForm({ precioCliente: p.precioCliente, cantidad: p.cantidad })
  }

  const saveEdit = async (p: ProductoUnificado) => {
    if (p.fuente === 'lote') {
      if (editForm.cantidad <= 0) {
        const result = await eliminarLote(p.nombre, p.fechaVencimiento)
        if (result.success) {
          showToast('Producto eliminado ✔')
          setProductos((prev) => prev.filter((x) => x.id !== p.id))
        }
      } else {
        const result = await actualizarCantidadLote(p.nombre, p.fechaVencimiento, editForm.cantidad)
        if (result.success) {
          showToast('Cantidad actualizada ✔')
          setProductos((prev) => prev.map((x) => x.id === p.id ? { ...x, cantidad: editForm.cantidad } : x))
        }
      }
    } else {
      setProductos((prev) => prev.map((x) => x.id === p.id ? { ...x, precioCliente: editForm.precioCliente, cantidad: editForm.cantidad } : x))
      showToast('Producto actualizado ✔')
    }
    setEditIdx(null)
  }

  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.tipo.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="card text-center py-12">
        <Loader2 className="w-10 h-10 text-rosa-intenso animate-spin mx-auto" />
        <p className="mt-3 text-gray-500">Cargando productos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <List className="w-7 h-7 text-rosa-intenso" />
          Todos los Productos ({productos.length})
        </h2>
        <input
          type="text"
          placeholder="Buscar por nombre o tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field mb-4"
        />
        <div className="space-y-2">
          {filtered.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{p.nombre}</p>
                <p className="text-sm text-gray-500">{p.tipo} {p.fechaVencimiento && `• Vence: ${p.fechaVencimiento}`}</p>
              </div>
              <div className="flex items-center gap-2">
                {editIdx === idx ? (
                  <>
                    <input
                      type="number"
                      value={editForm.precioCliente}
                      onChange={(e) => setEditForm((f) => ({ ...f, precioCliente: Number(e.target.value) }))}
                      className="w-20 text-right border rounded p-1 text-sm"
                      placeholder="Precio"
                    />
                    <input
                      type="number"
                      value={editForm.cantidad}
                      onChange={(e) => setEditForm((f) => ({ ...f, cantidad: Number(e.target.value) }))}
                      className="w-16 text-right border rounded p-1 text-sm"
                      placeholder="Cant."
                    />
                    <button onClick={() => saveEdit(p)} className="p-1 text-exito hover:bg-green-100 rounded">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditIdx(null)} className="p-1 text-error hover:bg-red-100 rounded">
                      <AlertTriangle className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-mono text-rosa-intenso">
                      {p.precioCliente > 0 ? `$${p.precioCliente.toLocaleString('es-CL')}` : '-'}
                    </span>
                    <span className="text-sm font-mono">
                      {p.cantidad > 0 ? `Cant: ${p.cantidad}` : ''}
                    </span>
                    <button onClick={() => startEdit(idx, p)} className="p-1 text-lavanda hover:bg-purple-100 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1 text-error hover:bg-red-100 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />{toast}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('individual')

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
        <button
          onClick={() => setActiveTab('todos')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'todos'
              ? 'bg-rosa-intenso text-white shadow-md'
              : 'text-carbon hover:bg-lavanda/20'
          }`}
        >
          <List className="w-5 h-5" />
          Todos
        </button>
      </div>

      {activeTab === 'individual' && <FormularioIndividual />}
      {activeTab === 'factura' && <FormularioFactura />}
      {activeTab === 'todos' && <ListaTodos />}
    </div>
  )
}

function FormularioIndividual() {
  const [form, setForm] = useState({
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
  const [fechaParts, setFechaParts] = useState({
    day: '01',
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(new Date().getFullYear()),
  })
  const [calculatedDate, setCalculatedDate] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const price = Number(form.precioUnitario || 0)
  const totals = calcTotals(price, form.cantidad, form.priceMode)

  const fechaVencimientoFromParts = `${fechaParts.year}-${fechaParts.month}-${fechaParts.day}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.producto || !form.tipo || price <= 0) return

    let fechaVencimiento = ''
    if (vencimiento.modo === 'fecha') {
      fechaVencimiento = fechaVencimientoFromParts
    } else if (vencimiento.modo === 'calcular') {
      fechaVencimiento = calculatedDate
    } else if (vencimiento.modo === 'anio') {
      const y = vencimiento.anioVencimiento
      fechaVencimiento = y ? `${y}-12-31` : ''
    }

    const precioCliente = Number(form.precioCliente || 0)

    const prodResult = await registrarProducto({
      codigoBarras: '',
      nombre: form.producto,
      categoria: form.tipo,
      precioCliente: precioCliente || price,
      imagen: form.linkImagen,
    })

    if (!prodResult.success) {
      setStatus('error')
      setMessage(prodResult.message)
      return
    }

    const loteResult = await registrarLote({
      codigoBarras: '',
      producto: form.producto,
      tipo: form.tipo,
      detalle: form.detalle,
      cantidad: form.cantidad,
      fechaVencimiento,
      fechaElaboracion: vencimiento.fechaElaboracion,
      mesesDuracion: vencimiento.mesesDuracion,
      costoNetoUnitario: form.priceMode === 'neto' ? price : Math.round(price / 1.19),
      ivaCredito: totals.iva,
      totalFactura: totals.total,
      linkImagen: form.linkImagen,
    })

    if (loteResult.success) {
      setStatus('success')
      setMessage('Producto registrado en catálogo y vencimientos ✔')
      setForm({ tipo: '', producto: '', detalle: '', cantidad: 1, precioUnitario: '', precioCliente: '', priceMode: 'neto', linkImagen: '' })
      setVencimiento({ modo: 'fecha', fechaVencimiento: '', fechaElaboracion: '', mesesDuracion: 6, anioVencimiento: '' })
      setFechaParts({ day: '01', month: String(new Date().getMonth() + 1).padStart(2, '0'), year: String(new Date().getFullYear()) })
      setCalculatedDate('')
    } else {
      setStatus('error')
      setMessage('Producto registrado en catálogo, pero falló en vencimientos')
    }
    setTimeout(() => setStatus('idle'), 4000)
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
            placeholder="Ej: De Todito 64g"
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
                <select value={fechaParts.day} onChange={(e) => setFechaParts((p) => ({ ...p, day: e.target.value }))} className="input-field">
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={fechaParts.month} onChange={(e) => setFechaParts((p) => ({ ...p, month: e.target.value }))} className="input-field">
                  {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={fechaParts.year} onChange={(e) => setFechaParts((p) => ({ ...p, year: e.target.value }))} className="input-field">
                  {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">Seleccionada: {fechaVencimientoFromParts}</p>
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
      id: '1', producto: '', tipo: '', detalle: '',
      cantidad: 1, fechaVencimiento: '', fechaElaboracion: '', mesesDuracion: 6,
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
        id: Date.now().toString(), producto: '', tipo: '', detalle: '',
        cantidad: 1, fechaVencimiento: '', fechaElaboracion: '', mesesDuracion: 6,
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
        codigoBarras: '',
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
          id: '1', producto: '', tipo: '', detalle: '',
          cantidad: 1, fechaVencimiento: '', fechaElaboracion: '', mesesDuracion: 6,
          precioUnitario: 0, priceMode: 'neto', linkImagen: '',
        },
      ])
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="card space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-7 h-7 text-rosa-intenso" />
        Ingreso por Factura
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
