import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'LaurAna - Tienda de abarrotes',
  description: 'Tienda de abarrotes LaurAna',
  icons: {
    icon: 'https://lh3.googleusercontent.com/u/0/d/1V4xHcUrNoDVtNaqUuPEyY703USi0KLf9',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-pastel text-carbon antialiased">
        <Header />
        <main className="pb-24 md:pb-8">{children}</main>
      </body>
    </html>
  )
}
