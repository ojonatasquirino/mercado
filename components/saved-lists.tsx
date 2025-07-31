"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, List, X, Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { SavedList } from "@/app/page"

interface SavedListsProps {
  savedLists: SavedList[]
  setSavedLists: (lists: SavedList[]) => void
  onAddToReminders: (list: SavedList) => void
}

export default function SavedLists({ savedLists, setSavedLists, onAddToReminders }: SavedListsProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newListItems, setNewListItems] = useState<string[]>([])
  const [currentItem, setCurrentItem] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingItems, setEditingItems] = useState<string[]>([])

  const startCreating = () => {
    setIsCreating(true)
    setNewListName("")
    setNewListItems([])
    setCurrentItem("")
  }

  const addItemToNewList = () => {
    if (currentItem.trim() === "") return
    setNewListItems([...newListItems, currentItem.trim()])
    setCurrentItem("")
  }

  const removeItemFromNewList = (index: number) => {
    setNewListItems(newListItems.filter((_, i) => i !== index))
  }

  const saveNewList = () => {
    if (newListName.trim() === "" || newListItems.length === 0) return

    const newList: SavedList = {
      id: crypto.randomUUID(),
      name: newListName.trim(),
      items: newListItems,
      createdAt: new Date(),
    }

    setSavedLists([newList, ...savedLists])
    setIsCreating(false)
    setNewListName("")
    setNewListItems([])
    setCurrentItem("")
  }

  const cancelCreating = () => {
    setIsCreating(false)
    setNewListName("")
    setNewListItems([])
    setCurrentItem("")
  }

  const startEditing = (list: SavedList) => {
    setEditingId(list.id)
    setEditingName(list.name)
    setEditingItems([...list.items])
  }

  const addItemToEditList = () => {
    if (currentItem.trim() === "") return
    setEditingItems([...editingItems, currentItem.trim()])
    setCurrentItem("")
  }

  const removeItemFromEditList = (index: number) => {
    setEditingItems(editingItems.filter((_, i) => i !== index))
  }

  const saveEdit = () => {
    if (editingName.trim() === "" || editingItems.length === 0) return

    setSavedLists(
      savedLists.map((list) =>
        list.id === editingId ? { ...list, name: editingName.trim(), items: editingItems } : list,
      ),
    )
    setEditingId(null)
    setEditingName("")
    setEditingItems([])
    setCurrentItem("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName("")
    setEditingItems([])
    setCurrentItem("")
  }

  const deleteList = (id: string) => {
    setSavedLists(savedLists.filter((list) => list.id !== id))
  }

  const handleAddToReminders = (list: SavedList) => {
    onAddToReminders(list)
  }

  return (
    <div className="space-y-4">
      {!isCreating && (
        <Button onClick={startCreating} className="w-full h-12 text-base">
          <Plus className="h-5 w-5 mr-2" />
          Nova Lista
        </Button>
      )}

      {isCreating && (
        <div className="p-4 border rounded-lg bg-card space-y-4">
          <div className="space-y-2">
            <Label htmlFor="list-name">Nome da Lista</Label>
            <Input
              id="list-name"
              type="text"
              placeholder="Ex: Compras do Mês, Lista Básica..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-item">Adicionar Item</Label>
            <div className="flex gap-2">
              <Input
                id="new-item"
                type="text"
                placeholder="Ex: Leite, Pão, Arroz..."
                value={currentItem}
                onChange={(e) => setCurrentItem(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addItemToNewList()}
                className="text-base flex-1"
              />
              <Button onClick={addItemToNewList} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {newListItems.length > 0 && (
            <div className="space-y-2">
              <Label>Itens da Lista ({newListItems.length})</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {newListItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{item}</span>
                    <Button
                      onClick={() => removeItemFromNewList(index)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={saveNewList}
              className="flex-1"
              disabled={newListName.trim() === "" || newListItems.length === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Salvar Lista
            </Button>
            <Button onClick={cancelCreating} variant="outline" className="flex-1 bg-transparent">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {savedLists.length > 0 && (
        <div className="space-y-3">
          {savedLists.map((list) => (
            <div key={list.id} className="p-4 border rounded-lg bg-card">
              {editingId === list.id ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Lista</Label>
                    <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="text-base" />
                  </div>

                  <div className="space-y-2">
                    <Label>Adicionar Item</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Novo item..."
                        value={currentItem}
                        onChange={(e) => setCurrentItem(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addItemToEditList()}
                        className="text-base flex-1"
                      />
                      <Button onClick={addItemToEditList} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {editingItems.length > 0 && (
                    <div className="space-y-2">
                      <Label>Itens ({editingItems.length})</Label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {editingItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{item}</span>
                            <Button
                              onClick={() => removeItemFromEditList(index)}
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={saveEdit} className="flex-1">
                      Salvar
                    </Button>
                    <Button onClick={cancelEdit} variant="outline" className="flex-1 bg-transparent">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base">{list.name}</h3>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleAddToReminders(list)}
                        size="icon"
                        className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
                        title="Adicionar aos Lembretes"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => startEditing(list)} variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => deleteList(list.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {list.items.length} {list.items.length === 1 ? "item" : "itens"}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {list.items.map((item, index) => (
                      <div key={index} className="p-1 text-muted-foreground">
                        • {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {savedLists.length === 0 && !isCreating && (
        <div className="text-center py-8 text-muted-foreground">
          <List className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-base">Nenhuma lista salva ainda.</p>
          <p className="text-sm mt-1">Crie listas para reutilizar mensalmente!</p>
        </div>
      )}
    </div>
  )
}
