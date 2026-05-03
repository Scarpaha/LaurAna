'use client'

import { useState, useEffect } from 'react'
import {
  fetchProducts,
  fetchSalesSummary,
  fetchExpiringProducts,
  registerSale,
  type Producto,
} from '@/lib/api'
import {
  TrendingUp,
  Target,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  CheckCircle,
  Loader2,
} from 'lucide-react'

export default function SeniorPage() {
  const [summary, setSummary] = useState({
    inversionTotal: 0,
    metaVenta: 0,
    ventaReal: 0,
  })
  const [expiringProducts, setExpiringProducts] = useState<Producto[]>([])
  const [allProducts, setAllProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  const [saleForm, setSaleForm] = useState({
    producto: '',
    cantidad: 1,
    total: 0,
    metodoPago: 'Efectivo',
  })
  const [saleStatus, setSaleStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  )
  const [saleMessage, setSaleMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [summaryData, expiringData, productsData] = await Promise.all([
        fetchSalesSummary(),
        fetchExpiringProducts(15),
        fetchProducts(),
      ])
      setSummary(summaryData)
      setExpiringProducts(expiringData)
      setAllProducts(productsData)
      setLoading(false)
    }
    load()
  }, [])

  const handleProductSelect = (productName: string) => {
    const product = allProducts.find((p) => p.nombre === productName)
    if (product) {
      setSaleForm((prev) => ({
        ...prev,
        producto: productName,
        total: product.precio * prev.cantidad,
      }))
    }
  }

  const handleCantidadChange = (cantidad: number) => {
    const product = allProducts.find((p) => p.nombre === saleForm.producto)
    if (product) {
      setSaleForm((prev) => ({
        ...prev,
        cantidad,
        total: product.precio * cantidad,
      }))
    } else {
      setSaleForm((prev) => ({ ...prev, cantidad }))
    }
  }

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!saleForm.producto) return

    const result = await registerSale(saleForm)
    setSaleStatus(result.success ? 'success' : 'error')
    setSaleMessage(result.message)

    if (result.success) {
      setSaleForm({ producto: '', cantidad: 1, total: 0, metodoPago: 'Efectivo' })
      setTimeout(() => setSaleStatus('idle'), 3000)
    }
  }

  const progressPercent =
    summary.metaVenta > 0
      ? Math.min((summary.ventaReal / summary.metaVenta) * 100, 100)
      : 0

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-rosa-intenso animate-spin" />
        <p className="mt-4 text-lg text-gray-500">Cargando panel...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div className="text-center">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">
          Panel de Papá
        </h1>
        <p className="font-slogan text-lavanda text-lg">
          Control fácil de la tienda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-l-4 border-lavanda">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-lavanda/20 rounded-xl">
              <DollarSign className="w-8 h-8 text-lavanda" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">
                Inversión Total
              </p>
              <p className="text-3xl font-extrabold text-carbon">
                ${summary.inversionTotal.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-aviso">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Target className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">
                Meta de Venta
              </p>
              <p className="text-3xl font-extrabold text-carbon">
                ${summary.metaVenta.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-exito">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-8 h-8 text-exito" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">
                Venta Real
              </p>
              <p className="text-3xl font-extrabold text-exito">
                ${summary.ventaReal.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {summary.metaVenta > 0 && (
        <div className="card">
          <h3 className="font-bold text-lg mb-3">Progreso de la Meta</h3>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div
              className={`h-6 rounded-full font-bold text-sm flex items-center justify-center transition-all duration-500 ${
                progressPercent >= 100 ? 'bg-exito' : 'bg-rosa-intenso'
              }`}
              style={{ width: `${progressPercent}%` }}
            >
              {progressPercent.toFixed(0)}%
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            {progressPercent >= 100
              ? '¡Felicitaciones! Meta alcanzada'
              : `Falta $${(summary.metaVenta - summary.ventaReal).toLocaleString('es-CL')} para la meta`}
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-rosa-intenso" />
          Registrar Venta del Día
        </h2>

        {saleStatus === 'success' && (
          <div className="mb-4 p-4 bg-green-100 border border-exito rounded-xl flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-exito" />
            <span className="font-semibold text-green-800">{saleMessage}</span>
          </div>
        )}

        {saleStatus === 'error' && (
          <div className="mb-4 p-4 bg-red-100 border border-error rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-error" />
            <span className="font-semibold text-red-800">{saleMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitSale} className="space-y-4">
          <div>
            <label className="label-field">Producto</label>
            <select
              value={saleForm.producto}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Seleccionar producto...</option>
              {allProducts.map((p) => (
                <option key={p.id || p.nombre} value={p.nombre}>
                  {p.nombre} - ${p.precio.toLocaleString('es-CL')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field">Cantidad</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  handleCantidadChange(Math.max(1, saleForm.cantidad - 1))
                }
                className="w-14 h-14 bg-lavanda rounded-xl text-2xl font-bold hover:bg-purple-400 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={saleForm.cantidad}
                onChange={(e) => handleCantidadChange(Number(e.target.value))}
                className="input-field text-center w-20"
              />
              <button
                type="button"
                onClick={() => handleCantidadChange(saleForm.cantidad + 1)}
                className="w-14 h-14 bg-lavanda rounded-xl text-2xl font-bold hover:bg-purple-400 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="label-field">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {['Efectivo', 'Transferencia', 'Otro'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() =>
                    setSaleForm((prev) => ({
                      ...prev,
                      metodoPago: method,
                    }))
                  }
                  className={`py-3 rounded-xl font-bold text-lg transition-all ${
                    saleForm.metodoPago === method
                      ? 'bg-rosa-intenso text-white shadow-md'
                      : 'bg-white border-2 border-lavanda text-carbon hover:bg-lavanda/20'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="card bg-pastel border-2 border-rosa-intenso">
            <p className="text-sm text-gray-500 font-semibold">Total a cobrar</p>
            <p className="text-4xl font-extrabold text-rosa-intenso">
              ${saleForm.total.toLocaleString('es-CL')}
            </p>
          </div>

          <button
            type="submit"
            disabled={!saleForm.producto}
            className="btn-primary w-full py-5 text-xl"
          >
            Registrar Venta
          </button>
        </form>
      </div>

      {expiringProducts.length > 0 && (
        <div className="card border-2 border-error">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-error">
            <AlertTriangle className="w-7 h-7" />
            Productos por Vencer ({expiringProducts.length})
          </h2>
          <div className="space-y-3">
            {expiringProducts.map((product) => (
              <div
                key={product.id || product.nombre}
                className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200"
              >
                <AlertTriangle className="w-6 h-6 text-error flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-lg">{product.nombre}</p>
                  <p className="text-sm text-gray-500">
                    Vence: {product.fechaVencimiento || 'Sin fecha'}
                  </p>
                </div>
                <span className="badge badge-error">
                  Stock: {product.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
