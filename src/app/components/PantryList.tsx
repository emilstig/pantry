"use client";

import { useState } from "react";
import { PantryItem } from "../types/pantry";
import styles from "./PantryList.module.scss";

interface PantryListProps {
  items: PantryItem[];
  onUpdateItem: (id: string, updates: Partial<PantryItem>) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

interface EditingItem {
  id: string;
  data: Partial<PantryItem>;
}

export default function PantryList({
  items,
  onUpdateItem,
  onDeleteItem,
  onClearAll,
}: PantryListProps) {
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

  const startEditing = (item: PantryItem) => {
    setEditingItem({
      id: item.id,
      data: {
        name: item.name,
        quantity: item.quantity,
        unitQuantity: item.unitQuantity,
        unitUnit: item.unitUnit,
        expiry: item.expiry,
        notes: item.notes,
      },
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
  };

  const saveEditing = () => {
    if (editingItem) {
      onUpdateItem(editingItem.id, editingItem.data);
      setEditingItem(null);
    }
  };

  const updateEditingField = (
    field: keyof PantryItem,
    value: string | number
  ) => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        data: {
          ...editingItem.data,
          [field]: value,
        },
      });
    }
  };

  const groupItemsByYear = (items: PantryItem[]) => {
    const groups: { [key: string]: PantryItem[] } = {};

    items.forEach(item => {
      if (!item.expiry) {
        if (!groups["No date"]) {
          groups["No date"] = [];
        }
        groups["No date"].push(item);
      } else {
        const year = new Date(item.expiry).getFullYear().toString();
        if (!groups[year]) {
          groups[year] = [];
        }
        groups[year].push(item);
      }
    });

    // Sort items within each group by expiry date (earliest first)
    Object.keys(groups).forEach(year => {
      groups[year].sort((a, b) => {
        if (!a.expiry && !b.expiry) return 0;
        if (!a.expiry) return 1;
        if (!b.expiry) return -1;
        return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
      });
    });

    return groups;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return "expired";
    if (days <= 3) return "expiring-soon";
    if (days <= 7) return "expiring-week";
    return "good";
  };

  const groupedItems = groupItemsByYear(items);
  const sortedYears = Object.keys(groupedItems).sort((a, b) => {
    if (a === "No date") return 1;
    if (b === "No date") return -1;
    return parseInt(a) - parseInt(b);
  });

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>Your pantry is empty</h3>
        <p>Add some items to get started!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Pantry Items ({items.length})</h2>
        <button onClick={onClearAll} className={styles.clearButton}>
          Clear All
        </button>
      </div>

      {sortedYears.map(year => (
        <div key={year} className={styles.yearGroup}>
          <h3 className={styles.yearTitle}>{year}</h3>
          <div className={styles.itemsList}>
            {groupedItems[year].map(item => (
              <div key={item.id} className={styles.item}>
                {editingItem?.id === item.id ? (
                  <div className={styles.editingItem}>
                    <div className={styles.editingFields}>
                      <input
                        type="text"
                        value={editingItem.data.name || ""}
                        onChange={e =>
                          updateEditingField("name", e.target.value)
                        }
                        className={styles.editInput}
                        placeholder="Item name"
                      />
                      <div className={styles.editRow}>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={editingItem.data.quantity || 0}
                          onChange={e =>
                            updateEditingField(
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={styles.editInput}
                          placeholder="Quantity"
                        />
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={editingItem.data.unitQuantity || 0}
                          onChange={e =>
                            updateEditingField(
                              "unitQuantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={styles.editInput}
                          placeholder="Weight/volume per unit"
                        />
                        <select
                          value={editingItem.data.unitUnit || "g"}
                          onChange={e =>
                            updateEditingField("unitUnit", e.target.value)
                          }
                          className={styles.editSelect}
                        >
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="mg">mg</option>
                        </select>
                        <input
                          type="date"
                          value={editingItem.data.expiry || ""}
                          onChange={e =>
                            updateEditingField("expiry", e.target.value)
                          }
                          className={styles.editInput}
                        />
                      </div>
                      <textarea
                        value={editingItem.data.notes || ""}
                        onChange={e =>
                          updateEditingField("notes", e.target.value)
                        }
                        className={styles.editTextarea}
                        placeholder="Notes (optional)"
                        rows={2}
                      />
                    </div>
                    <div className={styles.editActions}>
                      <button
                        onClick={saveEditing}
                        className={styles.saveButton}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.itemContent}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemHeader}>
                        <h4 className={styles.itemName}>{item.name}</h4>
                        <span className={styles.itemQuantity}>
                          {item.quantity} × {item.unitQuantity}
                          {item.unitUnit}
                        </span>
                      </div>
                      {item.expiry && (
                        <div className={styles.expiryInfo}>
                          <span
                            className={`${styles.expiryDate} ${styles[getExpiryStatus(item.expiry)]}`}
                          >
                            {formatDate(item.expiry)}
                          </span>
                          <span className={styles.daysUntil}>
                            {getDaysUntilExpiry(item.expiry) < 0
                              ? "Expired"
                              : `${getDaysUntilExpiry(item.expiry)} days left`}
                          </span>
                        </div>
                      )}
                      {item.notes && (
                        <p className={styles.itemNotes}>{item.notes}</p>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        onClick={() => startEditing(item)}
                        className={styles.editButton}
                        title="Edit item"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className={styles.deleteButton}
                        title="Delete item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
