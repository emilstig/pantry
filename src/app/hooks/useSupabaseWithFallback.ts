"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { PantryItem } from "../types/pantry";

const STORAGE_KEY = "pantry-items";

export function useSupabaseWithFallback() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      console.log("Attempting to load items from Supabase...");

      // Check if Supabase is properly configured
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        console.warn(
          "Supabase environment variables not configured, falling back to localStorage"
        );
        setUsingFallback(true);
        loadFromLocalStorage();
        return;
      }

      const { data, error } = await supabase
        .from("pantry_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error, falling back to localStorage:", error);
        setUsingFallback(true);
        loadFromLocalStorage();
        return;
      }

      console.log("Successfully loaded items from Supabase:", data);
      setItems(data || []);
      setError(null);
    } catch (err) {
      console.error("Unexpected error, falling back to localStorage:", err);
      setUsingFallback(true);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedItems = JSON.parse(stored);
          setItems(parsedItems);
          console.log("Loaded items from localStorage:", parsedItems);
        }
      }
    } catch (err) {
      console.error("Error loading from localStorage:", err);
      setError("Failed to load items from both Supabase and localStorage");
    }
  };

  const saveToLocalStorage = (items: PantryItem[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  };

  const addItem = useCallback(
    async (itemData: Omit<PantryItem, "id" | "createdAt" | "updatedAt">) => {
      try {
        setError(null);
        const newItem: PantryItem = {
          ...itemData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (usingFallback) {
          // Use localStorage
          const updatedItems = [newItem, ...items];
          setItems(updatedItems);
          saveToLocalStorage(updatedItems);
          console.log("Added item to localStorage:", newItem);
        } else {
          // Use Supabase
          const { data, error } = await supabase
            .from("pantry_items")
            .insert([
              {
                name: itemData.name,
                quantity: itemData.quantity,
                unit_quantity: itemData.unitQuantity,
                unit_unit: itemData.unitUnit,
                expiry: itemData.expiry,
                notes: itemData.notes,
              },
            ])
            .select()
            .single();

          if (error) {
            console.error(
              "Error adding item to Supabase, falling back to localStorage:",
              error
            );
            setUsingFallback(true);
            const updatedItems = [newItem, ...items];
            setItems(updatedItems);
            saveToLocalStorage(updatedItems);
            return;
          }

          // Convert database format to our interface format
          const dbItem: PantryItem = {
            id: data.id,
            name: data.name,
            quantity: data.quantity,
            unitQuantity: data.unit_quantity,
            unitUnit: data.unit_unit,
            expiry: data.expiry,
            notes: data.notes,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };

          setItems(prev => [dbItem, ...prev]);
          console.log("Added item to Supabase:", dbItem);
        }
      } catch (err) {
        console.error("Error adding item:", err);
        setError("Failed to add item");
      }
    },
    [items, usingFallback]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<PantryItem>) => {
      try {
        setError(null);

        if (usingFallback) {
          // Use localStorage
          const updatedItems = items.map(item =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          );
          setItems(updatedItems);
          saveToLocalStorage(updatedItems);
          console.log("Updated item in localStorage:", id);
        } else {
          // Use Supabase
          const updateData: any = {};

          if (updates.name !== undefined) updateData.name = updates.name;
          if (updates.quantity !== undefined)
            updateData.quantity = updates.quantity;
          if (updates.unitQuantity !== undefined)
            updateData.unit_quantity = updates.unitQuantity;
          if (updates.unitUnit !== undefined)
            updateData.unit_unit = updates.unitUnit;
          if (updates.expiry !== undefined) updateData.expiry = updates.expiry;
          if (updates.notes !== undefined) updateData.notes = updates.notes;

          const { data, error } = await supabase
            .from("pantry_items")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

          if (error) {
            console.error(
              "Error updating item in Supabase, falling back to localStorage:",
              error
            );
            setUsingFallback(true);
            const updatedItems = items.map(item =>
              item.id === id
                ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                : item
            );
            setItems(updatedItems);
            saveToLocalStorage(updatedItems);
            return;
          }

          // Convert database format to our interface format
          const updatedItem: PantryItem = {
            id: data.id,
            name: data.name,
            quantity: data.quantity,
            unitQuantity: data.unit_quantity,
            unitUnit: data.unit_unit,
            expiry: data.expiry,
            notes: data.notes,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };

          setItems(prev =>
            prev.map(item => (item.id === id ? updatedItem : item))
          );
          console.log("Updated item in Supabase:", updatedItem);
        }
      } catch (err) {
        console.error("Error updating item:", err);
        setError("Failed to update item");
      }
    },
    [items, usingFallback]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        setError(null);

        if (usingFallback) {
          // Use localStorage
          const updatedItems = items.filter(item => item.id !== id);
          setItems(updatedItems);
          saveToLocalStorage(updatedItems);
          console.log("Deleted item from localStorage:", id);
        } else {
          // Use Supabase
          const { error } = await supabase
            .from("pantry_items")
            .delete()
            .eq("id", id);

          if (error) {
            console.error(
              "Error deleting item from Supabase, falling back to localStorage:",
              error
            );
            setUsingFallback(true);
            const updatedItems = items.filter(item => item.id !== id);
            setItems(updatedItems);
            saveToLocalStorage(updatedItems);
            return;
          }

          setItems(prev => prev.filter(item => item.id !== id));
          console.log("Deleted item from Supabase:", id);
        }
      } catch (err) {
        console.error("Error deleting item:", err);
        setError("Failed to delete item");
      }
    },
    [items, usingFallback]
  );

  const clearAll = useCallback(async () => {
    try {
      setError(null);

      if (usingFallback) {
        // Use localStorage
        setItems([]);
        saveToLocalStorage([]);
        console.log("Cleared all items from localStorage");
      } else {
        // Use Supabase
        const { error } = await supabase
          .from("pantry_items")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

        if (error) {
          console.error(
            "Error clearing all items from Supabase, falling back to localStorage:",
            error
          );
          setUsingFallback(true);
          setItems([]);
          saveToLocalStorage([]);
          return;
        }

        setItems([]);
        console.log("Cleared all items from Supabase");
      }
    } catch (err) {
      console.error("Error clearing all items:", err);
      setError("Failed to clear all items");
    }
  }, [usingFallback]);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    clearAll,
    isClient,
    loading,
    error,
    usingFallback,
  };
}
