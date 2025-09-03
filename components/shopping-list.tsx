"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { ShoppingItem } from "@/app/page"
import { categories } from "@/app/page"

interface ShoppingListProps {
  shoppingItems: ShoppingItem[]
  setShoppingItems: (items: ShoppingItem[]) => void
}

export default function ShoppingList({ shoppingItems, setShoppingItems }: ShoppingListProps) {
  const updateItem = (id: string, updates: Partial<ShoppingItem>) => {
    setShoppingItems(shoppingItems.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  const removeItem = (id: string) => {
    setShoppingItems(shoppingItems.filter((item) => item.id !== id))
  }

  const clearList = () => {
    setShoppingItems([])
  }

  const total = shoppingItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    return sum + quantity * price
  }, 0)

  return (
    <div className="space-y-4">
      {shoppingItems.length > 0 ? (
        <>
          <div className="space-y-3">
            {shoppingItems.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-base">{item.name}</h3>
                  <Button
                    onClick={() => removeItem(item.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                      className="text-base h-10"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço Unit.</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price || ""}
                      onChange={(e) => updateItem(item.id, { price: Number(e.target.value) || 0 })}
                      className="text-base h-10"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Categoria</Label>
                    <Select value={item.category} onValueChange={(value) => updateItem(item.id, { category: value })}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subtotal</Label>
                    <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center text-base font-medium">
                      R$ {((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-xl font-bold text-primary">R$ {total.toFixed(2)}</span>
          </div>

          <Button onClick={clearList} variant="destructive" className="w-full h-12 text-base">
            <Trash2 className="h-5 w-5 mr-2" />
            Limpar Lista de Compras
          </Button>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-base">Lista de compras vazia.</p>
          <p className="text-sm mt-1">Adicione itens dos seus lembretes!</p>
        </div>
      )}
    </div>
  )
}
