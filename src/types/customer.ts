import { Timestamp } from 'firebase/firestore';

export interface Customer {
  id: string;
  type: 'individual' | 'company' | 'foreign';
  status: 'active' | 'inactive';
  name: string;
  email: string;
  phones: {
    commercial?: string;
    mobile?: string;
    whatsapp: string;
  };
  instagram?: string;
  
  // Individual specific fields
  cpf?: string;
  rg?: string;
  birthDate?: Timestamp;
  gender?: 'homem' | 'mulher' | 'nao-binario' | 'genero-fluido' | 'agender' | 'outro' | 'prefiro-nao-dizer';
  
  // Company specific fields
  cnpj?: string;
  tradeName?: string;
  companyName?: string;
  municipalRegistration?: string;
  stateRegistrationNumber?: string;
  suframa?: string;
  
  // Foreign specific fields
  document?: string;
  
  // Common fields
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
  totalPurchases: number;
  lastPurchaseDate?: Date;
}