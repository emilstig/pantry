"use client";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { PantryItemFormData } from "../types/pantry";
import PantryForm from "./PantryForm";
import PantryList from "./PantryList";
import styles from "./PantryApp.module.scss";

export default function PantryApp() {
  const { items, addItem, updateItem, deleteItem, clearAll, isClient } =
    useLocalStorage();

  const handleAddItem = (formData: PantryItemFormData) => {
    addItem(formData);
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
  if (!isClient) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading pantry...</p>
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
      </header>

      <main className={styles.main}>
        <PantryForm onSubmit={handleAddItem} />
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
