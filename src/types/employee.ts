import { Timestamp } from 'firebase/firestore';

export interface Employee {
  id: string;
  registrationType: 'complete' | 'simplified';
  type: 'individual' | 'company';
  name: string;
  status: 'active' | 'inactive';
  email: string;
  phones: {
    commercial?: string;
    mobile: string;
    whatsapp: string;
  };
  
  // Individual specific fields
  cpf?: string;
  rg?: string;
  birthDate?: Date;
  gender?: 'male' | 'female' | 'other';
  
  // Company specific fields
  cnpj?: string;
  tradeName?: string;
  companyName?: string;
  municipalRegistration?: string;
  stateRegistrationNumber?: string;
  
  // Common fields
  role: 'vendedor' | 'tecnico' | 'supervisor';
  salesCommissionPercentage: number;
  servicesCommissionPercentage: number;
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
}