"use client";

import { useSupabaseWithFallback } from "../hooks/useSupabaseWithFallback";
import { PantryItemFormData } from "../types/pantry";
import PantryForm from "./PantryForm";
import PantryList from "./PantryList";
import styles from "./PantryApp.module.scss";

export default function PantryApp() {
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    clearAll,
    isClient,
    loading,
    error,
    usingFallback,
  } = useSupabaseWithFallback();

  const handleAddItem = (formData: PantryItemFormData) => {
    addItem(formData);
  };

  const handleBatchAdd = async (items: PantryItemFormData[]) => {
    for (const item of items) {
      await addItem(item);
    }
  };

  const handleUpdateItem = (
    id: string,
    updates: Partial<PantryItemFormData>
  ) => {
    updateItem(id, updates);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem(id);
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        "Are you sure you want to clear all items? This action cannot be undone."
      )
    ) {
      clearAll();
    }
  };

  // Show loading state while client-side hydration is happening
  if (!isClient || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading pantry...</p>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>🍽️ Pantry Manager</h1>
        <p className={styles.subtitle}>
          Keep track of your pantry items and never let food go to waste
        </p>
        {usingFallback && (
          <div className={styles.fallbackNotice}>
            <span className={styles.fallbackIcon}>⚠️</span>
            Using local storage (Supabase not configured)
          </div>
        )}
      </header>

      <main className={styles.main}>
        <PantryForm onSubmit={handleAddItem} onBatchAdd={handleBatchAdd} />
        <PantryList
          items={items}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onClearAll={handleClearAll}
        />
      </main>
    </div>
  );
}
