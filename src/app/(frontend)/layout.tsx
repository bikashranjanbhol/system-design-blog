import React from 'react'
import './styles.css'
import { SITE_NAME } from '@/components/Chrome'

export const metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: 'Plain-language articles on system design, ordered so each one builds on the last.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
