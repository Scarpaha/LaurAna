'use client'

import { useState, useEffect } from 'react'
import {
  fetchCajaDiaria,
  fetchPanelPapa,
  registrarVentaDiaria,
  type VentaDiaria,
  type PanelPapa,
} from '@/lib/api'
import {
  Target,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
} from 'lucide-react'

export default function VentasPage() {
  const [panel, setPanel] = useState<PanelPapa | null>(null)
  const [ventas, setVentas] = useState<VentaDiaria[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    ventaBoleta: '',
    ventaSinBoleta: '',
    consumoPropio: '',
  })
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [panelData, ventasData] = await Promise.all([
        fetchPanelPapa(),
        fetchCajaDiaria(),
      ])
      setPanel(panelData)
      setVentas(ventasData)
      setLoading(false)
    }
    load()
  }, [])

  const handleNumpad = (field: 'ventaBoleta' | 'ventaSinBoleta' | 'consumoPropio', digit: string) => {
    setForm((prev) => {
      if (digit === 'backspace') {
        return { ...prev, [field]: prev[field].slice(0, -1) }
      }
      if (digit === 'clear') {
        return { ...prev, [field]: '' }
      }
      return { ...prev, [field]: prev[field] + digit }
    })
  }

  const totalDia =
    Number(form.ventaBoleta || 0) +
    Number(form.ventaSinBoleta || 0) +
    Number(form.consumoPropio || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fecha) return

    const result = await registrarVentaDiaria({
      fecha: form.fecha,
      ventaBoleta: Number(form.ventaBoleta || 0),
      ventaSinBoleta: Number(form.ventaSinBoleta || 0),
      consumoPropio: Number(form.consumoPropio || 0),
    })

    setStatus(result.success ? 'success' : 'error')
    setMessage(result.message)

    if (result.success) {
      setForm({
        fecha: form.fecha,
        ventaBoleta: '',
        ventaSinBoleta: '',
        consumoPropio: '',
      })
      const ventasData = await fetchCajaDiaria()
      setVentas(ventasData)
      const panelData = await fetchPanelPapa()
      setPanel(panelData)
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const weekTotal = (dateStr: string) => {
    const date = new Date(dateStr)
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    return ventas
      .filter((v) => {
        const vd = new Date(v.fecha)
        return vd >= startOfWeek && vd <= date
      })
      .reduce((sum, v) => sum + v.totalDia, 0)
  }

  const monthTotal = (dateStr: string) => {
    const date = new Date(dateStr)
    return ventas
      .filter((v) => {
        const vd = new Date(v.fecha)
        return vd.getMonth() === date.getMonth() && vd.getFullYear() === date.getFullYear()
      })
      .reduce((sum, v) => sum + v.totalDia, 0)
  }

  const progressPercent =
    panel && panel.metaVenta > 0
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">
          Ventas Diarias
        </h1>
        <p className="font-slogan text-lavanda text-lg">
          El cuaderno digital
        </p>
      </div>

      {panel && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card border-l-4 border-lavanda">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-lavanda/20 rounded-xl">
                  <DollarSign className="w-7 h-7 text-lavanda" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold">
                    Inversión Total
                  </p>
                  <p className="text-2xl font-extrabold text-carbon">
                    ${panel.inversionTotal.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            </div>

            <div className="card border-l-4 border-aviso">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Target className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold">
                    Meta de Venta
                  </p>
                  <p className="text-2xl font-extrabold text-carbon">
                    ${panel.metaVenta.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            </div>

            <div className="card border-l-4 border-exito">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-7 h-7 text-exito" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold">
                    Venta Real
                  </p>
                  <p className="text-2xl font-extrabold text-exito">
                    ${panel.ventaReal.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {panel.metaVenta > 0 && (
            <div className="card">
              <h3 className="font-bold text-lg mb-3">
                Progreso del Mes - {panel.mesActual || 'Este mes'}
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div
                  className={`h-8 rounded-full font-bold text-sm flex items-center justify-center transition-all duration-500 ${
                    progressPercent >= 100
                      ? 'bg-exito'
                      : progressPercent >= 70
                        ? 'bg-aviso text-carbon'
                        : 'bg-rosa-intenso'
                  }`}
                  style={{ width: `${Math.max(progressPercent, 5)}%` }}
                >
                  {progressPercent.toFixed(0)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-500">Utilidad</p>
                  <p className="text-xl font-bold text-exito">
                    ${panel.diferencia.toLocaleString('es-CL')}
                  </p>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-xl">
                  <p className="text-sm text-gray-500">Falta para meta</p>
                  <p className="text-xl font-bold text-rosa-intenso">
                    ${Math.max(0, panel.metaVenta - panel.ventaReal).toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-rosa-intenso" />
          Registrar Venta del Día
        </h2>

        {status === 'success' && (
          <div className="mb-4 p-4 bg-green-100 border border-exito rounded-xl flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-exito" />
            <span className="font-semibold text-green-800">{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-4 p-4 bg-red-100 border border-error rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-error" />
            <span className="font-semibold text-red-800">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Fecha</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          {(['ventaBoleta', 'ventaSinBoleta', 'consumoPropio'] as const).map((field) => {
            const labels = {
              ventaBoleta: 'Venta con Boleta',
              ventaSinBoleta: 'Venta sin Boleta',
              consumoPropio: 'Consumo Propio',
            }
            return (
              <div key={field} className="space-y-2">
                <label className="label-field">{labels[field]}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    readOnly
                    value={form[field] ? `$${Number(form[field]).toLocaleString('es-CL')}` : '$0'}
                    className="input-field text-right text-2xl font-mono bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleNumpad(field, digit)}
                      className="h-14 text-2xl font-bold bg-white border-2 border-lavanda rounded-xl hover:bg-lavanda/30 active:bg-lavanda transition-colors"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleNumpad(field, '0')}
                    className="h-14 text-2xl font-bold bg-white border-2 border-lavanda rounded-xl hover:bg-lavanda/30 active:bg-lavanda transition-colors col-span-2"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumpad(field, 'backspace')}
                    className="h-14 text-lg font-bold bg-red-100 border-2 border-error rounded-xl hover:bg-red-200 active:bg-red-300 transition-colors"
                  >
                    ⌫
                  </button>
                </div>
              </div>
            )
          })}

          <div className="card bg-pastel border-2 border-rosa-intenso text-center">
            <p className="text-sm text-gray-500 font-semibold">Total del Día</p>
            <p className="text-4xl font-extrabold text-rosa-intenso">
              ${totalDia.toLocaleString('es-CL')}
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-5 text-xl"
          >
            Guardar Venta del Día
          </button>
        </form>
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
                  <th className="p-3 text-right">Total Día</th>
                  <th className="p-3 text-right">Total Semana</th>
                  <th className="p-3 text-right rounded-tr-xl">Total Mes</th>
                </tr>
              </thead>
              <tbody>
                {ventas
                  .sort((a, b) => b.fecha.localeCompare(a.fecha))
                  .slice(0, 30)
                  .map((venta, idx) => (
                    <tr
                      key={venta.fecha}
                      className={`border-b border-gray-100 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="p-3 font-semibold">
                        {new Date(venta.fecha + 'T12:00:00').toLocaleDateString(
                          'es-CL',
                          { day: '2-digit', month: '2-digit' }
                        )}
                      </td>
                      <td className="p-3 text-right font-mono">
                        ${venta.ventaBoleta.toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-right font-mono">
                        ${venta.ventaSinBoleta.toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-right font-mono">
                        ${venta.consumoPropio.toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-exito">
                        ${venta.totalDia.toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-right font-mono text-lavanda font-semibold">
                        ${weekTotal(venta.fecha).toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-right font-mono text-rosa-intenso font-semibold">
                        ${monthTotal(venta.fecha).toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
