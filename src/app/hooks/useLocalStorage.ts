"use client";

import { useState, useEffect, useCallback } from "react";
import { PantryItem } from "../types/pantry";

const STORAGE_KEY = "pantry-items";

export function useLocalStorage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setItems(JSON.parse(stored));
        } catch (error) {
          console.error("Error parsing stored pantry items:", error);
        }
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isClient && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isClient]);

  const addItem = useCallback(
    (itemData: Omit<PantryItem, "id" | "createdAt" | "updatedAt">) => {
      const newItem: PantryItem = {
        ...itemData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems(prev => [...prev, newItem]);
    },
    []
  );

  const updateItem = useCallback((id: string, updates: Partial<PantryItem>) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    clearAll,
    isClient,
  };
}
