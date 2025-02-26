export interface Product {
  id: string;
  name: string;
  description: string;
  barcode?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  category: string;
  brand: string;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactPerson: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  expectedDeliveryDate: Date;
  notes?: string;
}