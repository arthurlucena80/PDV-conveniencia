import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Sora, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const sora = Sora({ 
  variable: '--font-sora', 
  subsets: ['latin'],
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Caderno PDV',
  description: 'Sistema de Comandas e Fiado para Conveniências',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${jetbrainsMono.variable} dark`} style={{ backgroundColor: '#0C0F0A' }}>
      <body className="antialiased" style={{ backgroundColor: '#0C0F0A', color: '#F4F6F3', fontFamily: 'var(--font-sora), system-ui, sans-serif' }}>
        {children}
        <Toaster 
          theme="dark" 
          position="top-right"
          richColors
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
