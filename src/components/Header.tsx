'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, BookOpen, ShoppingCart, Package, AlertTriangle } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Catálogo', icon: Store },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/admin', label: 'Productos', icon: Package },
  { href: '/vencimientos', label: 'Alertas', icon: AlertTriangle },
  { href: '/ayuda', label: 'Ayuda', icon: BookOpen },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <>
      <header className="bg-white shadow-md border-b-4 border-rosa-intenso sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex flex-col items-start">
            <span className="font-logo text-4xl text-rosa-intenso leading-none">
              LaurAna
            </span>
            <span className="font-slogan text-sm text-lavanda -mt-1">
              🛒Tienda de abarrotes
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-rosa-intenso text-white shadow-md'
                      : 'text-carbon hover:bg-lavanda/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-lavanda shadow-lg z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                  isActive ? 'text-rosa-intenso' : 'text-gray-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
