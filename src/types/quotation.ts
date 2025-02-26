export interface ServiceQuotation {
  id: string;
  number: string;
  clientId: string;
  userId: string;
  date: Date;
  deliveryTime: string;
  validity: string;
  salesChannel: string;
  description: string;
  services: QuotationService[];
  products: QuotationProduct[];
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotationService {
  id: string;
  serviceId: string;
  details: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface QuotationProduct {
  id: string;
  productId: string;
  details: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface QuotationFormData {
  clientId: string;
  deliveryTime: string;
  validity: string;
  salesChannel: string;
  description: string;
  services: QuotationService[];
  products: QuotationProduct[];
  internalNotes?: string;
}