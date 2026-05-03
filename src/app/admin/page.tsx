'use client'

import { useState, useEffect, useRef } from 'react'
import {
  fetchProducts,
  searchByBarcode,
  submitInvoice,
  type Producto,
} from '@/lib/api'
import {
  ScanBarcode,
  FileText,
  Calendar,
  Camera,
  CameraOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Minus,
  Calculator,
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

type AdminTab = 'scanner' | 'invoice' | 'calculator'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('scanner')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">
          Panel Admin
        </h1>
        <p className="font-slogan text-lavanda text-lg">
          Gestión de inventario y control
        </p>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-md">
        {[
          { id: 'scanner' as AdminTab, label: 'Escáner', icon: ScanBarcode },
          { id: 'invoice' as AdminTab, label: 'Facturas', icon: FileText },
          {
            id: 'calculator' as AdminTab,
            label: 'Vencimiento',
            icon: Calendar,
          },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-rosa-intenso text-white shadow-md'
                  : 'text-carbon hover:bg-lavanda/20'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'scanner' && <BarcodeScanner />}
      {activeTab === 'invoice' && <InvoiceForm />}
      {activeTab === 'calculator' && <ExpiryCalculator />}
    </div>
  )
}

function BarcodeScanner() {
  const [scanning, setScanning] = useState(false)
  const [searchResult, setSearchResult] = useState<Producto | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [allProducts, setAllProducts] = useState<Producto[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProducts().then(setAllProducts)
    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  const startScanner = async () => {
    if (!containerRef.current) return

    setScanning(true)
    setSearchResult(null)

    const scanner = new Html5Qrcode('barcode-reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop()
          setScanning(false)
          setSearchLoading(true)
          const result = await searchByBarcode(decodedText)
          setSearchResult(result)
          setSearchLoading(false)
        },
        () => {}
      )
    } catch (err) {
      console.error('Scanner error:', err)
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {})
      setScanning(false)
    }
  }

  const handleManualSearch = async () => {
    if (!manualCode.trim()) return
    setSearchLoading(true)
    const result = await searchByBarcode(manualCode.trim())
    setSearchResult(result)
    setSearchLoading(false)
  }

  return (
    <div className="card space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <ScanBarcode className="w-7 h-7 text-rosa-intenso" />
        Escáner de Código de Barras
      </h2>

      {!scanning ? (
        <div className="space-y-4">
          <button onClick={startScanner} className="btn-primary w-full py-5 text-xl">
            <Camera className="w-6 h-6 inline mr-2" />
            Activar Cámara
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-lavanda"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                o ingresa el código manualmente
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="Código de barras..."
              className="input-field flex-1"
            />
            <button
              onClick={handleManualSearch}
              className="btn-secondary px-6"
            >
              Buscar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            ref={containerRef}
            id="barcode-reader"
            className="w-full max-w-sm mx-auto rounded-xl overflow-hidden"
          />
          <button onClick={stopScanner} className="btn-secondary w-full">
            <CameraOff className="w-5 h-5 inline mr-2" />
            Detener Cámara
          </button>
        </div>
      )}

      {searchLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-8 h-8 text-rosa-intenso animate-spin" />
        </div>
      )}

      {searchResult && (
        <div className="card bg-pastel border-2 border-lavanda">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-6 h-6 text-exito" />
            <h3 className="text-xl font-bold">Producto Encontrado</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="font-bold text-lg">{searchResult.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Precio</p>
              <p className="font-bold text-lg text-rosa-intenso">
                ${searchResult.precio.toLocaleString('es-CL')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Categoría</p>
              <p className="font-semibold">{searchResult.categoria}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock</p>
              <p className="font-semibold">{searchResult.stock}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Código</p>
              <p className="font-mono text-sm">{searchResult.codigoBarras}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vencimiento</p>
              <p className="font-semibold">
                {searchResult.fechaVencimiento || 'Sin fecha'}
              </p>
            </div>
          </div>
        </div>
      )}

      {searchResult === null && !searchLoading && manualCode && (
        <div className="card bg-red-50 border-2 border-error">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-error" />
            <p className="font-bold text-error">
              Producto no encontrado con ese código
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function InvoiceForm() {
  const [form, setForm] = useState({
    producto: '',
    cantidad: 1,
    neto: 0,
    iva: 0,
    total: 0,
    fechaVencimiento: '',
  })
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleNetoChange = (neto: number) => {
    const iva = Math.round(neto * 0.19)
    const total = neto + iva
    setForm((prev) => ({ ...prev, neto, iva, total }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.producto || form.neto <= 0) return

    const result = await submitInvoice({
      producto: form.producto,
      cantidad: form.cantidad,
      neto: form.neto,
      iva: form.iva,
      total: form.total,
      fechaVencimiento: form.fechaVencimiento,
      fechaElaboracion: new Date().toISOString().split('T')[0],
      mesesVidaUtil: 0,
    })

    setStatus(result.success ? 'success' : 'error')
    setMessage(result.message)

    if (result.success) {
      setForm({
        producto: '',
        cantidad: 1,
        neto: 0,
        iva: 0,
        total: 0,
        fechaVencimiento: '',
      })
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="card space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-7 h-7 text-rosa-intenso" />
        Ingreso de Factura
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
          <label className="label-field">Producto</label>
          <input
            type="text"
            value={form.producto}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, producto: e.target.value }))
            }
            className="input-field"
            placeholder="Nombre del producto..."
            required
          />
        </div>

        <div>
          <label className="label-field">Cantidad</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  cantidad: Math.max(1, prev.cantidad - 1),
                }))
              }
              className="w-14 h-14 bg-lavanda rounded-xl text-2xl font-bold hover:bg-purple-400 transition-colors"
            >
              <Minus className="w-6 h-6 mx-auto" />
            </button>
            <input
              type="number"
              min="1"
              value={form.cantidad}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  cantidad: Number(e.target.value),
                }))
              }
              className="input-field text-center w-20"
            />
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, cantidad: prev.cantidad + 1 }))
              }
              className="w-14 h-14 bg-lavanda rounded-xl text-2xl font-bold hover:bg-purple-400 transition-colors"
            >
              <Plus className="w-6 h-6 mx-auto" />
            </button>
          </div>
        </div>

        <div className="card bg-lavanda/10 border-2 border-lavanda">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-lavanda" />
            <h3 className="font-bold text-lg">Desglose de Precios</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label-field">Valor Neto ($)</label>
              <input
                type="number"
                value={form.neto || ''}
                onChange={(e) => handleNetoChange(Number(e.target.value))}
                className="input-field"
                placeholder="Ingrese valor neto..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl">
                <p className="text-sm text-gray-500">IVA (19%)</p>
                <p className="text-xl font-bold text-lavanda">
                  ${form.iva.toLocaleString('es-CL')}
                </p>
              </div>
              <div className="p-3 bg-rosa-intenso/10 rounded-xl">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-rosa-intenso">
                  ${form.total.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="label-field">Fecha de Vencimiento</label>
          <input
            type="date"
            value={form.fechaVencimiento}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                fechaVencimiento: e.target.value,
              }))
            }
            className="input-field"
          />
        </div>

        <button type="submit" className="btn-primary w-full py-5 text-xl">
          Registrar Lote
        </button>
      </form>
    </div>
  )
}

function ExpiryCalculator() {
  const [form, setForm] = useState({
    producto: '',
    fechaElaboracion: '',
    meses: 12,
  })
  const [calculatedDate, setCalculatedDate] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const calculateExpiry = () => {
    if (!form.fechaElaboracion || !form.meses) return

    const elaboration = new Date(form.fechaElaboracion)
    elaboration.setMonth(elaboration.getMonth() + form.meses)

    const year = elaboration.getFullYear()
    const month = String(elaboration.getMonth() + 1).padStart(2, '0')
    const day = String(elaboration.getDate()).padStart(2, '0')

    setCalculatedDate(`${year}-${month}-${day}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!calculatedDate || !form.producto) return

    const result = await submitInvoice({
      producto: form.producto,
      cantidad: 1,
      neto: 0,
      iva: 0,
      total: 0,
      fechaVencimiento: calculatedDate,
      fechaElaboracion: form.fechaElaboracion,
      mesesVidaUtil: form.meses,
    })

    setStatus(result.success ? 'success' : 'error')
    setMessage(result.message)

    if (result.success) {
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="card space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Calendar className="w-7 h-7 text-rosa-intenso" />
        Calculadora de Vencimiento
      </h2>

      <p className="text-gray-600">
        Si el producto no tiene fecha de vencimiento, calcula automáticamente
        usando la fecha de elaboración y los meses de vida útil.
      </p>

      {status === 'success' && (
        <div className="p-4 bg-green-100 border border-exito rounded-xl flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-exito" />
          <span className="font-semibold text-green-800">{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-field">Producto</label>
          <input
            type="text"
            value={form.producto}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, producto: e.target.value }))
            }
            className="input-field"
            placeholder="Nombre del producto..."
            required
          />
        </div>

        <div>
          <label className="label-field">Fecha de Elaboración</label>
          <input
            type="date"
            value={form.fechaElaboracion}
            onChange={(e) =>
              setForm((prev) => ({
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
            Meses de Vida Útil: {form.meses}
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={form.meses}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, meses: Number(e.target.value) }))
            }
            className="w-full accent-rosa-intenso"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>1 mes</span>
            <span>60 meses (5 años)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={calculateExpiry}
          className="btn-secondary w-full"
        >
          <Calculator className="w-5 h-5 inline mr-2" />
          Calcular Fecha de Vencimiento
        </button>

        {calculatedDate && (
          <div className="card bg-pastel border-2 border-rosa-intenso text-center">
            <p className="text-sm text-gray-500 mb-1">
              Fecha de Vencimiento Calculada
            </p>
            <p className="text-3xl font-extrabold text-rosa-intenso">
              {new Date(calculatedDate + 'T12:00:00').toLocaleDateString(
                'es-CL',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!calculatedDate}
          className="btn-primary w-full py-5 text-xl"
        >
          Registrar con Fecha Calculada
        </button>
      </form>
    </div>
  )
}
