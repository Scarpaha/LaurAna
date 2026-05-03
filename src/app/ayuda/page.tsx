'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ShoppingCart, Calculator, Package, FileText, AlertTriangle } from 'lucide-react'

interface AccordionItem {
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export default function AyudaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">Manual de Ayuda</h1>
        <p className="font-slogan text-lavanda text-lg">Cómo usar cada parte de la app</p>
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
          <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-bold text-lg">{item.title}</span>
            </div>
            {openIndex === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
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
        <p>Es tu cuaderno de ventas pero en la pantalla. Reemplaza el cuaderno físico.</p>
        <p>Arriba ves 3 números importantes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Inversión Total:</strong> cuánto compraste en facturas este mes</li>
          <li><strong>Meta de Venta:</strong> cuánto debes vender (compra + 20%)</li>
          <li><strong>Venta Real:</strong> cuánto has vendido hasta ahora</li>
        </ul>
        <p className="text-exito font-semibold">Si la barra llega a 100%, ¡ya cumpliste la meta!</p>
      </>
    ),
  },
  {
    title: '¿Cómo registrar la venta del día?',
    icon: <Calculator className="w-6 h-6 text-exito" />,
    content: (
      <>
        <ol className="list-decimal list-inside space-y-2">
          <li>Elige el tipo de venta: <strong>Venta con Boleta</strong>, <strong>Venta sin Boleta</strong> o <strong>Consumo Propio</strong>.</li>
          <li>Usa el <strong>teclado numérico</strong> grande para escribir el monto.</li>
          <li>Presiona <strong>&quot;Agregar al Día&quot;</strong>.</li>
        </ol>
        <p>El sistema suma automáticamente al total del día y del mes. Si te equivocaste, puedes <strong>editar</strong> o <strong>eliminar</strong> cualquier día en la tabla de abajo.</p>
        <p className="text-sm text-gray-500">El botón ⌫ borra el último número. El botón &quot;Limpiar&quot; borra todo.</p>
      </>
    ),
  },
  {
    title: 'Editar y Eliminar ventas',
    icon: <Calculator className="w-6 h-6 text-lavanda" />,
    content: (
      <>
        <p>En la tabla de historial, cada día tiene dos botones:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Lápiz (Editar):</strong> Cambia los montos de ese día directamente.</li>
          <li><strong>Basurero (Eliminar):</strong> Borra completamente ese día (pide confirmación).</li>
        </ul>
        <p className="text-sm text-gray-500">Si agregaste algo dos veces, solo edita el día y corrige el número.</p>
      </>
    ),
  },
  {
    title: 'Imprimir el mes',
    icon: <Package className="w-6 h-6 text-lavanda" />,
    content: (
      <>
        <p>Presiona el botón <strong>&quot;Imprimir Mes&quot;</strong> arriba de la tabla.</p>
        <p>Se abrirá la ventana de impresión con un resumen limpio de todo el mes, listo para imprimir o guardar como PDF.</p>
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
        <ol className="list-decimal list-inside space-y-2">
          <li>Elige el <strong>Tipo</strong> (Lácteos, Carnes, etc.).</li>
          <li>Escribe el <strong>Nombre</strong>.</li>
          <li>Agrega un <strong>Detalle</strong> si quieres (marca, pack, etc.).</li>
          <li>Pon la <strong>Cantidad</strong>.</li>
          <li>Elige si ingresas <strong>Valor Neto</strong> o <strong>Valor Total</strong> (con IVA). El sistema calcula el resto automáticamente.</li>
          <li>Para el vencimiento: si tiene fecha, ponla. Si no, pon fecha de elaboración + meses.</li>
          <li>Presiona <strong>&quot;Registrar Producto&quot;</strong>.</li>
        </ol>
      </>
    ),
  },
  {
    title: 'Ingreso por Factura (varios productos)',
    icon: <FileText className="w-6 h-6 text-lavanda" />,
    content: (
      <>
        <p>Para cuando llega un proveedor con muchos productos distintos.</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Elige si todos vencen en la <strong>misma fecha</strong> o <strong>distinta</strong>.</li>
          <li>Llena cada producto (Tipo, Nombre, Cantidad, Precio).</li>
          <li>Cada producto puede tener precio Neto o Total, se elige por producto.</li>
          <li>Dale a <strong>&quot;Agregar otro producto&quot;</strong> para añadir más.</li>
          <li>El total se calcula solo. Presiona <strong>&quot;Registrar Todos&quot;</strong>.</li>
          <li>Puedes imprimir la factura con el botón <strong>Imprimir</strong>.</li>
        </ol>
      </>
    ),
  },
]

const vencimientoItems: AccordionItem[] = [
  {
    title: '¿Cómo funciona Vencimientos?',
    icon: <AlertTriangle className="w-6 h-6 text-error" />,
    content: (
      <>
        <p>Muestra todos los productos con fecha de vencimiento, ordenados del que vence más pronto.</p>
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
        <p>Toca los números de arriba para filtrar. Cada tarjeta muestra: nombre, tipo, cantidad, fecha y días restantes.</p>
      </>
    ),
  },
]
