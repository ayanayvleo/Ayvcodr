import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AyvCodr - Build Powerful AI APIs",
  description: "Build powerful AI APIs without code. Visual workflow builder, enterprise security, analytics, and more.",
  generator: 'AyvCodr',
  icons: {
    icon: "/placeholder-logo.png",
    shortcut: "/placeholder-logo.png",
    apple: "/placeholder-logo.png"
  },
  manifest: "/manifest.json",
  themeColor: "#22c55e",
  openGraph: {
    title: "AyvCodr - Build Powerful AI APIs",
    description: "Build powerful AI APIs without code. Visual workflow builder, enterprise security, analytics, and more.",
    url: "https://ayvcodr.com",
    siteName: "AyvCodr",
    images: [
      {
        url: "/placeholder-logo.png",
        width: 512,
        height: 512,
        alt: "AyvCodr Logo"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AyvCodr - Build Powerful AI APIs",
    description: "Build powerful AI APIs without code. Visual workflow builder, enterprise security, analytics, and more.",
    images: ["/placeholder-logo.png"]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/placeholder-logo.png" />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="description" content="Build powerful AI APIs without code. Visual workflow builder, enterprise security, analytics, and more." />
        <meta property="og:title" content="AyvCodr - Build Powerful AI APIs" />
        <meta property="og:description" content="Build powerful AI APIs without code. Visual workflow builder, enterprise security, analytics, and more." />
        <meta property="og:image" content="/placeholder-logo.png" />
        <meta property="og:url" content="https://ayvcodr.com" />
        <meta property="og:site_name" content="AyvCodr" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AyvCodr - Build Powerful AI APIs" />
        <meta name="twitter:description" content="Build powerful AI APIs without code. Visual workflow builder, enterprise security, analytics, and more." />
        <meta name="twitter:image" content="/placeholder-logo.png" />
      </head>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  )
}
