"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"
import ReminderList from "@/components/reminder-list"
import ShoppingList from "@/components/shopping-list"
import SavedLists from "@/components/saved-lists"
import BudgetTracker from "@/components/budget-tracker"
import ScrollToTop from "@/components/scroll-to-top"
import ScrollToBottom from "@/components/scroll-to-bottom"
import PurchaseSummary from "@/components/purchase-summary"

export interface ReminderItem {
  id: string
  name: string
}

export interface ShoppingItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
}

export interface SavedList {
  id: string
  name: string
  items: string[]
  createdAt: Date
}

export const categories = [
  "Frutas",
  "Verduras",
  "Padaria",
  "Laticínios",
  "Carnes",
  "Higiene",
  "Limpeza",
  "Bebidas",
  "Outros",
] as const

export type Category = (typeof categories)[number]

export default function ShoppingApp() {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [savedLists, setSavedLists] = useState<SavedList[]>([])
  const [budget, setBudget] = useState<number>(0)
  const [showSummary, setShowSummary] = useState(false)

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedReminders = localStorage.getItem("reminders")
      const savedShoppingItems = localStorage.getItem("shoppingItems")
      const savedListsData = localStorage.getItem("savedLists")
      const savedBudget = localStorage.getItem("budget")

      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders)
        if (Array.isArray(parsedReminders)) {
          setReminders(parsedReminders)
        }
      }

      if (savedShoppingItems) {
        const parsedItems = JSON.parse(savedShoppingItems)
        if (Array.isArray(parsedItems)) {
          // Garantir que todos os itens tenham a propriedade category
          const itemsWithCategory = parsedItems.map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            name: item.name || "",
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0,
            category: item.category || "Outros",
          }))
          setShoppingItems(itemsWithCategory)
        }
      }

      if (savedListsData) {
        const parsedLists = JSON.parse(savedListsData)
        if (Array.isArray(parsedLists)) {
          const listsWithDates = parsedLists.map((list: any) => ({
            ...list,
            createdAt: new Date(list.createdAt || Date.now()),
          }))
          setSavedLists(listsWithDates)
        }
      }

      if (savedBudget) {
        const parsedBudget = Number(savedBudget)
        if (!isNaN(parsedBudget)) {
          setBudget(parsedBudget)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage:", error)
    }
  }, [])

  // Save data to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("reminders", JSON.stringify(reminders))
    } catch (error) {
      console.error("Erro ao salvar lembretes:", error)
    }
  }, [reminders])

  useEffect(() => {
    try {
      localStorage.setItem("shoppingItems", JSON.stringify(shoppingItems))
    } catch (error) {
      console.error("Erro ao salvar itens de compra:", error)
    }
  }, [shoppingItems])

  useEffect(() => {
    try {
      localStorage.setItem("savedLists", JSON.stringify(savedLists))
    } catch (error) {
      console.error("Erro ao salvar listas:", error)
    }
  }, [savedLists])

  useEffect(() => {
    try {
      localStorage.setItem("budget", budget.toString())
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error)
    }
  }, [budget])

  const addToShopping = (reminder: ReminderItem) => {
    const newShoppingItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: reminder.name,
      price: 0,
      quantity: 0,
      category: "Outros",
    }

    setShoppingItems([newShoppingItem, ...shoppingItems])
  }

  const addListToReminders = (list: SavedList) => {
    const newReminders = list.items.map((itemName) => ({
      id: crypto.randomUUID(),
      name: itemName,
    }))

    setReminders([...newReminders, ...reminders])
  }

  const handleFinalizePurchase = () => {
    if (shoppingItems.length === 0) return
    setShowSummary(true)
  }

  const totalSpent = shoppingItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    return sum + quantity * price
  }, 0)

  const totalItems =
    reminders.length + shoppingItems.length + savedLists.reduce((sum, list) => sum + list.items.length, 0)

  if (showSummary) {
    return (
      <PurchaseSummary
        shoppingItems={shoppingItems}
        totalSpent={totalSpent}
        onBack={() => setShowSummary(false)}
        onNewPurchase={() => {
          setShoppingItems([])
          setShowSummary(false)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto py-6 px-4">
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Mercado</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              desenvolvido com ❤️ por{" "}
              <a
                href="https://ojonatasquirino.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                ojonatasquirino.com
              </a>
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <BudgetTracker budget={budget} setBudget={setBudget} totalSpent={totalSpent} />

              <Tabs defaultValue="reminders" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="reminders" className="text-xs">
                    Lembretes
                    {reminders.length > 0 && <span className="ml-1">({reminders.length})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="shopping" className="text-xs">
                    Compras
                    {shoppingItems.length > 0 && <span className="ml-1">({shoppingItems.length})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="text-xs">
                    Listas
                    {savedLists.length > 0 && <span className="ml-1">({savedLists.length})</span>}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reminders" className="mt-6">
                  <ReminderList reminders={reminders} setReminders={setReminders} onAddToShopping={addToShopping} />
                </TabsContent>

                <TabsContent value="shopping" className="mt-6">
                  <div className="space-y-4">
                    <ShoppingList shoppingItems={shoppingItems} setShoppingItems={setShoppingItems} />

                    {shoppingItems.length > 0 && (
                      <Button
                        onClick={handleFinalizePurchase}
                        className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                      >
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        Finalizar Compra
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="saved" className="mt-6">
                  <SavedLists
                    savedLists={savedLists}
                    setSavedLists={setSavedLists}
                    onAddToReminders={addListToReminders}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <ScrollToTop itemCount={totalItems} />
        <ScrollToBottom itemCount={totalItems} />
      </div>
    </div>
  )
}
