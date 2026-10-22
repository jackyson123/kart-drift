import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bungee, Noto_Sans_TC } from 'next/font/google'
import './globals.css'

const bungee = Bungee({ weight: '400', subsets: ['latin'], variable: '--font-bungee' })
const notoSansTc = Noto_Sans_TC({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-noto-tc',
  preload: false,
})

export const metadata: Metadata = {
  title: 'Turbo Kart 極速道具賽車',
  description: '類似 Mario Kart 的 3D 道具賽車遊戲：抽道具、甩尾加速、閃避油漬、地雷與壓扁石塊等賽道陷阱。',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#102a43',
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hant" className={`${bungee.variable} ${notoSansTc.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
