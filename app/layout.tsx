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
    // "dark" class not set here — we default to dark via CSS :root variables.
    // The ThemeToggle component in the nav will add/remove the "light" class on <html>.
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
