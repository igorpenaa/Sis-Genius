import { Timestamp } from 'firebase/firestore';

export interface Supplier {
  id: string;
  registrationType: 'complete' | 'simplified';
  type: 'individual' | 'company';
  status: 'active' | 'inactive';
  name: string;
  email: string;
  phones: {
    commercial?: string;
    mobile: string;
    whatsapp: string;
  };
  
  // Individual specific fields
  cpf?: string;
  rg?: string;
  
  // Company specific fields
  cnpj?: string;
  tradeName?: string;
  companyName?: string;
  municipalRegistration?: string;
  stateRegistrationNumber?: string;
  
  // Common fields
  role?: string;
  salesCommissionPercentage?: number;
  servicesCommissionPercentage?: number;
  observations?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  totalPurchases?: number;
}