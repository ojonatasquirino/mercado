"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReminderList from "@/components/reminder-list"
import ShoppingList from "@/components/shopping-list"
import SavedLists from "@/components/saved-lists"
import BudgetTracker from "@/components/budget-tracker"
import ScrollToTop from "@/components/scroll-to-top"
import ScrollToBottom from "@/components/scroll-to-bottom"

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

export interface SavedList {
  id: string
  name: string
  items: string[]
  createdAt: Date
}

export default function ShoppingApp() {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [savedLists, setSavedLists] = useState<SavedList[]>([])
  const [budget, setBudget] = useState<number>(0)

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedReminders = localStorage.getItem("reminders")
    const savedShoppingItems = localStorage.getItem("shoppingItems")
    const savedListsData = localStorage.getItem("savedLists")
    const savedBudget = localStorage.getItem("budget")

    if (savedReminders) {
      setReminders(JSON.parse(savedReminders))
    }
    if (savedShoppingItems) {
      setShoppingItems(JSON.parse(savedShoppingItems))
    }
    if (savedListsData) {
      setSavedLists(JSON.parse(savedListsData))
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
    localStorage.setItem("savedLists", JSON.stringify(savedLists))
  }, [savedLists])

  useEffect(() => {
    localStorage.setItem("budget", budget.toString())
  }, [budget])

  const addToShopping = (reminder: ReminderItem) => {
    const newShoppingItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: reminder.name,
      price: 0,
      quantity: 0,
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

  const totalSpent = shoppingItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const totalItems =
    reminders.length + shoppingItems.length + savedLists.reduce((sum, list) => sum + list.items.length, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Mercado</CardTitle>
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
                  <ShoppingList shoppingItems={shoppingItems} setShoppingItems={setShoppingItems} />
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
