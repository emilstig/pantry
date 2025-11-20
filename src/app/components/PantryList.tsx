"use client";

import { useState } from "react";
import { PantryItem } from "../types/pantry";
import { useSettings } from "../contexts/SettingsContext";
import { getExpiryStatus, getDaysUntilExpiry } from "../utils/expiryUtils";
import styles from "./PantryList.module.scss";

interface PantryListProps {
  items: PantryItem[];
  onUpdateItem: (id: string, updates: Partial<PantryItem>) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onToggleReplaced: (id: string, isReplaced: boolean) => void;
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
  onToggleReplaced,
}: PantryListProps) {
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const { settings } = useSettings();

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

  const sortByExpiryAsc = (a: PantryItem, b: PantryItem) => {
    if (!a.expiry && !b.expiry) return 0;
    if (!a.expiry) return 1;
    if (!b.expiry) return -1;
    return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
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

    Object.keys(groups).forEach(year => {
      groups[year].sort(sortByExpiryAsc);
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

  const isItemExpired = (item: PantryItem) => {
    if (!item.expiry) return false;
    const daysUntilExpiry = getDaysUntilExpiry(item.expiry);
    return typeof daysUntilExpiry === "number" && daysUntilExpiry < 0;
  };

  const renderItem = (item: PantryItem) => {
    const daysUntilExpiry = item.expiry
      ? getDaysUntilExpiry(item.expiry)
      : null;
    const isExpired =
      typeof daysUntilExpiry === "number" && daysUntilExpiry < 0;
    const itemClasses = [
      styles.item,
      !item.isReplaced ? styles.replacedItem : "",
      isExpired ? styles.expiredItem : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div key={item.id} className={itemClasses}>
        {editingItem?.id === item.id ? (
          <div className={styles.editingItem}>
            <div className={styles.editingFields}>
              <input
                type="text"
                value={editingItem.data.name || ""}
                onChange={e => updateEditingField("name", e.target.value)}
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
                  onChange={e => updateEditingField("unitUnit", e.target.value)}
                  className={styles.editSelect}
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="mg">mg</option>
                </select>
                <input
                  type="date"
                  value={editingItem.data.expiry || ""}
                  onChange={e => updateEditingField("expiry", e.target.value)}
                  className={styles.editInput}
                />
              </div>
              <textarea
                value={editingItem.data.notes || ""}
                onChange={e => updateEditingField("notes", e.target.value)}
                className={styles.editTextarea}
                placeholder="Notes (optional)"
                rows={2}
              />
            </div>
            <div className={styles.editActions}>
              <button onClick={saveEditing} className={styles.saveButton}>
                Save
              </button>
              <button onClick={cancelEditing} className={styles.cancelButton}>
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
              {item.isReplaced && item.expiry && (
                <div className={styles.expiryInfo}>
                  <span
                    className={`${styles.expiryDate} ${styles[getExpiryStatus(item.expiry, settings)]}`}
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
              {!item.isReplaced && (
                <div className={styles.replacedNotice}>
                  <span role="img" aria-label="used">
                    🍽️
                  </span>{" "}
                  Marked as used
                </div>
              )}
              {item.notes && <p className={styles.itemNotes}>{item.notes}</p>}
              {item.reminderCount > 0 && (
                <div className={styles.reminderInfo}>
                  📧 Reminded {item.reminderCount} time
                  {item.reminderCount > 1 ? "s" : ""}
                </div>
              )}
            </div>
            <div className={styles.itemActions}>
              <button
                onClick={() => onToggleReplaced(item.id, !item.isReplaced)}
                className={
                  item.isReplaced ? styles.usedButton : styles.replacedButton
                }
                title={item.isReplaced ? "Mark as used" : "Mark as replaced"}
                aria-label={
                  item.isReplaced ? "Mark as used" : "Mark as replaced"
                }
              >
                {item.isReplaced ? "🍽️" : "♻️"}
              </button>
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
    );
  };

  const replaceNowItems = items.filter(
    item => isItemExpired(item) || !item.isReplaced
  );
  const replaceNowIds = new Set(replaceNowItems.map(item => item.id));
  const groupedItems = groupItemsByYear(
    items.filter(item => !replaceNowIds.has(item.id))
  );
  const sortedReplaceNowItems = [...replaceNowItems].sort(sortByExpiryAsc);
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

      {sortedReplaceNowItems.length > 0 && (
        <div className={styles.yearGroup}>
          <h3 className={styles.yearTitle}>Replace now</h3>
          <div className={styles.itemsList}>
            {sortedReplaceNowItems.map(item => renderItem(item))}
          </div>
        </div>
      )}

      {sortedYears.map(year => (
        <div key={year} className={styles.yearGroup}>
          <h3 className={styles.yearTitle}>{year}</h3>
          <div className={styles.itemsList}>
            {groupedItems[year].map(item => renderItem(item))}
          </div>
        </div>
      ))}
    </div>
  );
}
