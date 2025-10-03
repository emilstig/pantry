"use client";

import { useState } from "react";
import { PantryItemFormData } from "../types/pantry";
import styles from "./BatchImport.module.scss";

interface BatchImportProps {
  onBatchAdd: (items: PantryItemFormData[]) => void;
}

interface ParsedItem {
  name: string;
  quantity: number;
  unitQuantity: number;
  unitUnit: "g" | "ml" | "mg";
  expiry?: string;
  notes?: string;
}

export default function BatchImport({ onBatchAdd }: BatchImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const parseInput = (text: string): ParsedItem[] => {
    const lines = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const items: ParsedItem[] = [];

    for (const line of lines) {
      try {
        // Try different parsing patterns
        let item: ParsedItem | null = null;

        // Pattern 1: "Name, quantity, unitQuantity unitUnit, expiry, notes"
        // Example: "Apples, 5, 200g, 2024-12-31, Organic"
        const csvPattern = /^([^,]+),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)([gml]+),\s*([^,]*)(?:,\s*(.*))?$/i;
        const csvMatch = line.match(csvPattern);
        if (csvMatch) {
          const [, name, quantity, unitQuantity, unitUnit, expiry, notes] = csvMatch;
          item = {
            name: name.trim(),
            quantity: parseFloat(quantity),
            unitQuantity: parseFloat(unitQuantity),
            unitUnit: unitUnit.toLowerCase() as "g" | "ml" | "mg",
            expiry: expiry.trim() || undefined,
            notes: notes?.trim() || undefined,
          };
        }

        // Pattern 2: "Name - quantity x unitQuantity unitUnit (expiry) [notes]"
        // Example: "Milk - 2 x 500ml (2024-12-31) [Organic]"
        if (!item) {
          const dashPattern = /^([^-]+)\s*-\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)([gml]+)\s*(?:\(([^)]+)\))?\s*(?:\[([^\]]+)\])?$/i;
          const dashMatch = line.match(dashPattern);
          if (dashMatch) {
            const [, name, quantity, unitQuantity, unitUnit, expiry, notes] = dashMatch;
            item = {
              name: name.trim(),
              quantity: parseFloat(quantity),
              unitQuantity: parseFloat(unitQuantity),
              unitUnit: unitUnit.toLowerCase() as "g" | "ml" | "mg",
              expiry: expiry?.trim() || undefined,
              notes: notes?.trim() || undefined,
            };
          }
        }

        // Pattern 3: Simple format "Name quantity unitQuantity unitUnit"
        // Example: "Bread 2 500g"
        if (!item) {
          const simplePattern = /^([^0-9]+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)([gml]+)$/i;
          const simpleMatch = line.match(simplePattern);
          if (simpleMatch) {
            const [, name, quantity, unitQuantity, unitUnit] = simpleMatch;
            item = {
              name: name.trim(),
              quantity: parseFloat(quantity),
              unitQuantity: parseFloat(unitQuantity),
              unitUnit: unitUnit.toLowerCase() as "g" | "ml" | "mg",
            };
          }
        }

        if (item && item.name && item.quantity > 0 && item.unitQuantity > 0) {
          items.push(item);
        }
      } catch (error) {
        console.warn(`Failed to parse line: "${line}"`, error);
      }
    }

    return items;
  };

  const handleParse = () => {
    const parsed = parseInput(inputText);
    setParsedItems(parsed);
  };

  const handleImport = async () => {
    if (parsedItems.length === 0) return;

    setIsImporting(true);
    try {
      await onBatchAdd(parsedItems);
      setInputText("");
      setParsedItems([]);
      setIsOpen(false);
    } catch (error) {
      console.error("Error importing items:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClear = () => {
    setInputText("");
    setParsedItems([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={styles.openButton}
      >
        📥 Batch Import
      </button>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Batch Import Items</h3>
          <button
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.instructions}>
            <h4>Supported Formats:</h4>
            <ul>
              <li><code>Name, quantity, unitQuantity unitUnit, expiry, notes</code></li>
              <li><code>Name - quantity x unitQuantity unitUnit (expiry) [notes]</code></li>
              <li><code>Name quantity unitQuantity unitUnit</code></li>
            </ul>
            <p><strong>Examples:</strong></p>
            <pre className={styles.example}>
{`Apples, 5, 200g, 2024-12-31, Organic
Milk - 2 x 500ml (2024-12-31) [Organic]
Bread 2 500g`}
            </pre>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your items here, one per line..."
            className={styles.textarea}
            rows={8}
          />

          <div className={styles.actions}>
            <button onClick={handleParse} className={styles.parseButton}>
              Parse Items
            </button>
            <button onClick={handleClear} className={styles.clearButton}>
              Clear
            </button>
          </div>

          {parsedItems.length > 0 && (
            <div className={styles.preview}>
              <h4>Preview ({parsedItems.length} items):</h4>
              <div className={styles.previewList}>
                {parsedItems.map((item, index) => (
                  <div key={index} className={styles.previewItem}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemDetails}>
                      {item.quantity} × {item.unitQuantity}{item.unitUnit}
                      {item.expiry && ` (${item.expiry})`}
                      {item.notes && ` [${item.notes}]`}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className={styles.importButton}
              >
                {isImporting ? "Importing..." : `Import ${parsedItems.length} Items`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
