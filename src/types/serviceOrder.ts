export interface ServiceOrder {
  id: string;
  orderNumber: number; // Número sequencial da O.S.
  customerId: string;
  customer?: {
    id: string;
    name: string;
    cpf: string;
    rg: string;
    phones: {
      commercial?: string;
      mobile?: string;
      whatsapp: string;
    };
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  customerName: string;
  technicianName: string;
  status: 'quote' | 'open' | 'in_progress' | 'completed' | 'canceled' | 'awaiting_parts' | 'approved' | 'warranty_return';
  startDate: Date;
  endDate?: Date;
  warrantyPeriod: number;
  warrantyId: string;
  warranty?: {
    id: string;
    name: string;
    durationDays: number;
    description: string;
    warrantyTerms: string;
  };
  warrantyExpiration?: Date;
  equipments: Equipment[];
  checklists: ServiceOrderChecklist[];
  services: ServiceOrderService[];
  products: ServiceOrderProduct[];
  technicalFeedback?: string;
  discount: number;
  totalAmount: number;
  discountedAmount: number;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  category: string;
  subcategory: string;
  brand: string;
  model: string;
  color?: string;
  imei?: string;
  reportedIssue: string;
  hasPower: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceOrderChecklist {
  id: string;
  serviceOrderId: string;
  checklistId: string;
  items: {
    id: string;
    text: string;
    checked: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOrderService {
  id: string;
  serviceOrderId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOrderProduct {
  id: string;
  serviceOrderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOrderFormData {
  id?: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  technicianName: string;
  status: ServiceOrder['status'];
  startDate: Date;
  endDate?: Date;
  deliveryDate: string;
  warrantyId: string;
  warrantyPeriod: number;
  equipments: Equipment[];
  checklists: {
    id: string;
    checklistId: string;
    equipmentIndex: number;
    items: {
      id: string;
      text: string;
      checked: boolean;
    }[];
  }[];
  services: {
    serviceId: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
  }[];
  products: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  technicalFeedback: string;
  discount: number;
  isComplete?: boolean;
  validationErrors?: string[];
}