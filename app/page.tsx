"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Plus, Trash, X, Pencil, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ChecklistItem {
  id: string;
  name: string;
  completed: boolean;
}

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newChecklistItemName, setNewChecklistItemName] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Load items from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem("shoppingItems");
    const savedChecklistItems = localStorage.getItem("checklistItems");

    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    if (savedChecklistItems) {
      setChecklistItems(JSON.parse(savedChecklistItems));
    }
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("shoppingItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("checklistItems", JSON.stringify(checklistItems));
  }, [checklistItems]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      newItemName.trim() === "" ||
      isNaN(Number(newItemPrice)) ||
      Number(newItemPrice) <= 0 ||
      isNaN(Number(newItemQuantity)) ||
      Number(newItemQuantity) <= 0
    ) {
      return;
    }

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      price: Number(newItemPrice),
      quantity: Number(newItemQuantity),
    };

    setItems([...items, newItem]);

    // Check if this item exists in checklist and mark as completed
    const checklistItem = checklistItems.find(
      (item) => item.name.toLowerCase() === newItemName.trim().toLowerCase()
    );
    if (checklistItem) {
      setChecklistItems(
        checklistItems.map((item) =>
          item.id === checklistItem.id ? { ...item, completed: true } : item
        )
      );
    }

    setNewItemName("");
    setNewItemPrice("");
    setNewItemQuantity("1");
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (newChecklistItemName.trim() === "") {
      return;
    }

    // Check if item already exists
    const exists = checklistItems.some(
      (item) =>
        item.name.toLowerCase() === newChecklistItemName.trim().toLowerCase()
    );

    if (exists) {
      setNewChecklistItemName("");
      return;
    }

    const newChecklistItem: ChecklistItem = {
      id: crypto.randomUUID(),
      name: newChecklistItemName.trim(),
      completed: false,
    };

    setChecklistItems([...checklistItems, newChecklistItem]);
    setNewChecklistItemName("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const clearList = () => {
    setItems([]);
  };

  const clearChecklist = () => {
    setChecklistItems([]);
  };

  const resetChecklist = () => {
    setChecklistItems(
      checklistItems.map((item) => ({ ...item, completed: false }))
    );
  };

  const startEditing = (item: ShoppingItem) => {
    setEditingItemId(item.id);
  };

  const updateItem = (id: string, updates: Partial<ShoppingItem>) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const finishEditing = () => {
    setEditingItemId(null);
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const completedCount = checklistItems.filter((item) => item.completed).length;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Mercado </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="shopping" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shopping">Lista de Compras</TabsTrigger>
              <TabsTrigger value="checklist">
                Todos os Itens
                {checklistItems.length > 0 && (
                  <span className="ml-1 text-xs">
                    ({completedCount}/{checklistItems.length})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shopping" className="space-y-4">
              <form onSubmit={addItem} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Item</Label>
                    <Input
                      id="item-name"
                      type="text"
                      placeholder="Nome do item"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-price">Preço</Label>
                    <Input
                      id="item-price"
                      type="number"
                      placeholder="R$0,00"
                      min="0.01"
                      step="0.01"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-quantity">Qtd</Label>
                    <Input
                      id="item-quantity"
                      type="number"
                      placeholder="1"
                      min="1"
                      step="1"
                      value={newItemQuantity}
                      onChange={(e) => setNewItemQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </form>

              {items.length > 0 ? (
                <div className="space-y-4">
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id} className="p-2 border rounded-md">
                        {editingItemId === item.id ? (
                          <div className="flex flex-col space-y-2">
                            <div className="font-medium">{item.name}</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label
                                  htmlFor={`price-${item.id}`}
                                  className="text-xs"
                                >
                                  Preço
                                </Label>
                                <Input
                                  id={`price-${item.id}`}
                                  value={item.price}
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  onChange={(e) =>
                                    updateItem(item.id, {
                                      price: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label
                                  htmlFor={`quantity-${item.id}`}
                                  className="text-xs"
                                >
                                  Quantidade
                                </Label>
                                <Input
                                  id={`quantity-${item.id}`}
                                  value={item.quantity}
                                  type="number"
                                  min="1"
                                  step="1"
                                  onChange={(e) =>
                                    updateItem(item.id, {
                                      quantity: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-end justify-end">
                                <Button size="sm" onClick={finishEditing}>
                                  Concluir
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-muted-foreground">
                                R$ {item.price.toFixed(2)} × {item.quantity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditing(item)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">
                                  Editar {item.name}
                                </span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                className="h-8 w-8 text-destructive"
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">
                                  Remover {item.name}
                                </span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <Separator />

                  <div className="flex items-center justify-between font-bold">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Sua lista está vazia. Adicione alguns itens!
                </div>
              )}

              {items.length > 0 && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={clearList}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Limpar Lista
                </Button>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4">
              <form onSubmit={addChecklistItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="checklist-item-name">Novo Item</Label>
                  <Input
                    id="checklist-item-name"
                    type="text"
                    placeholder="Nome do item"
                    value={newChecklistItemName}
                    onChange={(e) => setNewChecklistItemName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar à Lista
                </Button>
              </form>

              {checklistItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Progresso: {completedCount} de {checklistItems.length}{" "}
                      itens
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetChecklist}
                      >
                        Resetar
                      </Button>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {checklistItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`checklist-${item.id}`}
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklistItem(item.id)}
                          />
                          <label
                            htmlFor={`checklist-${item.id}`}
                            className={`font-medium cursor-pointer ${
                              item.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {item.name}
                          </label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChecklistItem(item.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remover {item.name}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={clearChecklist}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Limpar Lista Completa
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Adicione itens à sua lista completa para não esquecer de nada!
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Botão Voltar ao Topo - aparece apenas quando há mais de 10 itens na lista de compras */}
      {items.length > 10 && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
          size="icon"
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
