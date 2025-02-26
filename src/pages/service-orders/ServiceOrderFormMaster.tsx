import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ServiceOrderProvider } from '../../contexts/ServiceOrderContext';
import { ServiceOrderSteps } from '../../components/ServiceOrderSteps';
import { ServiceOrderFormPage } from './ServiceOrderFormPage';
import { ServiceOrderFormService } from './ServiceOrderFormService';
import { ServiceOrderFormProduct } from './ServiceOrderFormProduct';
import { ServiceOrderFormSummary } from './ServiceOrderFormSummary';
import { ServiceOrderFormEquipment } from './ServiceOrderFormEquipment';
import { ServiceOrderFormData, ServiceOrder } from '../../types/serviceOrder';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const defaultFormData: ServiceOrderFormData = {
  customerId: '',
  customerName: '',
  technicianName: '',
  status: 'open',
  startDate: new Date(),
  warrantyPeriod: 90,
  equipment: {
    category: '',
    subcategory: '',
    brand: '',
    model: '',
    color: '',
    imei: '',
    reportedIssue: '',
    hasPower: true
  },
  checklists: [],
  services: [],
  products: [],
  technicalFeedback: '',
  discount: 0
};

const steps = [
  {
    title: 'Informações Básicas',
    description: 'Dados do cliente e técnico'
  },
  {
    title: 'Equipamento',
    description: 'Detalhes do dispositivo'
  },
  {
    title: 'Serviços',
    description: 'Serviços a realizar'
  },
  {
    title: 'Produtos',
    description: 'Peças e produtos'
  },
  {
    title: 'Resumo',
    description: 'Revisão e finalização'
  }
];

export function ServiceOrderFormMaster() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [formData, setFormData] = useState<ServiceOrderFormData>(defaultFormData);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 500);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (id) {
      loadServiceOrder(id);
    } else {
      setInitialized(true);
    }
  }, [id]);

  const loadServiceOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'serviceOrders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        const orderData = orderSnap.data() as ServiceOrder;
        
        setFormData({
          id: orderData.id,
          customerId: orderData.customerId,
          customerName: orderData.customerName,
          technicianName: orderData.technicianName,
          status: orderData.status,
          startDate: orderData.startDate.toDate(),
          warrantyPeriod: orderData.warrantyPeriod,
          equipment: orderData.equipment,
          checklists: orderData.checklists || [],
          services: orderData.services || [],
          products: orderData.products || [],
          technicalFeedback: orderData.technicalFeedback || '',
          discount: orderData.discountedAmount || 0
        });
        
        setInitialized(true);
      } else {
        throw new Error('Ordem de serviço não encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar ordem de serviço:', error instanceof Error ? error.message : error);
      setError('Não foi possível carregar a ordem de serviço. Por favor, tente novamente.');
      setInitialized(true);
      navigate('/service-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleNextTab = () => {
    if (activeTab < steps.length - 1) {
      setActiveTab(activeTab + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousTab = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <ServiceOrderProvider initialData={formData}>
      <div className="min-h-screen bg-gray-50">
        {loading && (
          <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-lg shadow-lg">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Carregando ordem de serviço...</span>
            </div>
          </div>
        )}

        {error && (
          <div className={`fixed ${isMobile ? 'top-2 right-2 left-2' : 'top-4 right-4'} bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg shadow-lg`}>
            {error}
          </div>
        )}

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className={`-px-12  py-6 sm:px-0 ${isMobile ? 'py-2' : 'py-6'}`}>
            {/* Progress Steps */}
            <div className={`mb-6 ${isMobile ? '-mb-5' : 'mb-8'}`}>
              <div className={`${isMobile ? '-mt-12' : 'mt-4'} bg-white shadow-sm rounded-lg`}>
                <div className={`${isMobile ? 'px-2 py-2' : 'px-4 py-5'} sm:p-6`}>
                  <h3 className={`${isMobile ? 'mb-2 text-base' : 'mb-4 text-lg'} font-medium leading-6 text-gray-900`}>
                    Etapas
                  </h3>
                  <ServiceOrderSteps
                    steps={steps}
                    currentStep={activeTab}
                    isMobile={isMobile}
                  />
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {initialized && (
              <div className={`mt-6 ${isMobile ? 'space-y-4' : 'space-y-6'}`}>
                {activeTab === 0 && <ServiceOrderFormPage onNext={handleNextTab} isMobile={isMobile} />}
                {activeTab === 1 && <ServiceOrderFormEquipment onNext={handleNextTab} onPrevious={handlePreviousTab} isMobile={isMobile} />}
                {activeTab === 2 && <ServiceOrderFormService onNext={handleNextTab} onPrevious={handlePreviousTab} isMobile={isMobile} />}
                {activeTab === 3 && <ServiceOrderFormProduct onNext={handleNextTab} onPrevious={handlePreviousTab} isMobile={isMobile} />}
                {activeTab === 4 && <ServiceOrderFormSummary onPrevious={handlePreviousTab} isMobile={isMobile} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </ServiceOrderProvider>
  );
}

export default ServiceOrderFormMaster;