import { Timestamp } from 'firebase/firestore';

export interface ProductSale {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  status: 'open' | 'completed' | 'canceled' | 'in_progress';
  purchaseDate: string;
  products: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }[];
  paymentMethod: string;
  discountValue: number;
  discountPercentage: number;
  totalValue: number;
  finalValue: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductSaleFormData {
  customerId: string;
  sellerId: string;
  status: 'open' | 'completed' | 'canceled' | 'in_progress';
  purchaseDate: string;
  products: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }[];
  paymentMethod: string;
  discountValue: number;
  discountPercentage: number;
  totalValue: number;
  finalValue: number;
}
