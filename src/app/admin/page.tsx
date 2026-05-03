'use client'

import { useState } from 'react'
import {
  registrarLote,
  registrarLotesMultiple,
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
} from 'lucide-react'

type AdminTab = 'individual' | 'factura'

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
  costoNetoUnitario: number
  linkImagen: string
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

      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-md">
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
    </div>
  )
}

const TIPOS_PRODUCTO = [
  'Lácteos',
  'Carnes',
  'Embutidos',
  'Panes',
  'Bebidas',
  'Snacks',
  'Aseo',
  'Verduras',
  'Frutas',
  'Enlatados',
  'Congelados',
  'Endulzantes',
  'Aceites',
  'Harinas',
  'Especias',
  'Otro',
]

function FormularioIndividual() {
  const [form, setForm] = useState({
    tipo: '',
    producto: '',
    detalle: '',
    cantidad: 1,
    costoNetoUnitario: '',
    linkImagen: '',
  })
  const [vencimiento, setVencimiento] = useState({
    modo: 'fecha' as 'fecha' | 'calcular',
    fechaVencimiento: '',
    fechaElaboracion: '',
    mesesDuracion: 6,
  })
  const [calculatedDate, setCalculatedDate] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleCalcVencimiento = () => {
    if (vencimiento.fechaElaboracion && vencimiento.mesesDuracion) {
      const date = calcularVencimientoFinal(
        vencimiento.fechaElaboracion,
        vencimiento.mesesDuracion
      )
      setCalculatedDate(date)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.producto || form.tipo === '' || Number(form.costoNetoUnitario) <= 0) return

    const fechaVencimiento =
      vencimiento.modo === 'fecha'
        ? vencimiento.fechaVencimiento
        : calculatedDate

    const costoNeto = Number(form.costoNetoUnitario)
    const iva = Math.round(costoNeto * 0.19 * form.cantidad)
    const total = costoNeto * form.cantidad + iva

    const result = await registrarLote({
      codigoBarras: form.codigoBarras || '',
      producto: form.producto,
      cantidad: form.cantidad,
      fechaVencimiento,
      fechaElaboracion: vencimiento.fechaElaboracion,
      mesesDuracion:
        vencimiento.modo === 'calcular' ? vencimiento.mesesDuracion : 0,
      costoNetoUnitario: costoNeto,
      ivaCredito: iva,
      totalFactura: total,
      linkImagen: form.linkImagen,
      tipo: form.tipo,
    })

    setStatus(result.success ? 'success' : 'error')
    setMessage(result.message)

    if (result.success) {
      setForm({
        tipo: '',
        producto: '',
        detalle: '',
        cantidad: 1,
        costoNetoUnitario: '',
        linkImagen: '',
      })
      setVencimiento({
        modo: 'fecha',
        fechaVencimiento: '',
        fechaElaboracion: '',
        mesesDuracion: 6,
      })
      setCalculatedDate('')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const ivaCredito = Math.round(Number(form.costoNetoUnitario || 0) * 0.19 * form.cantidad)
  const totalFactura = Number(form.costoNetoUnitario || 0) * form.cantidad + ivaCredito

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
            onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
            className="input-field"
            required
          >
            <option value="">Seleccionar tipo...</option>
            {TIPOS_PRODUCTO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field">Nombre del Producto *</label>
          <input
            type="text"
            value={form.producto}
            onChange={(e) => setForm((prev) => ({ ...prev, producto: e.target.value }))}
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
            onChange={(e) => setForm((prev) => ({ ...prev, detalle: e.target.value }))}
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
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cantidad: Number(e.target.value) }))
            }
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label-field">Costo Neto Unitario ($) *</label>
          <input
            type="number"
            min="0"
            value={form.costoNetoUnitario}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, costoNetoUnitario: e.target.value }))
            }
            className="input-field"
            placeholder="Precio sin IVA de cada unidad..."
            required
          />
        </div>

        <div className="card bg-lavanda/10 border-2 border-lavanda">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl">
              <p className="text-sm text-gray-500">IVA Crédito (19%)</p>
              <p className="text-xl font-bold text-lavanda">
                ${ivaCredito.toLocaleString('es-CL')}
              </p>
            </div>
            <div className="p-3 bg-rosa-intenso/10 rounded-xl">
              <p className="text-sm text-gray-500">Total Factura</p>
              <p className="text-xl font-bold text-rosa-intenso">
                ${totalFactura.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="label-field">Link de Imagen (opcional)</label>
          <input
            type="url"
            value={form.linkImagen}
            onChange={(e) => setForm((prev) => ({ ...prev, linkImagen: e.target.value }))}
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
              onClick={() => setVencimiento((prev) => ({ ...prev, modo: 'fecha' }))}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                vencimiento.modo === 'fecha'
                  ? 'bg-rosa-intenso text-white'
                  : 'bg-white border-2 border-lavanda'
              }`}
            >
              Tiene fecha
            </button>
            <button
              type="button"
              onClick={() => setVencimiento((prev) => ({ ...prev, modo: 'calcular' }))}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                vencimiento.modo === 'calcular'
                  ? 'bg-rosa-intenso text-white'
                  : 'bg-white border-2 border-lavanda'
              }`}
            >
              No tiene fecha
            </button>
          </div>

          {vencimiento.modo === 'fecha' ? (
            <div>
              <label className="label-field">Fecha de Vencimiento</label>
              <input
                type="date"
                value={vencimiento.fechaVencimiento}
                onChange={(e) =>
                  setVencimiento((prev) => ({
                    ...prev,
                    fechaVencimiento: e.target.value,
                  }))
                }
                className="input-field"
                required
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label-field">Fecha de Elaboración</label>
                <input
                  type="date"
                  value={vencimiento.fechaElaboracion}
                  onChange={(e) =>
                    setVencimiento((prev) => ({
                      ...prev,
                      fechaElaboracion: e.target.value,
                    }))
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label-field">
                  Consumir antes de: {vencimiento.mesesDuracion} meses
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={vencimiento.mesesDuracion}
                  onChange={(e) =>
                    setVencimiento((prev) => ({
                      ...prev,
                      mesesDuracion: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-rosa-intenso"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>1 mes</span>
                  <span>60 meses</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCalcVencimiento}
                className="btn-secondary w-full"
              >
                Calcular Vencimiento
              </button>
              {calculatedDate && (
                <div className="card bg-white border-2 border-rosa-intenso text-center">
                  <p className="text-sm text-gray-500">
                    Consumir antes de:
                  </p>
                  <p className="text-2xl font-extrabold text-rosa-intenso">
                    {new Date(calculatedDate + 'T12:00:00').toLocaleDateString(
                      'es-CL',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
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
      id: '1',
      codigoBarras: '',
      producto: '',
      tipo: '',
      detalle: '',
      cantidad: 1,
      fechaVencimiento: '',
      fechaElaboracion: '',
      mesesDuracion: 6,
      costoNetoUnitario: 0,
      linkImagen: '',
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
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        codigoBarras: '',
        producto: '',
        tipo: '',
        detalle: '',
        cantidad: 1,
        fechaVencimiento: '',
        fechaElaboracion: '',
        mesesDuracion: 6,
        costoNetoUnitario: 0,
        linkImagen: '',
      },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const granTotal = items.reduce((sum, item) => {
    const neto = item.costoNetoUnitario * item.cantidad
    const iva = Math.round(neto * 0.19)
    return sum + neto + iva
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validItems = items.filter((i) => i.producto && i.tipo && i.costoNetoUnitario > 0)
    if (validItems.length === 0) return

    const lotes = validItems.map((item) => {
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

      const neto = item.costoNetoUnitario * item.cantidad
      const iva = Math.round(neto * 0.19)

      return {
        codigoBarras: item.codigoBarras || '',
        producto: item.producto,
        cantidad: item.cantidad,
        fechaVencimiento,
        fechaElaboracion,
        mesesDuracion,
        costoNetoUnitario: item.costoNetoUnitario,
        ivaCredito: iva,
        totalFactura: neto + iva,
        linkImagen: item.linkImagen,
        tipo: item.tipo,
      }
    })

    const result = await registrarLotesMultiple(lotes)
    setStatus(result.success ? 'success' : 'error')
    setMessage(result.message)

    if (result.success) {
      setItems([
        {
          id: '1',
          codigoBarras: '',
          producto: '',
          tipo: '',
          detalle: '',
          cantidad: 1,
          fechaVencimiento: '',
          fechaElaboracion: '',
          mesesDuracion: 6,
          costoNetoUnitario: 0,
          linkImagen: '',
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

      <div>
        <label className="label-field">¿Los productos vencen igual?</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setVencimientoModo('igual')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              vencimientoModo === 'igual'
                ? 'bg-rosa-intenso text-white'
                : 'bg-white border-2 border-lavanda'
            }`}
          >
            Todos la misma fecha
          </button>
          <button
            type="button"
            onClick={() => setVencimientoModo('individual')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              vencimientoModo === 'individual'
                ? 'bg-rosa-intenso text-white'
                : 'bg-white border-2 border-lavanda'
            }`}
          >
            Cada uno distinto
          </button>
        </div>
      </div>

      {vencimientoModo === 'igual' && (
        <div className="card bg-pastel border-2 border-pink-200">
          <h3 className="font-bold mb-3">Vencimiento para todos los productos</h3>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setVencimientoIgual((prev) => ({ ...prev, modo: 'fecha' }))}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                vencimientoIgual.modo === 'fecha'
                  ? 'bg-rosa-intenso text-white'
                  : 'bg-white border-2 border-lavanda'
              }`}
            >
              Tiene fecha
            </button>
            <button
              type="button"
              onClick={() => setVencimientoIgual((prev) => ({ ...prev, modo: 'calcular' }))}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                vencimientoIgual.modo === 'calcular'
                  ? 'bg-rosa-intenso text-white'
                  : 'bg-white border-2 border-lavanda'
              }`}
            >
              No tiene fecha
            </button>
          </div>
          {vencimientoIgual.modo === 'fecha' ? (
            <input
              type="date"
              value={vencimientoIgual.fechaVencimiento}
              onChange={(e) =>
                setVencimientoIgual((prev) => ({
                  ...prev,
                  fechaVencimiento: e.target.value,
                }))
              }
              className="input-field"
            />
          ) : (
            <div className="space-y-2">
              <input
                type="date"
                value={vencimientoIgual.fechaElaboracion}
                onChange={(e) =>
                  setVencimientoIgual((prev) => ({
                    ...prev,
                    fechaElaboracion: e.target.value,
                  }))
                }
                className="input-field"
                placeholder="Fecha de elaboración"
              />
              <label className="text-sm text-gray-500">
                Meses: {vencimientoIgual.mesesDuracion}
              </label>
              <input
                type="range"
                min="1"
                max="60"
                value={vencimientoIgual.mesesDuracion}
                onChange={(e) =>
                  setVencimientoIgual((prev) => ({
                    ...prev,
                    mesesDuracion: Number(e.target.value),
                  }))
                }
                className="w-full accent-rosa-intenso"
              />
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="card border-2 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-lg">Producto {idx + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-error hover:bg-red-50 rounded-lg transition-colors"
                >
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
                  {TIPOS_PRODUCTO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-field">Nombre *</label>
                <input
                  type="text"
                  value={item.producto}
                  onChange={(e) => updateItem(item.id, 'producto', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label-field">Detalle (opcional)</label>
                <input
                  type="text"
                  value={item.detalle}
                  onChange={(e) => updateItem(item.id, 'detalle', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-field">Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  value={item.cantidad}
                  onChange={(e) => updateItem(item.id, 'cantidad', Number(e.target.value))}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label-field">Costo Neto Unitario ($) *</label>
                <input
                  type="number"
                  min="0"
                  value={item.costoNetoUnitario || ''}
                  onChange={(e) =>
                    updateItem(item.id, 'costoNetoUnitario', Number(e.target.value))
                  }
                  className="input-field"
                  required
                />
              </div>

              {vencimientoModo === 'individual' && (
                <div>
                  <label className="label-field">Fecha Vencimiento *</label>
                  <input
                    type="date"
                    value={item.fechaVencimiento}
                    onChange={(e) =>
                      updateItem(item.id, 'fechaVencimiento', e.target.value)
                    }
                    className="input-field"
                    required
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar otro producto a la factura
        </button>

        <div className="card bg-rosa-intenso/10 border-2 border-rosa-intenso text-center">
          <p className="text-sm text-gray-500">Total Factura (con IVA)</p>
          <p className="text-4xl font-extrabold text-rosa-intenso">
            ${granTotal.toLocaleString('es-CL')}
          </p>
        </div>

        <button type="submit" className="btn-primary w-full py-5 text-xl">
          Registrar Todos los Productos
        </button>
      </form>
    </div>
  )
}
