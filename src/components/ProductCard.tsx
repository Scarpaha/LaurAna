'use client'

import Image from 'next/image'
import { useState } from 'react'
import { convertDriveImageUrl } from '@/lib/api'
import { DEFAULT_IMAGE } from '@/lib/constants'

interface ProductCardProps {
  nombre: string
  categoria: string
  imagen: string
}

export default function ProductCard({
  nombre,
  categoria,
  imagen,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const imgSrc = imgError ? DEFAULT_IMAGE : convertDriveImageUrl(imagen)

  return (
    <div className="card hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
      <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
        <Image
          src={imgSrc}
          alt={nombre}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
      <span className="badge badge-warning mb-2">{categoria}</span>
      <h3 className="font-bold text-lg text-carbon truncate">{nombre}</h3>
    </div>
  )
}
