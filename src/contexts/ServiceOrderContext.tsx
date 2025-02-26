import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ServiceOrderFormData } from '../types/serviceOrder';
import { getNextOrderNumber } from '../utils/orderNumberGenerator';

const defaultFormData: ServiceOrderFormData = {
  customerId: '',
  customerName: '',
  technicianId: '',
  technicianName: '',
  status: 'open',
  startDate: new Date(),
  deliveryDate: '',
  warrantyId: '',
  warrantyPeriod: 90, // Garantia padrão de 90 dias
  equipments: [{
    id: Date.now().toString(),
    category: '',
    subcategory: '',
    brand: '',
    model: '',
    color: '',
    imei: '',
    serialNumber: '',
    reportedIssue: '',
    hasPower: true
  }],
  services: [],
  products: [],
  checklists: [],
  discount: 0
};

interface ServiceOrderContextType {
  formData: ServiceOrderFormData;
  setFormData: (data: ServiceOrderFormData) => void;
  updateFormData: (field: string, value: any) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isStepValid: boolean;
  setIsStepValid: (valid: boolean) => void;
  saveDraft: () => void;
  loadDraft: () => void;
  clearFormData: () => void;
  createServiceOrder: (data: ServiceOrderFormData) => Promise<string>;
}

const ServiceOrderContext = createContext<ServiceOrderContextType>({} as ServiceOrderContextType);

// Chave para o localStorage
const STORAGE_KEY = 'serviceOrder_draft';

// Função para limpar o localStorage
const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// Função para verificar se o localStorage está disponível
const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Função para salvar no localStorage com segurança
const safeSetItem = (key: string, value: any) => {
  if (!isStorageAvailable()) return;
  
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    clearStorage();
  }
};

// Função para ler do localStorage com segurança
const safeGetItem = (key: string) => {
  if (!isStorageAvailable()) return null;
  
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') return null;
    return JSON.parse(item);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    clearStorage();
    return null;
  }
};

export function ServiceOrderProvider({ 
  children, 
  initialData 
}: { 
  children: React.ReactNode;
  initialData?: ServiceOrderFormData;
}) {
  const [formData, setFormData] = useState<ServiceOrderFormData>(() => {
    try {
      // Se estamos em modo de edição, use os dados iniciais
      if (initialData && Object.keys(initialData).length > 0) {
        // Limpar o rascunho ao entrar em modo de edição
        clearStorage();
        
        const equipments = Array.isArray(initialData.equipments) ? initialData.equipments : [defaultFormData.equipments[0]];
        return {
          ...defaultFormData,
          ...initialData,
          equipments: equipments.map(equip => ({
            ...defaultFormData.equipments[0],
            ...equip,
            id: equip.id || Date.now().toString()
          }))
        };
      }

      // Se não estamos em modo de edição, tente carregar o rascunho
      const saved = safeGetItem(STORAGE_KEY);
      if (saved) {
        const equipments = Array.isArray(saved.equipments) ? saved.equipments : [defaultFormData.equipments[0]];
        return {
          ...defaultFormData,
          ...saved,
          startDate: saved.startDate ? new Date(saved.startDate) : new Date(),
          equipments: equipments.map(equip => ({
            ...defaultFormData.equipments[0],
            ...equip,
            id: equip.id || Date.now().toString()
          }))
        };
      }
      
      return defaultFormData;
    } catch (error) {
      console.error('Error initializing form data:', error);
      clearStorage();
      return defaultFormData;
    }
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepValid, setIsStepValid] = useState(false);

  useEffect(() => {
    return () => {
      clearStorage();
    };
  }, []);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      lastModified: new Date()
    }));
  };

  const saveDraft = () => {
    try {
      // Não salvar se estivermos em modo de edição
      if (formData.id) {
        clearStorage();
        return;
      }

      // Garantir que os dados são válidos antes de salvar
      if (!formData || typeof formData !== 'object') {
        console.error('Invalid form data:', formData);
        return;
      }

      // Criar uma cópia segura dos dados
      const safeData = {
        ...formData,
        startDate: formData.startDate?.toISOString(),
        equipments: (formData.equipments || []).map(equip => ({
          id: equip.id || String(Date.now()),
          category: equip.category || '',
          subcategory: equip.subcategory || '',
          brand: equip.brand || '',
          model: equip.model || '',
          color: equip.color || '',
          imei: equip.imei || '',
          serialNumber: equip.serialNumber || '',
          reportedIssue: equip.reportedIssue || '',
          hasPower: Boolean(equip.hasPower)
        }))
      };

      safeSetItem(STORAGE_KEY, safeData);
    } catch (error) {
      console.error('Error in saveDraft:', error);
      clearStorage();
    }
  };

  const loadDraft = () => {
    try {
      // Não carregar rascunho se estivermos em modo de edição
      if (formData.id) {
        clearStorage();
        return;
      }

      const savedData = safeGetItem(STORAGE_KEY);
      if (!savedData) return;

      // Garantir que os dados são válidos
      const safeData = {
        ...defaultFormData,
        ...savedData,
        startDate: savedData.startDate ? new Date(savedData.startDate) : new Date(),
        equipments: Array.isArray(savedData.equipments) ? savedData.equipments.map(equip => ({
          id: String(equip.id || Date.now()),
          category: String(equip.category || ''),
          subcategory: String(equip.subcategory || ''),
          brand: String(equip.brand || ''),
          model: String(equip.model || ''),
          color: String(equip.color || ''),
          imei: String(equip.imei || ''),
          serialNumber: String(equip.serialNumber || ''),
          reportedIssue: String(equip.reportedIssue || ''),
          hasPower: Boolean(equip.hasPower)
        })) : defaultFormData.equipments
      };

      setFormData(safeData);
    } catch (error) {
      console.error('Error in loadDraft:', error);
      clearStorage();
    }
  };

  const clearFormData = () => {
    setFormData(defaultFormData);
    clearStorage();
  };

  const createServiceOrder = async (data: ServiceOrderFormData) => {
    try {
      const orderNumber = await getNextOrderNumber();
      const orderRef = doc(collection(db, 'serviceOrders'));
      
      await setDoc(orderRef, {
        ...data,
        id: orderRef.id,
        orderNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return orderRef.id;
    } catch (error) {
      console.error('Error creating service order:', error);
      throw new Error('Erro ao criar ordem de serviço');
    }
  };

  return (
    <ServiceOrderContext.Provider 
      value={{
        formData,
        setFormData,
        updateFormData,
        currentStep,
        setCurrentStep,
        isStepValid,
        setIsStepValid,
        saveDraft,
        loadDraft,
        clearFormData,
        createServiceOrder
      }}
    >
      {children}
    </ServiceOrderContext.Provider>
  );
}

export function useServiceOrder() {
  const context = useContext(ServiceOrderContext);
  if (!context) {
    throw new Error('useServiceOrder must be used within a ServiceOrderProvider');
  }
  return context;
}