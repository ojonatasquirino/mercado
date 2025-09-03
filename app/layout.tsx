import type React from "react"
import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mercado - Lista de Compras",
  description: "Aplicativo intuitivo para gerenciar suas compras e orçamento",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={jetbrainsMono.className}>{children}</body>
    </html>
  )
}
