"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { PantryItem } from "../types/pantry";

export function useSupabase() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("Supabase environment variables not configured");
        setError("Supabase not configured. Please check your environment variables.");
        return;
      }
      
      const { data, error } = await supabase
        .from("pantry_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(`Database error: ${error.message}`);
        return;
      }

      console.log("Successfully loaded items:", data);
      setItems(data || []);
    } catch (err) {
      console.error("Unexpected error loading items:", err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }
  };

  const addItem = useCallback(async (itemData: Omit<PantryItem, "id" | "createdAt" | "updatedAt">) => {
    try {
      setError(null);
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
        console.error("Error adding item:", error);
        setError("Failed to add item");
        return;
      }

      // Convert database format to our interface format
      const newItem: PantryItem = {
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

      setItems(prev => [newItem, ...prev]);
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item");
    }
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<PantryItem>) => {
    try {
      setError(null);
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.unitQuantity !== undefined) updateData.unit_quantity = updates.unitQuantity;
      if (updates.unitUnit !== undefined) updateData.unit_unit = updates.unitUnit;
      if (updates.expiry !== undefined) updateData.expiry = updates.expiry;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data, error } = await supabase
        .from("pantry_items")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating item:", error);
        setError("Failed to update item");
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

      setItems(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));
    } catch (err) {
      console.error("Error updating item:", err);
      setError("Failed to update item");
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from("pantry_items")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting item:", error);
        setError("Failed to delete item");
        return;
      }

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
      setError("Failed to delete item");
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      setError(null);
      const { error } = await supabase
        .from("pantry_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

      if (error) {
        console.error("Error clearing all items:", error);
        setError("Failed to clear all items");
        return;
      }

      setItems([]);
    } catch (err) {
      console.error("Error clearing all items:", err);
      setError("Failed to clear all items");
    }
  }, []);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    clearAll,
    isClient,
    loading,
    error,
  };
}
