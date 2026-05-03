'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Calculator,
  Package,
  FileText,
  AlertTriangle,
} from 'lucide-react'

interface AccordionItem {
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export default function AyudaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">
          Manual de Ayuda
        </h1>
        <p className="font-slogan text-lavanda text-lg">
          Cómo usar cada parte de la app
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-rosa-intenso mb-4 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Para Papá: Ventas Diarias
          </h2>
          <Accordion items={seniorItems} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-rosa-intenso mb-4 flex items-center gap-2">
            <Package className="w-6 h-6" />
            Para Admin: Ingreso de Productos
          </h2>
          <Accordion items={adminItems} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-rosa-intenso mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Vencimientos y Alertas
          </h2>
          <Accordion items={vencimientoItems} />
        </div>
      </div>
    </div>
  )
}

function Accordion({ items }: { items: AccordionItem[] }) {
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

const seniorItems: AccordionItem[] = [
  {
    title: '¿Qué es el Cuaderno Digital?',
    icon: <ShoppingCart className="w-6 h-6 text-rosa-intenso" />,
    content: (
      <>
        <p>
          Es tu cuaderno de ventas pero en la pantalla. Reemplaza el cuaderno
          físico donde anotabas cada día.
        </p>
        <p>
          Lo que ves arriba son 3 números importantes:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Inversión Total:</strong> cuánto compraste en facturas este mes
          </li>
          <li>
            <strong>Meta de Venta:</strong> cuánto debes vender (compra + 20%)
          </li>
          <li>
            <strong>Venta Real:</strong> cuánto has vendido hasta ahora
          </li>
        </ul>
        <p className="text-exito font-semibold">
          Si la barra llega a 100%, ¡ya cumpliste la meta del mes!
        </p>
      </>
    ),
  },
  {
    title: '¿Cómo registrar la venta del día?',
    icon: <Calculator className="w-6 h-6 text-exito" />,
    content: (
      <>
        <p>Es muy simple, solo usa los botones con números:</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            Toca donde dice <strong>&quot;Venta con Boleta&quot;</strong> y usa el teclado numérico grande para poner el monto.
          </li>
          <li>
            Lo mismo para <strong>&quot;Venta sin Boleta&quot;</strong> (las ventas que no sacaron boleta).
          </li>
          <li>
            Lo mismo para <strong>&quot;Consumo Propio&quot;</strong> (lo que se llevó para la casa).
          </li>
          <li>
            El <strong>&quot;Total del Día&quot;</strong> se calcula solo (suma los tres).
          </li>
          <li>
            Presiona <strong>&quot;Guardar Venta del Día&quot;</strong>.
          </li>
        </ol>
        <p className="text-sm text-gray-500">
          El botón con flecha hacia atrás (⌫) borra el último número.
        </p>
      </>
    ),
  },
  {
    title: '¿Qué es la tabla de abajo?',
    icon: <ShoppingCart className="w-6 h-6 text-lavanda" />,
    content: (
      <>
        <p>
          Es el historial de todos los días que has guardado. Muestra:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Fecha:</strong> el día que registraste</li>
          <li><strong>Con Boleta:</strong> ventas con boleta</li>
          <li><strong>Sin Boleta:</strong> ventas sin boleta</li>
          <li><strong>Consumo:</strong> lo que se llevó para la casa</li>
          <li><strong>Total Día:</strong> la suma de todo</li>
          <li><strong>Total Semana:</strong> cuánto se acumuló esa semana</li>
          <li><strong>Total Mes:</strong> cuánto se acumuló ese mes</li>
        </ul>
      </>
    ),
  },
]

const adminItems: AccordionItem[] = [
  {
    title: 'Ingreso Individual de Producto',
    icon: <Package className="w-6 h-6 text-rosa-intenso" />,
    content: (
      <>
        <p>Usa esto cuando llegue un producto solo o pocos productos:</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            Elige el <strong>Tipo</strong> (Lácteos, Carnes, Embutidos, etc.).
          </li>
          <li>
            Escribe el <strong>Nombre</strong> (Ej: &quot;Vienesa Frankfurt&quot;).
          </li>
          <li>
            Opcional: agrega un <strong>Detalle</strong> (Ej: &quot;Marca Super, Pack x10&quot;).
          </li>
          <li>
            Pon la <strong>Cantidad</strong> de unidades.
          </li>
          <li>
            Ingresa el <strong>Costo Neto Unitario</strong> (precio sin IVA de cada unidad). El sistema calcula el IVA y total automáticamente.
          </li>
          <li>
            Para el <strong>vencimiento</strong> elige:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>
                <strong>Tiene fecha:</strong> pon la fecha directamente.
              </li>
              <li>
                <strong>No tiene fecha:</strong> pon la fecha de elaboración y cuántos meses dura. El sistema calcula automáticamente.
              </li>
            </ul>
          </li>
          <li>
            Presiona <strong>&quot;Registrar Producto&quot;</strong>.
          </li>
        </ol>
      </>
    ),
  },
  {
    title: 'Ingreso por Factura (varios productos juntos)',
    icon: <FileText className="w-6 h-6 text-lavanda" />,
    content: (
      <>
        <p>
          Usa esto cuando llega un proveedor con muchos productos distintos
          (Ej: vienesas, quesos, pâté, todo en la misma factura).
        </p>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            Elige si todos los productos tienen la <strong>misma fecha de vencimiento</strong> o si <strong>cada uno tiene la suya</strong>.
          </li>
          <li>
            Si es la misma fecha, ponla una sola vez arriba.
          </li>
          <li>
            Llena cada producto: <strong>Tipo, Nombre, Detalle, Cantidad, Costo Neto</strong>.
          </li>
          <li>
            Si cada uno tiene vencimiento distinto, elige &quot;Cada uno distinto&quot; y pon la fecha de cada producto.
          </li>
          <li>
            Para agregar otro producto, toca <strong>&quot;Agregar otro producto&quot;</strong>.
          </li>
          <li>
            El total de la factura se calcula solo. Presiona <strong>&quot;Registrar Todos los Productos&quot;</strong>.
          </li>
        </ol>
        <p className="text-sm text-gray-500">
          Cada producto se guarda como un lote separado, así pueden vencer en fechas distintas.
        </p>
      </>
    ),
  },
]

const vencimientoItems: AccordionItem[] = [
  {
    title: '¿Cómo funciona la página de Vencimientos?',
    icon: <AlertTriangle className="w-6 h-6 text-error" />,
    content: (
      <>
        <p>
          Esta página te muestra todos los productos que tienen fecha de vencimiento, ordenados desde el que vence más pronto.
        </p>
        <p>
          Hay 3 colores que te dicen qué tan urgente es:
        </p>
        <div className="space-y-2">
          <div className="p-3 bg-red-50 rounded-xl border border-error">
            <p className="font-bold text-error">Rojo (Crítico)</p>
            <p>Vence en menos de 7 días. ¡Hay que actuar ya!</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl border border-aviso">
            <p className="font-bold text-yellow-600">Amarillo (Alerta)</p>
            <p>Vence entre 7 y 15 días. Empieza a ofrecer descuento.</p>
          </div>
          <div className="p-3 bg-green-50 rounded-xl border border-exito">
            <p className="font-bold text-exito">Verde (OK)</p>
            <p>Vence en más de 15 días. Todo bien.</p>
          </div>
        </div>
        <p>
          Los números grandes de arriba te muestran cuántos hay en cada categoría. Puedes tocar cada uno para filtrar.
        </p>
        <p>
          Cada tarjeta muestra: nombre del producto, tipo, cantidad, fecha de vencimiento y cuántos días quedan.
        </p>
      </>
    ),
  },
]
