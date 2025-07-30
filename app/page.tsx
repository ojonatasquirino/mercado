"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReminderList from "@/components/reminder-list"
import ShoppingList from "@/components/shopping-list"
import BudgetTracker from "@/components/budget-tracker"
import ScrollToTop from "@/components/scroll-to-top"

export interface ReminderItem {
  id: string
  name: string
}

export interface ShoppingItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function ShoppingApp() {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [budget, setBudget] = useState<number>(0)

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedReminders = localStorage.getItem("reminders")
    const savedShoppingItems = localStorage.getItem("shoppingItems")
    const savedBudget = localStorage.getItem("budget")

    if (savedReminders) {
      setReminders(JSON.parse(savedReminders))
    }
    if (savedShoppingItems) {
      setShoppingItems(JSON.parse(savedShoppingItems))
    }
    if (savedBudget) {
      setBudget(Number(savedBudget))
    }
  }, [])

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("reminders", JSON.stringify(reminders))
  }, [reminders])

  useEffect(() => {
    localStorage.setItem("shoppingItems", JSON.stringify(shoppingItems))
  }, [shoppingItems])

  useEffect(() => {
    localStorage.setItem("budget", budget.toString())
  }, [budget])

  const addToShopping = (reminder: ReminderItem) => {
    const newShoppingItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: reminder.name,
      price: 0,
      quantity: 1,
    }

    setShoppingItems([...shoppingItems, newShoppingItem])
  }

  const totalSpent = shoppingItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const totalItems = reminders.length + shoppingItems.length

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Lista de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <BudgetTracker budget={budget} setBudget={setBudget} totalSpent={totalSpent} />

              <Tabs defaultValue="reminders" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="reminders" className="text-sm">
                    Lembretes
                    {reminders.length > 0 && <span className="ml-1">({reminders.length})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="shopping" className="text-sm">
                    Compras
                    {shoppingItems.length > 0 && <span className="ml-1">({shoppingItems.length})</span>}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reminders" className="mt-6">
                  <ReminderList reminders={reminders} setReminders={setReminders} onAddToShopping={addToShopping} />
                </TabsContent>

                <TabsContent value="shopping" className="mt-6">
                  <ShoppingList shoppingItems={shoppingItems} setShoppingItems={setShoppingItems} />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <ScrollToTop itemCount={totalItems} />
      </div>
    </div>
  )
}
