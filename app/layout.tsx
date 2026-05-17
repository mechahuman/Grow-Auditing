import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GROW Lead Intelligence',
  description: 'Internal lead scouting and research tool for YouTube creators.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
