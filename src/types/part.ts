export interface Part {
  id: string;
  name: string;
  brand: string;
  quality: 'exclusive' | 'premium' | 'traditional' | 'inferior';
  description: string;
  price: string;
  status: 'active' | 'inactive';
  supplierId?: string;
  supplierName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartFormData extends Omit<Part, 'id' | 'createdAt' | 'updatedAt' | 'supplierId' | 'supplierName'> {}