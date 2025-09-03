"use client"

import { useState } from "react"
import { Target, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface BudgetTrackerProps {
  budget: number
  setBudget: (budget: number) => void
  totalSpent: number
}

export default function BudgetTracker({ budget, setBudget, totalSpent }: BudgetTrackerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempBudget, setTempBudget] = useState(budget.toString())

  const saveBudget = () => {
    const newBudget = Number(tempBudget) || 0
    setBudget(newBudget)
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setTempBudget(budget.toString())
    setIsEditing(false)
  }

  const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0
  const remaining = budget - totalSpent
  const isOverBudget = totalSpent > budget && budget > 0

  const getProgressColor = () => {
    if (percentage < 70) return "bg-green-500"
    if (percentage < 90) return "bg-yellow-500"
    if (percentage <= 100) return "bg-orange-500"
    return "bg-red-500"
  }

  const getProgressColorClass = () => {
    if (percentage < 70) return "bg-green-500"
    if (percentage < 90) return "bg-yellow-500"
    if (percentage <= 100) return "bg-orange-500"
    return "bg-red-500"
  }

  const getStatusMessage = () => {
    if (budget === 0) return null
    if (isOverBudget) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Extrapolou R$ {Math.abs(remaining).toFixed(2)}</span>
        </div>
      )
    }
    if (remaining > 0) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">Economizou R$ {remaining.toFixed(2)}</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Target className="h-4 w-4" />
        <span className="text-sm font-medium">Orçamento exato!</span>
      </div>
    )
  }

  const getStatusText = () => {
    if (budget === 0) return ""
    if (percentage < 70) return "Gastos controlados"
    if (percentage < 90) return "Atenção aos gastos"
    if (percentage <= 100) return "Próximo do limite"
    return "Orçamento ultrapassado"
  }

  const getStatusTextColor = () => {
    if (percentage < 70) return "text-green-600"
    if (percentage < 90) return "text-yellow-600"
    if (percentage <= 100) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Total Destacado de forma sutil */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Total Gasto</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">R$ {totalSpent.toFixed(2)}</div>
        </div>

        {/* Controle de Orçamento */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Orçamento</span>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              {budget > 0 ? "Editar" : "Definir"}
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="budget">Valor do orçamento</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                placeholder="0,00"
                className="text-base"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveBudget} size="sm" className="flex-1">
                Salvar
              </Button>
              <Button onClick={cancelEdit} variant="outline" size="sm" className="flex-1 bg-transparent">
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            {budget > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Meta: R$ {budget.toFixed(2)}</span>
                  <span>Restante: R$ {Math.max(0, remaining).toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  {/* Barra de progresso personalizada */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColorClass()}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}% usado</span>
                      {budget > 0 && (
                        <span className={`text-xs font-medium ${getStatusTextColor()}`}>• {getStatusText()}</span>
                      )}
                    </div>
                    {getStatusMessage()}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Defina um orçamento. Acompanhe os gastos.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
