"use client"

import { useState } from "react"
import { ArrowLeft, Download, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ShoppingItem } from "@/app/page"
import jsPDF from "jspdf"

interface PurchaseSummaryProps {
  shoppingItems: ShoppingItem[]
  totalSpent: number
  onBack: () => void
  onNewPurchase: () => void
}

export default function PurchaseSummary({ shoppingItems, totalSpent, onBack, onNewPurchase }: PurchaseSummaryProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Calcular totais por categoria
  const categoryTotals = shoppingItems.reduce(
    (acc, item) => {
      const total = item.quantity * item.price
      acc[item.category] = (acc[item.category] || 0) + total
      return acc
    },
    {} as Record<string, number>,
  )

  const maxCategoryValue = Math.max(...Object.values(categoryTotals))

  // Agrupar itens por categoria
  const itemsByCategory = shoppingItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, ShoppingItem[]>,
  )

  const generatePDF = async () => {
    setIsGeneratingPDF(true)

    try {
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = 210
      const margin = 20
      let yPosition = 30

      // Cabeçalho
      pdf.setFontSize(20)
      pdf.text("MERCADO", pageWidth / 2, yPosition, { align: "center" })

      yPosition += 10
      pdf.setFontSize(12)
      pdf.text("Lista de Compras", pageWidth / 2, yPosition, { align: "center" })

      yPosition += 8
      pdf.setFontSize(10)
      pdf.text(new Date().toLocaleDateString("pt-BR"), pageWidth / 2, yPosition, { align: "center" })

      yPosition += 20

      // Lista por categoria
      Object.entries(itemsByCategory)
        .sort(
          ([, a], [, b]) =>
            b.reduce((sum, item) => sum + item.quantity * item.price, 0) -
            a.reduce((sum, item) => sum + item.quantity * item.price, 0),
        )
        .forEach(([category, items]) => {
          const categoryTotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

          // Verificar se precisa de nova página
          if (yPosition > 250) {
            pdf.addPage()
            yPosition = 30
          }

          // Nome da categoria
          pdf.setFontSize(14)
          pdf.setFont("helvetica", "bold")
          pdf.text(`${category.toUpperCase()} - R$ ${categoryTotal.toFixed(2)}`, margin, yPosition)
          yPosition += 8

          // Linha separadora
          pdf.setLineWidth(0.5)
          pdf.line(margin, yPosition, pageWidth - margin, yPosition)
          yPosition += 5

          // Itens da categoria
          pdf.setFontSize(10)
          pdf.setFont("helvetica", "normal")

          items.forEach((item) => {
            const subtotal = item.quantity * item.price
            const itemText = `${item.name} - ${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${subtotal.toFixed(2)}`

            // Verificar se precisa de nova página
            if (yPosition > 270) {
              pdf.addPage()
              yPosition = 30
            }

            pdf.text(itemText, margin + 5, yPosition)
            yPosition += 5
          })

          yPosition += 5 // Espaço entre categorias
        })

      // Total geral
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 30
      }

      yPosition += 10
      pdf.setLineWidth(1)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text(`TOTAL GERAL: R$ ${totalSpent.toFixed(2)}`, pageWidth / 2, yPosition, { align: "center" })

      yPosition += 8
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `${shoppingItems.length} ${shoppingItems.length === 1 ? "item" : "itens"} comprados`,
        pageWidth / 2,
        yPosition,
        { align: "center" },
      )

      pdf.save("nota-compra.pdf")
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Resumo da Compra</h1>
        </div>

        <div className="space-y-6">
          {/* Gráfico por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" style={{ maxWidth: "400px" }}>
                {Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, total]) => {
                    const percentage = (total / maxCategoryValue) * 100
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{category}</span>
                          <span>R$ {total.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Lista por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Itens por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(itemsByCategory)
                  .sort(
                    ([, a], [, b]) =>
                      b.reduce((sum, item) => sum + item.quantity * item.price, 0) -
                      a.reduce((sum, item) => sum + item.quantity * item.price, 0),
                  )
                  .map(([category, items]) => {
                    const categoryTotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center font-semibold text-sm border-b pb-1">
                          <span>{category}</span>
                          <span>R$ {categoryTotal.toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 ml-3">
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                              <span>
                                {item.name} - {item.quantity}x R$ {item.price.toFixed(2)}
                              </span>
                              <span>R$ {(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Total Geral */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total Geral:</span>
                <span className="text-2xl font-bold text-green-600">R$ {totalSpent.toFixed(2)}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {shoppingItems.length} {shoppingItems.length === 1 ? "item" : "itens"} comprados
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 mt-6">
          <Button onClick={generatePDF} disabled={isGeneratingPDF} className="flex-1 h-12">
            <Download className="h-5 w-5 mr-2" />
            {isGeneratingPDF ? "Gerando..." : "Exportar PDF"}
          </Button>
          <Button onClick={onNewPurchase} variant="outline" className="flex-1 h-12 bg-transparent">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Nova Compra
          </Button>
        </div>
      </div>
    </div>
  )
}
