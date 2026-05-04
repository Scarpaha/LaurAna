#!/usr/bin/env node
// Simple importer: reads first sheet of provided xlsx and imports into Sheets via Apps Script
// Requires: npm i xlsx (SheetJS)
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVoOt1ho2uHnGPzzze9kIIkvxjk5oVh47ZKjUEyUfV-Mqe1XWFONpDeBemtOkpHVKfCw/exec'

async function writeRow(sheetName, values) {
  const payload = { targetSheet: sheetName, values }
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  try {
    const data = await res.json()
    return data
  } catch (e) {
    return { success: true, message: 'Written (no JSON response)' }
  }
}

async function main() {
  const filePath = process.argv[2] || path.resolve(process.cwd(), 'Sistema_Gestion_Almacen_V1.xlsx')
  if (!fs.existsSync(filePath)) {
    console.error('xlsx file not found:', filePath)
    process.exit(1)
  }
  console.log('Reading', filePath)
  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  for (const r of rows) {
    const codigoBarras = String(r['Código de Barras'] || r['CodigoBarras'] || '')
    const nombre = String(r['Nombre del Producto'] || r['Nombre'] || r.Producto || '')
    const categoria = String(r['Categoría'] || r['Categoria'] || r.Categoria || r.Tipo || '')
    const precioCliente = Number(r['Precio al Cliente'] || r['Precio'] || r.Precio || 0)
    const imagen = String(r['Link de la Imagen'] || r['LinkImagen'] || r.Imagen || '')

    if (!nombre) continue

    // Solo registramos en Maestro_Productos para el catálogo
    // No escribimos en Inventario_Lotes para evitar afectar inversión
    await writeRow('Maestro_Productos', [codigoBarras, nombre, categoria, 0, precioCliente, imagen])
  }
  console.log('Import completed')
}

main().catch((e) => {
  console.error('Import error', e)
  process.exit(1)
})
