'use client'

import { useState, useEffect } from 'react'
import { fetchInventarioLotes, fetchMaestroProductos, eliminarLote, diasParaVencer } from '@/lib/api'
import { AlertTriangle, Loader2, PackageX, Calendar, Trash2, Minus, Plus } from 'lucide-react'

interface VencimientoItem {
  producto: string
  tipo: string
  cantidad: number
  fechaUsar: string
  diasParaVencer: number
  imagen: string
  fuente: 'lote' | 'maestro'
  fechaVencimiento: string
}

export default function VencimientosPage() {
  const [items, setItems] = useState<VencimientoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'critico' | 'alerta' | 'ok'>('todos')
  const [toast, setToast] = useState<string | null>(null)
  const [eliminarCantidad, setEliminarCantidad] = useState<Record<string, number>>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [lotes, maestro] = await Promise.all([
        fetchInventarioLotes(),
        fetchMaestroProductos(),
      ])
      const merged: VencimientoItem[] = []
      const seen = new Set<string>()

      for (const l of lotes) {
        if (l.estado === 'Eliminado' || l.cantidad <= 0) continue
        const fechaUsar = l.fechaVencimiento
        if (!fechaUsar) continue
        const dias = diasParaVencer(fechaUsar)
        const key = `${l.producto.toLowerCase().trim()}|${fechaUsar}`
        merged.push({
          producto: l.producto,
          tipo: '',
          cantidad: l.cantidad,
          fechaUsar,
          diasParaVencer: dias,
          imagen: '',
          fuente: 'lote',
          fechaVencimiento: fechaUsar,
        })
        seen.add(key)
      }

      for (const p of maestro) {
        if (p.estado === 'Eliminado') continue
        const fechaUsar = p.vencimientoFinal
        if (!fechaUsar) continue
        const dias = diasParaVencer(fechaUsar)
        const key = `${p.nombre.toLowerCase().trim()}|${fechaUsar}`
        if (!seen.has(key)) {
          merged.push({
            producto: p.nombre,
            tipo: p.tipo,
            cantidad: 0,
            fechaUsar,
            diasParaVencer: dias,
            imagen: p.imagen,
            fuente: 'maestro',
            fechaVencimiento: fechaUsar,
          })
          seen.add(key)
        }
      }

      setItems(merged)
      setLoading(false)
    }
    load()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const ajustarCantidad = (producto: string, fecha: string, delta: number) => {
    const key = `${producto}|${fecha}`
    setEliminarCantidad((prev) => {
      const current = prev[key] || 0
      const nuevo = Math.max(0, current + delta)
      return { ...prev, [key]: nuevo }
    })
  }

  const handleEliminar = async (item: VencimientoItem) => {
    const key = `${item.producto}|${item.fechaUsar}`
    const cantidad = eliminarCantidad[key] || 1
    if (!confirm(`¿Eliminar ${cantidad} unidad(es) de "${item.producto}"?`)) return
    const result = await eliminarLote(item.producto, item.fechaVencimiento, cantidad)
    if (result.success) {
      showToast(`${cantidad} unidad(es) marcada(s) como eliminada(s) ✔`)
      setEliminarCantidad((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      const data = await fetchInventarioLotes()
      const maestro = await fetchMaestroProductos()
      const merged: VencimientoItem[] = []
      const seen = new Set<string>()
      for (const l of data) {
        if (l.estado === 'Eliminado' || l.cantidad <= 0) continue
        const fechaUsar = l.fechaVencimiento
        if (!fechaUsar) continue
        const dias = diasParaVencer(fechaUsar)
        const sKey = `${l.producto.toLowerCase().trim()}|${fechaUsar}`
        merged.push({
          producto: l.producto,
          tipo: '',
          cantidad: l.cantidad,
          fechaUsar,
          diasParaVencer: dias,
          imagen: '',
          fuente: 'lote',
          fechaVencimiento: fechaUsar,
        })
        seen.add(sKey)
      }
      for (const p of maestro) {
        if (p.estado === 'Eliminado') continue
        const fechaUsar = p.vencimientoFinal
        if (!fechaUsar) continue
        const dias = diasParaVencer(fechaUsar)
        const sKey = `${p.nombre.toLowerCase().trim()}|${fechaUsar}`
        if (!seen.has(sKey)) {
          merged.push({
            producto: p.nombre,
            tipo: p.tipo,
            cantidad: 0,
            fechaUsar,
            diasParaVencer: dias,
            imagen: p.imagen,
            fuente: 'maestro',
            fechaVencimiento: fechaUsar,
          })
          seen.add(sKey)
        }
      }
      setItems(merged)
    }
  }

  const sorted = [...items].sort((a, b) => a.diasParaVencer - b.diasParaVencer)

  const filtered = sorted.filter((l) => {
    if (filter === 'todos') return true
    if (filter === 'critico') return l.diasParaVencer <= 7
    if (filter === 'alerta') return l.diasParaVencer > 7 && l.diasParaVencer <= 15
    if (filter === 'ok') return l.diasParaVencer > 15
    return true
  })

  const countCritico = items.filter((l) => l.diasParaVencer <= 7).length
  const countAlerta = items.filter((l) => l.diasParaVencer > 7 && l.diasParaVencer <= 15).length
  const countOk = items.filter((l) => l.diasParaVencer > 15).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-rosa-intenso animate-spin" />
        <p className="mt-4 text-lg text-gray-500">Cargando vencimientos...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">Vencimientos</h1>
        <p className="font-slogan text-lavanda text-lg">Control de productos próximos a vencer</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div onClick={() => setFilter('critico')} className={`card text-center cursor-pointer transition-all ${filter === 'critico' ? 'border-4 border-error bg-red-50' : 'border-2 border-error'}`}>
          <p className="text-3xl font-extrabold text-error">{countCritico}</p>
          <p className="text-sm font-semibold text-error">Críticos</p>
          <p className="text-xs text-gray-500">&lt;7 días</p>
        </div>
        <div onClick={() => setFilter('alerta')} className={`card text-center cursor-pointer transition-all ${filter === 'alerta' ? 'border-4 border-aviso bg-yellow-50' : 'border-2 border-aviso'}`}>
          <p className="text-3xl font-extrabold text-yellow-600">{countAlerta}</p>
          <p className="text-sm font-semibold text-yellow-600">Alerta</p>
          <p className="text-xs text-gray-500">7-15 días</p>
        </div>
        <div onClick={() => setFilter('ok')} className={`card text-center cursor-pointer transition-all ${filter === 'ok' ? 'border-4 border-exito bg-green-50' : 'border-2 border-exito'}`}>
          <p className="text-3xl font-extrabold text-exito">{countOk}</p>
          <p className="text-sm font-semibold text-exito">OK</p>
          <p className="text-xs text-gray-500">&gt;15 días</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('todos')} className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${filter === 'todos' ? 'bg-carbon text-white' : 'bg-white border border-gray-300'}`}>
          Ver Todos ({items.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PackageX className="w-16 h-16 text-gray-300" />
          <p className="mt-4 text-xl text-gray-500">No hay productos en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isCritico = item.diasParaVencer <= 7
            const isAlerta = item.diasParaVencer > 7 && item.diasParaVencer <= 15
            const key = `${item.producto}|${item.fechaUsar}`
            const cantEliminar = eliminarCantidad[key] || 1
            return (
              <div
                key={key}
                className={`card border-l-4 ${isCritico ? 'border-error bg-red-50' : isAlerta ? 'border-aviso bg-yellow-50' : 'border-exito'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{item.producto}</span>
                      {item.tipo && (
                        <span className="badge bg-lavanda/30 text-carbon">{item.tipo}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Vence: {(() => {
                          const raw = item.fechaUsar
                          if (!raw) return ''
                          const d = new Date(raw + 'T12:00:00')
                          if (!isNaN(d.getTime())) {
                            return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          }
                          return raw
                        })()}
                      </span>
                      {item.cantidad > 0 && <span>Stock: {item.cantidad}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-center px-4 py-2 rounded-xl ${isCritico ? 'bg-error text-white' : isAlerta ? 'bg-aviso text-carbon' : 'bg-exito/20 text-exito'}`}>
                      <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                      <p className="font-extrabold text-xl">{item.diasParaVencer}</p>
                      <p className="text-xs">días</p>
                    </div>
                    {item.fuente === 'lote' && item.cantidad > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => ajustarCantidad(item.producto, item.fechaUsar, -1)}
                          disabled={cantEliminar <= 1}
                          className="p-1 rounded bg-white border border-gray-300 disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{cantEliminar}</span>
                        <button
                          onClick={() => ajustarCantidad(item.producto, item.fechaUsar, 1)}
                          disabled={cantEliminar >= item.cantidad}
                          className="p-1 rounded bg-white border border-gray-300 disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => handleEliminar(item)}
                      className="p-1 text-error hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 font-semibold flex items-center gap-2">
          <Trash2 className="w-5 h-5" />{toast}
        </div>
      )}
    </div>
  )
}
