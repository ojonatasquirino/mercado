"use client"

import { useState } from "react"
import { DollarSign, Target, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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

  const percentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0
  const remaining = budget - totalSpent
  const isOverBudget = totalSpent > budget && budget > 0

  const getProgressColor = () => {
    if (percentage <= 50) return "bg-green-500"
    if (percentage <= 80) return "bg-yellow-500"
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

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
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
                  <span>Gasto: R$ {totalSpent.toFixed(2)}</span>
                  <span>Meta: R$ {budget.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}% do orçamento</span>
                    {getStatusMessage()}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Defina um orçamento para acompanhar seus gastos
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
