export interface Service {
  id: string;
  name: string;
  salePrice: number;
  partId?: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceFormData extends Omit<Service, 'id' | 'createdAt' | 'updatedAt'> {}