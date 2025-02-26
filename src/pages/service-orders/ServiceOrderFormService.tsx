import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Service } from '../../types/service';
import { useServiceOrder } from '../../contexts/ServiceOrderContext';
import { formatCurrency } from '../../utils/format';

interface ServiceOrderFormServiceProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function ServiceOrderFormService({
  onNext,
  onPrevious
}: ServiceOrderFormServiceProps) {
  const { formData, setFormData } = useServiceOrder();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      const servicesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Serviço sem nome',
          salePrice: data.salePrice || 0,
          partId: data.partId,
          description: data.description || '',
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Service[];
      console.log('Serviços carregados:', servicesData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    if (!selectedService) return;

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    console.log('Adicionando serviço:', service);

    setFormData(prev => ({
      ...prev,
      services: [
        ...(prev.services || []),
        {
          serviceId: service.id,
          serviceName: service.name,
          quantity: 1,
          unitPrice: service.salePrice
        }
      ]
    }));

    setSelectedService('');
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const updateServiceQuantity = (index: number, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, quantity } : service
      )
    }));
  };

  const calculateTotal = () => {
    return formData.services.reduce((total, service) => {
      const serviceData = services.find(s => s.id === service.serviceId);
      if (!serviceData) return total;
      return total + (serviceData.salePrice * service.quantity);
    }, 0);
  };

  const handleNext = () => {
    // Validate if at least one service is added
    if (formData.services.length === 0) {
      alert('Por favor, adicione pelo menos um serviço');
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Serviços</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-64 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Selecione um serviço...</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - {formatCurrency(service.salePrice)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addService}
              disabled={!selectedService}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar
            </button>
          </div>
        </div>

        {/* Service List */}
        {formData.services.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            Nenhum serviço adicionado. Selecione um serviço acima para adicionar.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr,100px,120px,120px,48px] gap-4 px-4 py-2 bg-gray-50 rounded-t-lg">
              <div className="text-sm font-medium text-gray-500">Serviço</div>
              <div className="text-sm font-medium text-gray-500">Qtd.</div>
              <div className="text-sm font-medium text-gray-500">Valor Unit.</div>
              <div className="text-sm font-medium text-gray-500">Subtotal</div>
              <div></div>
            </div>
            
            {formData.services.map((service, index) => {
              const serviceData = services.find(s => s.id === service.serviceId);
              if (!serviceData) return null;
              
              const subtotal = service.quantity * serviceData.salePrice;
              
              return (
                <div key={index} className="grid grid-cols-[1fr,100px,120px,120px,48px] gap-4 items-center px-4 py-3 bg-white rounded-lg shadow-sm">
                  <div>
                    <div className="font-medium">{serviceData.name}</div>
                  </div>
                  <input
                    type="number"
                    value={service.quantity}
                    onChange={(e) => updateServiceQuantity(index, parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="text-right font-medium">
                    {formatCurrency(serviceData.salePrice)}
                  </div>
                  <div className="text-right font-medium">
                    {formatCurrency(subtotal)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}

            <div className="flex justify-end pt-4 border-t">
              <div className="text-lg font-bold">
                Total: {formatCurrency(calculateTotal())}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center"
        >
          Próximo
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}