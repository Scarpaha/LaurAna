'use client'

import { useState } from 'react'
import {
  BookOpen,
  User,
  Shield,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ScanBarcode,
  FileText,
  Calendar,
  Image,
  Database,
  Code,
} from 'lucide-react'

type HelpSection = 'senior' | 'admin' | 'tech'

interface AccordionItem {
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export default function AyudaPage() {
  const [activeSection, setActiveSection] = useState<HelpSection>('senior')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">
          Manual de Ayuda
        </h1>
        <p className="font-slogan text-lavanda text-lg">
          Todo lo que necesitas saber
        </p>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-md">
        {[
          { id: 'senior' as HelpSection, label: 'Para Papá', icon: User },
          { id: 'admin' as HelpSection, label: 'Para Luis', icon: Shield },
          { id: 'tech' as HelpSection, label: 'Técnico', icon: Code },
        ].map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                activeSection === section.id
                  ? 'bg-rosa-intenso text-white shadow-md'
                  : 'text-carbon hover:bg-lavanda/20'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{section.label}</span>
            </button>
          )
        })}
      </div>

      {activeSection === 'senior' && <SeniorHelp />}
      {activeSection === 'admin' && <AdminHelp />}
      {activeSection === 'tech' && <TechHelp />}
    </div>
  )
}

function Accordion({
  items,
}: {
  items: AccordionItem[]
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="card overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-bold text-lg">{item.title}</span>
            </div>
            {openIndex === index ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {openIndex === index && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-gray-700">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SeniorHelp() {
  const items: AccordionItem[] = [
    {
      title: '¿Cómo ver los productos?',
      icon: <ShoppingCart className="w-6 h-6 text-rosa-intenso" />,
      content: (
        <>
          <p>
            Al entrar a la página principal, verás todos los productos de la
            tienda organizados en tarjetas grandes y fáciles de ver.
          </p>
          <p>
            Cada tarjeta muestra la <strong>foto</strong>, el{' '}
            <strong>nombre</strong>, el <strong>precio</strong> y la{' '}
            <strong>categoría</strong> del producto.
          </p>
          <p>
            Puedes <strong>buscar</strong> un producto escribiendo su nombre en
            la barra de búsqueda, o <strong>filtrar</strong> por categoría
            tocando los botones de colores.
          </p>
        </>
      ),
    },
    {
      title: '¿Cómo registrar una venta?',
      icon: <TrendingUp className="w-6 h-6 text-exito" />,
      content: (
        <>
          <p>
            Ve a la pestaña <strong>&quot;Papá&quot;</strong> en el menú de
            abajo (el ícono de persona).
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Toca el botón grande que dice <strong>&quot;Registrar Venta del
              Día&quot;</strong>.
            </li>
            <li>
              Selecciona el <strong>producto</strong> de la lista.
            </li>
            <li>
              Usa los botones <strong>+</strong> y <strong>-</strong> para
              elegir cuántas unidades se vendieron.
            </li>
            <li>
              Elige cómo pagó el cliente:{' '}
              <strong>Efectivo, Transferencia u Otro</strong>.
            </li>
            <li>
              Toca el botón rosa grande{' '}
              <strong>&quot;Registrar Venta&quot;</strong>.
            </li>
          </ol>
          <p className="text-exito font-semibold">
            ¡Listo! La venta queda guardada automáticamente.
          </p>
        </>
      ),
    },
    {
      title: '¿Qué significan los números de arriba?',
      icon: <TrendingUp className="w-6 h-6 text-lavanda" />,
      content: (
        <>
          <div className="space-y-3">
            <div className="p-3 bg-lavanda/10 rounded-xl">
              <p className="font-bold text-lavanda">Inversión Total</p>
              <p>Cuánto dinero se gastó en comprar todos los productos.</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <p className="font-bold text-yellow-600">Meta de Venta</p>
              <p>
                El objetivo de ventas del mes. Es 1.2 veces la inversión (o sea,
                ganar un 20% más).
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <p className="font-bold text-exito">Venta Real</p>
              <p>Cuánto se ha vendido hasta ahora. ¡Mientras más alto, mejor!</p>
            </div>
          </div>
          <p>
            La <strong>barra de progreso</strong> muestra qué tan cerca estás de
            llegar a la meta. Si llega al 100%, ¡felicitaciones!
          </p>
        </>
      ),
    },
    {
      title: '¿Qué son las alertas rojas?',
      icon: <AlertTriangle className="w-6 h-6 text-error" />,
      content: (
        <>
          <p>
            Las alertas rojas te avisan cuando un producto está{' '}
            <strong>próximo a vencer</strong> (en menos de 15 días).
          </p>
          <p>
            Esto es importante para que puedas{' '}
            <strong>ofrecer descuento</strong> o retirar el producto antes de que
            se venza.
          </p>
          <p>
            Cada alerta muestra el <strong>nombre del producto</strong>, la{' '}
            <strong>fecha de vencimiento</strong> y cuántas unidades quedan en{' '}
            <strong>stock</strong>.
          </p>
        </>
      ),
    },
  ]

  return <Accordion items={items} />
}

function AdminHelp() {
  const items: AccordionItem[] = [
    {
      title: 'Escáner de Código de Barras',
      icon: <ScanBarcode className="w-6 h-6 text-rosa-intenso" />,
      content: (
        <>
          <p>
            Ve a la pestaña <strong>&quot;Admin&quot;</strong> y selecciona{' '}
            <strong>&quot;Escáner&quot;</strong>.
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Toca <strong>&quot;Activar Cámara&quot;</strong> para usar la
              cámara del celular o computador.
            </li>
            <li>
              Apunta el código de barras del producto hacia la cámara. El
              sistema lo leerá automáticamente.
            </li>
            <li>
              Si el código se detecta, se mostrará toda la información del
              producto.
            </li>
          </ol>
          <p className="text-sm text-gray-500">
            También puedes escribir el código manualmente en el campo de texto y
            tocar &quot;Buscar&quot;.
          </p>
        </>
      ),
    },
    {
      title: 'Ingreso de Facturas',
      icon: <FileText className="w-6 h-6 text-lavanda" />,
      content: (
        <>
          <p>
            En la pestaña <strong>&quot;Facturas&quot;</strong> del panel Admin:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Ingresa el <strong>nombre del producto</strong>.
            </li>
            <li>
              Indica la <strong>cantidad</strong> de unidades del lote.
            </li>
            <li>
              Ingresa el <strong>Valor Neto</strong> (precio sin IVA). El
              sistema calcula automáticamente el IVA (19%) y el Total.
            </li>
            <li>
              Selecciona la <strong>fecha de vencimiento</strong> si la conoces.
            </li>
            <li>
              Toca <strong>&quot;Registrar Lote&quot;</strong>.
            </li>
          </ol>
          <p className="text-sm text-gray-500">
            El desglose de precios muestra: Neto, IVA (19%) y Total calculado.
          </p>
        </>
      ),
    },
    {
      title: 'Calculadora de Vencimiento',
      icon: <Calendar className="w-6 h-6 text-exito" />,
      content: (
        <>
          <p>
            Para productos que no tienen fecha de vencimiento impresa:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Ingresa el <strong>nombre del producto</strong>.
            </li>
            <li>
              Selecciona la <strong>Fecha de Elaboración</strong> (la fecha en
              que se fabricó).
            </li>
            <li>
              Usa el deslizador para indicar los{' '}
              <strong>Meses de Vida Útil</strong> (de 1 a 60 meses).
            </li>
            <li>
              Toca <strong>&quot;Calcular Fecha de Vencimiento&quot;</strong>.
            </li>
            <li>
              El sistema muestra la fecha calculada. Si está correcta, toca{' '}
              <strong>&quot;Registrar con Fecha Calculada&quot;</strong>.
            </li>
          </ol>
          <p className="text-sm text-gray-500">
            Fórmula: Fecha Vencimiento = Fecha Elaboración + Meses de Vida Útil
          </p>
        </>
      ),
    },
  ]

  return <Accordion items={items} />
}

function TechHelp() {
  const items: AccordionItem[] = [
    {
      title: 'Arquitectura del Proyecto',
      icon: <Database className="w-6 h-6 text-rosa-intenso" />,
      content: (
        <>
          <div className="space-y-2 text-sm font-mono">
            <p className="font-sans font-bold">Estructura de carpetas:</p>
            <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
{`src/
├── app/
│   ├── layout.tsx        # Layout principal
│   ├── page.tsx          # Catálogo público
│   ├── globals.css       # Estilos globales
│   ├── senior/page.tsx   # Panel Papá
│   ├── admin/page.tsx    # Panel Admin
│   └── ayuda/page.tsx    # Manual de ayuda
├── lib/
│   ├── api.ts            # API Google Sheets
│   └── constants.ts      # Constantes
└── components/
    ├── Header.tsx         # Navegación
    └── ProductCard.tsx    # Tarjeta producto`}
            </pre>
          </div>
          <p className="text-sm">
            <strong>Framework:</strong> Next.js 15 (App Router) + React 19
          </p>
          <p className="text-sm">
            <strong>Estilos:</strong> Tailwind CSS 3 con configuración custom
          </p>
          <p className="text-sm">
            <strong>Backend:</strong> Google Apps Script (Google Sheets como DB)
          </p>
        </>
      ),
    },
    {
      title: 'Integración con Google Sheets',
      icon: <Database className="w-6 h-6 text-lavanda" />,
      content: (
        <>
          <p className="text-sm">
            La comunicación con Google Sheets se realiza mediante un{' '}
            <strong>Google Apps Script</strong> desplegado como web app.
          </p>
          <p className="text-sm mt-2">
            <strong>Endpoints disponibles:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm font-mono">
            <li>GET ?action=getProductos</li>
            <li>GET ?action=getVentasResumen</li>
            <li>GET ?action=getProductosPorVencer&amp;days=15</li>
            <li>POST action=registrarVenta</li>
            <li>POST action=registrarLote</li>
          </ul>
          <p className="text-sm mt-2">
            <strong>Nota:</strong> El Apps Script debe estar configurado para
            aceptar solicitudes CORS desde cualquier origen.
          </p>
        </>
      ),
    },
    {
      title: 'Manejo de Imágenes de Google Drive',
      icon: <Image className="w-6 h-6 text-exito" />,
      content: (
        <>
          <p className="text-sm">
            Los links de Google Drive no funcionan directamente en etiquetas{' '}
            <code>&lt;img&gt;</code>. Se convierten automáticamente.
          </p>
          <div className="space-y-2 text-sm mt-2">
            <p>
              <strong>Link original:</strong>
            </p>
            <code className="block bg-gray-100 p-2 rounded text-xs break-all">
              https://drive.google.com/file/d/ID_DE_LA_FOTO/view
            </code>
            <p className="mt-2">
              <strong>Link convertido (para web):</strong>
            </p>
            <code className="block bg-gray-100 p-2 rounded text-xs break-all">
              https://lh3.googleusercontent.com/u/0/d/ID_DE_LA_FOTO
            </code>
          </div>
          <p className="text-sm mt-2">
            La función <code>convertDriveImageUrl()</code> en{' '}
            <code>src/lib/api.ts</code> realiza esta conversión automáticamente.
            Si la imagen falla, se usa una imagen por defecto.
          </p>
        </>
      ),
    },
    {
      title: 'Paleta de Colores',
      icon: <Database className="w-6 h-6 text-rosa-intenso" />,
      content: (
        <>
          <div className="space-y-2">
            {[
              { name: 'Fondo General', color: '#FFEBEE', cls: 'bg-pastel' },
              { name: 'Navegación/Iconos', color: '#D1A7E1', cls: 'bg-lavanda' },
              { name: 'Botones/Acciones', color: '#F06292', cls: 'bg-rosa-intenso' },
              { name: 'Texto', color: '#1A1A1A', cls: 'bg-carbon' },
              { name: 'Éxito', color: '#66BB6A', cls: 'bg-exito' },
              { name: 'Aviso', color: '#FFD54F', cls: 'bg-aviso' },
              { name: 'Error', color: '#EF5350', cls: 'bg-error' },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${c.cls} shadow-md`} />
                <span className="text-sm font-mono">{c.color}</span>
                <span className="text-sm text-gray-600">{c.name}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      title: 'Instalación y Desarrollo',
      icon: <Code className="w-6 h-6 text-lavanda" />,
      content: (
        <>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Requisitos:</strong> Node.js 18+ y npm
            </p>
            <ol className="list-decimal list-inside space-y-1 font-mono">
              <li>npm install</li>
              <li>npm run dev</li>
              <li>
                Abrir{' '}
                <span className="text-rosa-intenso">
                  http://localhost:3000
                </span>
              </li>
            </ol>
            <p className="mt-2">
              <strong>Producción:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 font-mono">
              <li>npm run build</li>
              <li>npm start</li>
            </ol>
          </div>
        </>
      ),
    },
  ]

  return <Accordion items={items} />
}
