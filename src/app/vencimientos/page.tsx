'use client'

import { useState, useEffect } from 'react'
import { fetchInventarioLotes, diasParaVencer, type LoteInventario } from '@/lib/api'
import { AlertTriangle, Loader2, PackageX, Calendar } from 'lucide-react'

export default function VencimientosPage() {
  const [lotes, setLotes] = useState<LoteInventario[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'critico' | 'alerta' | 'ok'>('todos')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchInventarioLotes()
      setLotes(data)
      setLoading(false)
    }
    load()
  }, [])

  const lotsWithDays = lotes
    .map((lote) => {
      const fechaUsar = lote.vencimientoFinal || lote.fechaVencimiento
      const dias = diasParaVencer(fechaUsar)
      return { ...lote, diasParaVencer: dias, fechaUsar }
    })
    .filter((l) => l.fechaUsar)

  const sorted = [...lotsWithDays].sort((a, b) => a.diasParaVencer - b.diasParaVencer)

  const filtered = sorted.filter((l) => {
    if (filter === 'todos') return true
    if (filter === 'critico') return l.diasParaVencer <= 7
    if (filter === 'alerta') return l.diasParaVencer > 7 && l.diasParaVencer <= 15
    if (filter === 'ok') return l.diasParaVencer > 15
    return true
  })

  const countCritico = lotsWithDays.filter((l) => l.diasParaVencer <= 7).length
  const countAlerta = lotsWithDays.filter((l) => l.diasParaVencer > 7 && l.diasParaVencer <= 15).length
  const countOk = lotsWithDays.filter((l) => l.diasParaVencer > 15).length

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
          Ver Todos ({lotsWithDays.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PackageX className="w-16 h-16 text-gray-300" />
          <p className="mt-4 text-xl text-gray-500">No hay productos en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lote) => {
            const isCritico = lote.diasParaVencer <= 7
            const isAlerta = lote.diasParaVencer > 7 && lote.diasParaVencer <= 15
            return (
              <div
                key={lote.codigoBarras + lote.vencimientoFinal + lote.producto}
                className={`card border-l-4 ${isCritico ? 'border-error bg-red-50' : isAlerta ? 'border-aviso bg-yellow-50' : 'border-exito'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{lote.producto}</span>
                      {lote.tipo && (
                        <span className="badge bg-lavanda/30 text-carbon">{lote.tipo}</span>
                      )}
                    </div>
                    {lote.detalle && <p className="text-sm text-gray-500">{lote.detalle}</p>}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Vence: {lote.fechaUsar.includes('-12-31') ? lote.fechaUsar.slice(0, 4) : new Date(lote.fechaUsar + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                      <span>Cantidad: {lote.cantidad}</span>
                    </div>
                  </div>
                  <div className={`text-center px-4 py-2 rounded-xl ${isCritico ? 'bg-error text-white' : isAlerta ? 'bg-aviso text-carbon' : 'bg-exito/20 text-exito'}`}>
                    <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                    <p className="font-extrabold text-xl">{lote.diasParaVencer}</p>
                    <p className="text-xs">días</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
