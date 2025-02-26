export interface ChecklistItem {
  id: string;
  text: string;
}

export interface Checklist {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  items: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  category: string;
  subcategory: string;
}

export interface ChecklistFormData {
  name: string;
  category: string;
  subcategory: string;
  items: string[];
}