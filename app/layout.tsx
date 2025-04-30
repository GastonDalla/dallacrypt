import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/themes/theme-provider"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "DallaCrypt - Military-grade encryption for your data",
  description:
    "Protect your sensitive information with AES-256 encryption, without storing anything on servers.",
  keywords: ["encryption", "privacy", "security", "AES-256", "encryption", "data protection", "zero-knowledge"],
  authors: [{ name: "Gaston Dalla", url: "https://anticheat.ac" }],
  creator: "Gaston Dalla",
  publisher: "Gaston Dalla",
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "DallaCrypt - Military-grade encryption for your data",
    description: "Protect your sensitive information with AES-256 encryption, without storing anything on servers.",
    url: "https://dallacrypt.vercel.app/",
    siteName: "DallaCrypt",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "DallaCrypt Logo"
      }
    ],
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "/icon-512x512.png",
        type: "image/png",
      }
    ],
  },
  metadataBase: new URL("https://dallacrypt.vercel.app"),
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary_large_image",
    title: "DallaCrypt - Military-grade encryption for your data",
    description: "Protect your sensitive information with AES-256 encryption, without storing anything on servers.",
    images: ["/icon-512x512.png"],
  },
  category: "technology",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="grain-overlay"></div>
          {children}
        </ThemeProvider>
        <Analytics/>
      </body>
    </html>
  )
}