import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { SwRegistrar } from '@/components/SwRegistrar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Global Notes',
  description: 'Capture anything instantly from anywhere',
  manifest: '/manifest.json',
  themeColor: '#171717',
  appleWebApp: { capable: true, title: 'Global Notes', statusBarStyle: 'black-translucent' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <SwRegistrar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
