"use client";

import { useState } from "react";
import { PantryItemFormData } from "../types/pantry";
import styles from "./PantryForm.module.scss";

interface PantryFormProps {
  onSubmit: (data: PantryItemFormData) => void;
}

export default function PantryForm({ onSubmit }: PantryFormProps) {
  const [formData, setFormData] = useState<PantryItemFormData>({
    name: "",
    quantity: 1,
    unitQuantity: 1,
    unitUnit: "g",
    expiry: "",
    notes: "",
  });

  const [showNotes, setShowNotes] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSubmit({
      ...formData,
      name: formData.name.trim(),
      notes: formData.notes?.trim() || undefined,
      expiry: formData.expiry || undefined,
    });

    // Reset form
    setFormData({
      name: "",
      quantity: 1,
      unitQuantity: 1,
      unitUnit: "g",
      expiry: "",
      notes: "",
    });
    setShowNotes(false);
  };

  const handleChange = (
    field: keyof PantryItemFormData,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Add Pantry Item</h2>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label htmlFor="name" className={styles.label}>
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={e => handleChange("name", e.target.value)}
            className={styles.input}
            placeholder="e.g., Milk, Bread, Apples"
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="quantity" className={styles.label}>
            Quantity *
          </label>
          <input
            id="quantity"
            type="number"
            min="0.1"
            step="0.1"
            value={formData.quantity}
            onChange={e =>
              handleChange("quantity", parseFloat(e.target.value) || 0)
            }
            className={styles.input}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label htmlFor="unitQuantity" className={styles.label}>
            Weight/Volume per Unit *
          </label>
          <input
            id="unitQuantity"
            type="number"
            min="0.1"
            step="0.1"
            value={formData.unitQuantity}
            onChange={e =>
              handleChange("unitQuantity", parseFloat(e.target.value) || 0)
            }
            className={styles.input}
            placeholder="e.g., 10"
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="unitUnit" className={styles.label}>
            Unit *
          </label>
          <select
            id="unitUnit"
            value={formData.unitUnit}
            onChange={e =>
              handleChange("unitUnit", e.target.value as "g" | "ml" | "mg")
            }
            className={styles.select}
            required
          >
            <option value="g">g (grams)</option>
            <option value="ml">ml (milliliters)</option>
            <option value="mg">mg (milligrams)</option>
          </select>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="expiry" className={styles.label}>
          Expiry Date
        </label>
        <input
          id="expiry"
          type="date"
          value={formData.expiry}
          onChange={e => handleChange("expiry", e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.fieldGroup}>
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className={styles.toggleNotes}
        >
          {showNotes ? "Hide" : "Add"} Notes (Optional)
        </button>

        {showNotes && (
          <textarea
            value={formData.notes}
            onChange={e => handleChange("notes", e.target.value)}
            className={styles.textarea}
            placeholder="Any additional notes about this item..."
            rows={3}
          />
        )}
      </div>

      <button type="submit" className={styles.submitButton}>
        Add to Pantry
      </button>
    </form>
  );
}
