"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit2, Trash2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ReminderItem } from "@/app/page"

interface ReminderListProps {
  reminders: ReminderItem[]
  setReminders: (reminders: ReminderItem[]) => void
  onAddToShopping: (reminder: ReminderItem) => void
}

export default function ReminderList({ reminders, setReminders, onAddToShopping }: ReminderListProps) {
  const [newItemName, setNewItemName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const addReminder = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemName.trim() === "") return

    const newReminder: ReminderItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
    }

    setReminders([...reminders, newReminder])
    setNewItemName("")
  }

  const startEditing = (reminder: ReminderItem) => {
    setEditingId(reminder.id)
    setEditingName(reminder.name)
  }

  const saveEdit = () => {
    if (editingName.trim() === "") return

    setReminders(
      reminders.map((reminder) => (reminder.id === editingId ? { ...reminder, name: editingName.trim() } : reminder)),
    )
    setEditingId(null)
    setEditingName("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName("")
  }

  const removeReminder = (id: string) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id))
  }

  const handleAddToShopping = (reminder: ReminderItem) => {
    onAddToShopping(reminder)
    removeReminder(reminder.id)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addReminder} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="reminder-name">Novo lembrete</Label>
          <Input
            id="reminder-name"
            type="text"
            placeholder="Ex: Leite, Pão, Frutas..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="text-base"
          />
        </div>
        <Button type="submit" className="w-full h-12 text-base">
          <Plus className="h-5 w-5 mr-2" />
          Adicionar Lembrete
        </Button>
      </form>

      {reminders.length > 0 ? (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="p-3 border rounded-lg bg-card">
              {editingId === reminder.id ? (
                <div className="space-y-3">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="text-base"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} size="sm" className="flex-1">
                      Salvar
                    </Button>
                    <Button onClick={cancelEdit} variant="outline" size="sm" className="flex-1 bg-transparent">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-base">{reminder.name}</span>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleAddToShopping(reminder)}
                      size="icon"
                      className="h-9 w-9 bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => startEditing(reminder)} variant="ghost" size="icon" className="h-9 w-9">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => removeReminder(reminder.id)}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-base">Nenhum lembrete ainda.</p>
          <p className="text-sm mt-1">Adicione itens que deseja lembrar de comprar!</p>
        </div>
      )}
    </div>
  )
}
