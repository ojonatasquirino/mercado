"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    const savedItems = localStorage.getItem("shoppingItems");
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("shoppingItems", JSON.stringify(items));
  }, [items]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newItemName.trim() ||
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
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQuantity("1");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const clearList = () => {
    setItems([]);
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

  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card className="bg-white border border-gray-300 shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-black">
            Lista de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addItem} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name" className="text-black">
                  Item
                </Label>
                <Input
                  id="item-name"
                  type="text"
                  placeholder="Nome do item"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  className="border border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price" className="text-black">
                  Preço
                </Label>
                <Input
                  id="item-price"
                  type="number"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  required
                  className="border border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-quantity" className="text-black">
                  Qtd
                </Label>
                <Input
                  id="item-quantity"
                  type="number"
                  placeholder="1"
                  min="1"
                  step="1"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  required
                  className="border border-gray-300"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-black text-white">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Item
            </Button>
          </form>

          {items.length > 0 ? (
            <div className="space-y-4">
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="p-4 border border-gray-300 rounded-md bg-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium text-black">
                          {item.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          R$ {item.price.toFixed(2)} × {item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-black">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(item)}
                          className="h-8 w-8 text-black"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <Separator />

              <div className="flex items-center justify-between font-bold text-black">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              Sua lista está vazia. Adicione alguns itens!
            </div>
          )}
        </CardContent>
        {items.length > 0 && (
          <CardFooter>
            <Button
              variant="destructive"
              className="w-full bg-red-500 text-white"
              onClick={clearList}
            >
              <Trash className="h-4 w-4 mr-2" /> Limpar Lista
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
