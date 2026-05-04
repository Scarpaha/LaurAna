'use client'

import { useState, useEffect } from 'react'
import {
  fetchCajaDiaria,
  fetchPanelPapa,
  registrarVentaDiaria,
  updateCajaDiaria,
  deleteCajaDiaria,
  type VentaDiaria,
  type PanelPapa,
} from '@/lib/api'
import { Target, DollarSign, TrendingUp, Loader2, Printer, Edit2, Trash2, Check, X, Calendar } from 'lucide-react'

type Mode = 'boleta' | 'sinboleta' | 'consumo'

export default function VentasPage() {
  const [panel, setPanel] = useState<PanelPapa | null>(null)
  const [ventas, setVentas] = useState<VentaDiaria[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().slice(0, 10)

  const [selectedDate, setSelectedDate] = useState(today)
  const [mode, setMode] = useState<Mode>('boleta')
  const [input, setInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ ventaBoleta: 0, ventaSinBoleta: 0, consumoPropio: 0 })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [p, v] = await Promise.all([fetchPanelPapa(), fetchCajaDiaria()])
      setPanel(p)
      setVentas(v)
      setLoading(false)
    }
    load()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleKey = (d: string) => {
    if (d === '⌫') setInput((prev) => prev.slice(0, -1))
    else if (d === 'C') setInput('')
    else setInput((prev) => prev + d)
  }

  const handleAdd = async () => {
    const amount = Number(input)
    if (!amount || amount <= 0) return

    const existing = ventas.find((v) => v.fecha === selectedDate)
    let payload: { fecha: string; ventaBoleta: number; ventaSinBoleta: number; consumoPropio: number }

    if (existing) {
      payload = {
        fecha: selectedDate,
        ventaBoleta: mode === 'boleta' ? existing.ventaBoleta + amount : existing.ventaBoleta,
        ventaSinBoleta: mode === 'sinboleta' ? existing.ventaSinBoleta + amount : existing.ventaSinBoleta,
        consumoPropio: mode === 'consumo' ? existing.consumoPropio + amount : existing.consumoPropio,
      }
    } else {
      payload = {
        fecha: selectedDate,
        ventaBoleta: mode === 'boleta' ? amount : 0,
        ventaSinBoleta: mode === 'sinboleta' ? amount : 0,
        consumoPropio: mode === 'consumo' ? amount : 0,
      }
    }

    const result = await registrarVentaDiaria(payload)
    if (result.success) {
      showToast('Agregado correctamente ✔')
      setInput('')
      reload()
    } else {
      showToast(result.message)
    }
  }

  const startEdit = (v: VentaDiaria) => {
    setEditingDate(v.fecha)
    setEditForm({
      ventaBoleta: v.ventaBoleta,
      ventaSinBoleta: v.ventaSinBoleta,
      consumoPropio: v.consumoPropio,
    })
  }

  const cancelEdit = () => setEditingDate(null)

  const saveEdit = async () => {
    if (!editingDate) return
    const result = await updateCajaDiaria({ fecha: editingDate, ...editForm })
    if (result.success) {
      showToast('Actualizado correctamente ✔')
      setEditingDate(null)
      reload()
    } else {
      showToast(result.message)
    }
  }

  const handleDelete = async (fecha: string) => {
    if (!confirm(`¿Eliminar la venta del ${fecha}?`)) return
    const result = await deleteCajaDiaria(fecha)
    if (result.success) {
      showToast('Eliminado correctamente ✔')
      reload()
    } else {
      showToast(result.message)
    }
  }

  const reload = async () => {
    const [v, p] = await Promise.all([fetchCajaDiaria(), fetchPanelPapa()])
    setVentas(v)
    setPanel(p)
  }

  const handlePrint = () => window.print()

  const totalMes = ventas
    .filter((v) => v.fecha.startsWith(selectedDate.substring(0, 7)))
    .reduce((sum, v) => sum + v.ventaBoleta + v.ventaSinBoleta + v.consumoPropio, 0)

  const selectedVenta = ventas.find((v) => v.fecha === selectedDate)
  const totalDia = selectedVenta
    ? selectedVenta.ventaBoleta + selectedVenta.ventaSinBoleta + selectedVenta.consumoPropio
    : 0

  const progressPercent = panel && panel.metaVenta > 0
    ? Math.min((panel.ventaReal / panel.metaVenta) * 100, 100)
    : 0

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-rosa-intenso animate-spin" />
        <p className="mt-4 text-lg text-gray-500">Cargando ventas...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 print:p-0">
      <div className="text-center print:hidden">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">Ventas Diarias</h1>
        <p className="font-slogan text-lavanda text-lg">El cuaderno digital</p>
      </div>

      {panel && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card border-l-4 border-lavanda">
            <div className="flex items-center gap-3">
              <DollarSign className="w-7 h-7 text-lavanda" />
              <div>
                <p className="text-sm text-gray-500 font-semibold">Inversión Total</p>
                <p className="text-2xl font-extrabold text-carbon">${panel.inversionTotal.toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>
          <div className="card border-l-4 border-aviso">
            <div className="flex items-center gap-3">
              <Target className="w-7 h-7 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500 font-semibold">Meta de Venta</p>
                <p className="text-2xl font-extrabold text-carbon">${panel.metaVenta.toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>
          <div className="card border-l-4 border-exito">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-exito" />
              <div>
                <p className="text-sm text-gray-500 font-semibold">Venta Real</p>
                <p className="text-2xl font-extrabold text-exito">${panel.ventaReal.toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {panel && panel.metaVenta > 0 && (
        <div className="card print:hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Progreso - {panel.mesActual || 'Este mes'}</h3>
            <span className="text-sm text-gray-500">
              Debe vender: <span className="font-bold text-rosa-intenso">${panel.metaVenta.toLocaleString('es-CL')}</span> | Ha vendido: <span className="font-bold text-exito">${panel.ventaReal.toLocaleString('es-CL')}</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-8">
            <div className={`h-8 rounded-full font-bold text-sm flex items-center justify-center ${progressPercent >= 100 ? 'bg-exito' : progressPercent >= 70 ? 'bg-aviso text-carbon' : 'bg-rosa-intenso'}`} style={{ width: `${Math.max(progressPercent, 5)}%` }}>
              {progressPercent.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      <div className="card print:hidden">
        <div className="mb-4">
          <label className="label-field flex items-center gap-2"><Calendar className="w-5 h-5" />Fecha</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input-field" />
        </div>

        <div className="flex gap-2 mb-4">
          {([
            { key: 'boleta', label: 'Con Boleta' },
            { key: 'sinboleta', label: 'Sin Boleta' },
            { key: 'consumo', label: 'Consumo' },
          ] as const).map((m) => (
            <button key={m.key} onClick={() => setMode(m.key)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === m.key ? 'bg-rosa-intenso text-white shadow-md' : 'bg-white border-2 border-lavanda hover:bg-lavanda/20'}`}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="text-center mb-4">
          <p className="text-sm text-gray-500 mb-1">Monto a agregar</p>
          <p className="text-4xl font-extrabold text-rosa-intenso font-mono">${input ? Number(input).toLocaleString('es-CL') : '0'}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" onClick={() => handleKey(d)} className="h-16 text-2xl font-bold bg-white border-2 border-lavanda rounded-xl hover:bg-lavanda/30 active:bg-lavanda transition-colors">{d}</button>
          ))}
          <button type="button" onClick={() => handleKey('0')} className="h-16 text-2xl font-bold bg-white border-2 border-lavanda rounded-xl hover:bg-lavanda/30 active:bg-lavanda transition-colors col-span-2">0</button>
          <button type="button" onClick={() => handleKey('⌫')} className="h-16 text-lg font-bold bg-red-100 border-2 border-error rounded-xl hover:bg-red-200 transition-colors">⌫</button>
        </div>

        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setInput('')} className="btn-secondary flex-1">Limpiar</button>
          <button type="button" onClick={handleAdd} className="btn-primary flex-[2]">Agregar al Día</button>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500 px-2">
          <span>Total día seleccionado: <strong className="text-carbon">${totalDia.toLocaleString('es-CL')}</strong></span>
          <span>Total mes: <strong className="text-rosa-intenso">${totalMes.toLocaleString('es-CL')}</strong></span>
        </div>
      </div>

      <div className="flex justify-end print:hidden">
        <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer className="w-5 h-5" />Imprimir Mes</button>
      </div>

      {ventas.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Historial de Ventas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-lavanda/20">
                  <th className="p-3 text-left rounded-tl-xl">Fecha</th>
                  <th className="p-3 text-right">Con Boleta</th>
                  <th className="p-3 text-right">Sin Boleta</th>
                  <th className="p-3 text-right">Consumo</th>
                  <th className="p-3 text-right rounded-tr-xl">Total</th>
                  <th className="p-3 text-right print:hidden">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 30).map((v) => {
                  const isEditing = editingDate === v.fecha
                  return (
                    <tr key={v.fecha} className={`border-b border-gray-100 ${isEditing ? 'bg-yellow-50' : ''}`}>
                      <td className="p-3 font-semibold">{new Date(v.fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                      {isEditing ? (
                        <>
                          <td className="p-2"><input type="number" value={editForm.ventaBoleta} onChange={(e) => setEditForm((p) => ({ ...p, ventaBoleta: Number(e.target.value) }))} className="w-24 text-right border rounded p-1 text-sm" /></td>
                          <td className="p-2"><input type="number" value={editForm.ventaSinBoleta} onChange={(e) => setEditForm((p) => ({ ...p, ventaSinBoleta: Number(e.target.value) }))} className="w-24 text-right border rounded p-1 text-sm" /></td>
                          <td className="p-2"><input type="number" value={editForm.consumoPropio} onChange={(e) => setEditForm((p) => ({ ...p, consumoPropio: Number(e.target.value) }))} className="w-24 text-right border rounded p-1 text-sm" /></td>
                          <td className="p-3 text-right font-bold text-exito">${(editForm.ventaBoleta + editForm.ventaSinBoleta + editForm.consumoPropio).toLocaleString('es-CL')}</td>
                          <td className="p-3 print:hidden">
                            <div className="flex gap-1 justify-end">
                              <button onClick={saveEdit} className="p-1 text-exito hover:bg-green-100 rounded"><Check className="w-5 h-5" /></button>
                              <button onClick={cancelEdit} className="p-1 text-error hover:bg-red-100 rounded"><X className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-right font-mono">${v.ventaBoleta.toLocaleString('es-CL')}</td>
                          <td className="p-3 text-right font-mono">${v.ventaSinBoleta.toLocaleString('es-CL')}</td>
                          <td className="p-3 text-right font-mono">${v.consumoPropio.toLocaleString('es-CL')}</td>
                          <td className="p-3 text-right font-mono font-bold text-exito">${(v.ventaBoleta + v.ventaSinBoleta + v.consumoPropio).toLocaleString('es-CL')}</td>
                          <td className="p-3 print:hidden">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => startEdit(v)} className="p-1 text-lavanda hover:bg-purple-100 rounded"><Edit2 className="w-5 h-5" /></button>
                              <button onClick={() => handleDelete(v.fecha)} className="p-1 text-error hover:bg-red-100 rounded"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 font-semibold flex items-center gap-2">
          <Check className="w-5 h-5" />{toast}
        </div>
      )}
    </div>
  )
}
