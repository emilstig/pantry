export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unitQuantity: number; // e.g., 10 grams per apple
  unitUnit: "g" | "ml" | "mg"; // unit for unitQuantity
  expiry?: string; // ISO date string
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PantryItemFormData {
  name: string;
  quantity: number;
  unitQuantity: number;
  unitUnit: "g" | "ml" | "mg";
  expiry?: string;
  notes?: string;
}

export interface GroupedPantryItems {
  [year: string]: PantryItem[];
}
