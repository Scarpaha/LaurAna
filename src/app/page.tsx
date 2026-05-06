'use client'

import { useState, useEffect } from 'react'
import { fetchMaestroProductos, type Producto } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import { Search, Loader2, PackageX } from 'lucide-react'

export default function CatalogoPage() {
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchMaestroProductos()
      setProducts(data)
      setLoading(false)
    }
    load()
  }, [])

  const categories = [
    'Todas',
    ...Array.from(new Set(products.map((p) => p.categoria))).sort(),
  ]

  const filtered = products.filter((p) => {
    const matchesSearch = p.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'Todas' || p.categoria === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h1 className="font-logo text-5xl text-rosa-intenso mb-2">
          Nuestro Catálogo
        </h1>
        <p className="font-slogan text-lavanda text-lg">
          Todo lo que necesitas, cerca de ti
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3 bg-white rounded-xl border-2 border-lavanda px-4 py-3 focus-within:border-rosa-intenso focus-within:ring-2 focus-within:ring-pink-200 transition-all">
          <Search className="w-6 h-6 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar productos por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none text-lg text-carbon placeholder-gray-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rosa-intenso text-white shadow-md'
                  : 'bg-white text-carbon border-2 border-lavanda hover:bg-lavanda/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-rosa-intenso animate-spin" />
          <p className="mt-4 text-lg text-gray-500">Cargando productos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PackageX className="w-16 h-16 text-gray-300" />
          <p className="mt-4 text-xl text-gray-500">
            No se encontraron productos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((product) => (
            <ProductCard
              key={product.codigoBarras || product.nombre}
              nombre={product.nombre}
              categoria={product.categoria}
              precioCliente={product.precioCliente}
              imagen={product.imagen}
            />
          ))}
        </div>
      )}
    </div>
  )
}
