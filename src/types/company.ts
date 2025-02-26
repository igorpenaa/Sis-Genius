export interface CompanyData {
  type: 'individual' | 'company';
  name: string;
  cpf?: string;
  cnpj?: string;
  whatsapp: string;
  phone?: string;
  zipCode: string;
  address: string;
  state: string;
  city: string;
  neighborhood?: string;
  logo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompanyFormData extends Omit<CompanyData, 'createdAt' | 'updatedAt'> {}