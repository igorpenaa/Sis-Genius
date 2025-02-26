import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, X, Search } from 'lucide-react';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useServiceOrder } from '../../contexts/ServiceOrderContext';
import { ServiceOrder } from '../../types/serviceOrder';
import { serviceOrderStatus } from '../../utils/serviceOrderStatus';
import { Customer } from '../../types/customer';
import { Employee } from '../../types/employee';
import { Warranty } from '../../types/warranty';
import { getNextOrderNumber } from '../../utils/serviceOrderNumber';

export interface ServiceOrderFormPageProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

function ErrorModal({ message, onClose }: ErrorModalProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
            <h3 className="text-lg font-medium">Erro</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

const defaultFormData: ServiceOrderFormData = {
  technicianName: '',
  status: 'open',
  startDate: new Date(),
  customerId: '',
  customerName: '',
  warrantyPeriod: 90,
  deliveryDate: '',
  equipments: [{
    id: Date.now().toString(),
    category: '',
    subcategory: '',
    brand: '',
    model: '',
    color: '',
    imei: '',
    reportedIssue: '',
    hasPower: true
  }],
  checklists: [],
  services: [],
  products: [],
  technicalFeedback: '',
  discount: 0,
};

function ServiceOrderFormPage({ onNext: parentOnNext, onPrevious }: ServiceOrderFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { formData, setFormData } = useServiceOrder();
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ 
    show: false, 
    message: '' 
  });
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    return formData.customerId ? {
      id: formData.customerId,
      name: formData.customerName
    } as Customer : null;
  });
  const [dateInputValue, setDateInputValue] = useState(() => {
    const date = formData.startDate || new Date();
    return date.toLocaleDateString('pt-BR');
  });
  const [loadingStates, setLoadingStates] = useState({
    customers: true,
    orderData: false,
    warranties: true
  });

  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
  const [technicianSearchTerm, setTechnicianSearchTerm] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState<Employee | null>(null);
  
  const [showWarrantyDropdown, setShowWarrantyDropdown] = useState(false);
  const [warrantySearchTerm, setWarrantySearchTerm] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  
  const [technicians, setTechnicians] = useState<Employee[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [orderWarrantyId, setOrderWarrantyId] = useState<string>('');

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{4})\d+?$/, '$1');
    setDateInputValue(maskedValue);
  };

  const handleDeliveryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{4})\d+?$/, '$1');
    setFormData(prev => ({
      ...prev,
      deliveryDate: maskedValue
    }));
  };

  useEffect(() => {
    loadCustomers();
    if (id) {
      loadServiceOrder(id).then(() => {
        // Após carregar a O.S., atualizar o cliente selecionado
        if (formData.customerId && formData.customerName) {
          setSelectedCustomer({
            id: formData.customerId,
            name: formData.customerName
          } as Customer);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (formData.startDate) {
      const date = new Date(formData.startDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setDateInputValue(`${day}/${month}/${year}`);
    }
  }, [formData.startDate]);

  const loadCustomers = async () => {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef);
      const snapshot = await getDocs(q);
      
      const customersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }) as Customer[];
      
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Erro ao carregar lista de clientes. Por favor, tente novamente.');
    } finally {
      setLoadingStates(prev => ({ ...prev, customers: false }));
    }
  };

  const loadServiceOrder = async (orderId: string) => {
    setLoadingStates(prev => ({ ...prev, orderData: true }));
    try {
      const orderRef = doc(db, 'serviceOrders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        console.log('Raw order data:', orderData);

        // Garantir que temos um array de equipamentos válido
        let equipmentsArray = [];
        if (Array.isArray(orderData.equipments)) {
          console.log('Found equipments array:', orderData.equipments);
          equipmentsArray = orderData.equipments.map(equip => ({
            id: equip.id || Date.now().toString(),
            category: equip.category || '',
            subcategory: equip.subcategory || '',
            brand: equip.brand || '',
            model: equip.model || '',
            color: equip.color || '',
            imei: equip.imei || '',
            serialNumber: equip.serialNumber || '',
            reportedIssue: equip.reportedIssue || '',
            hasPower: typeof equip.hasPower === 'boolean' ? equip.hasPower : true
          }));
        } else if (orderData.equipment && typeof orderData.equipment === 'object') {
          // Compatibilidade com formato antigo
          console.log('Found single equipment, converting to array:', orderData.equipment);
          equipmentsArray = [{
            id: orderData.equipment.id || Date.now().toString(),
            category: orderData.equipment.category || '',
            subcategory: orderData.equipment.subcategory || '',
            brand: orderData.equipment.brand || '',
            model: orderData.equipment.model || '',
            color: orderData.equipment.color || '',
            imei: orderData.equipment.imei || '',
            serialNumber: orderData.equipment.serialNumber || '',
            reportedIssue: orderData.equipment.reportedIssue || '',
            hasPower: typeof orderData.equipment.hasPower === 'boolean' ? orderData.equipment.hasPower : true
          }];
        }

        console.log('Final equipments array:', equipmentsArray);

        // Converter timestamps e formatar dados
        const formattedData = {
          id: orderId,
          customerId: orderData.customerId || '',
          customerName: orderData.customerName || '',
          technicianId: orderData.technicianId || '',
          technicianName: orderData.technicianName || '',
          status: orderData.status || 'open',
          startDate: orderData.startDate?.toDate() || new Date(),
          warrantyId: orderData.warrantyId || '',
          warrantyPeriod: orderData.warrantyPeriod || 90,
          deliveryDate: orderData.deliveryDate || '',
          equipments: equipmentsArray,
          services: Array.isArray(orderData.services) ? orderData.services.map(service => ({
            serviceId: service.serviceId || '',
            serviceName: service.serviceName || 'Serviço não identificado',
            quantity: service.quantity || 0,
            unitPrice: service.unitPrice || 0
          })) : [],
          products: Array.isArray(orderData.products) ? orderData.products.map(product => ({
            productId: product.productId || '',
            productName: product.productName || 'Produto não identificado',
            quantity: product.quantity || 0,
            unitPrice: product.unitPrice || 0
          })) : [],
          checklists: Array.isArray(orderData.checklists) ? orderData.checklists.map(checklist => ({
            id: checklist.id || Date.now().toString(),
            checklistId: checklist.checklistId || '',
            equipmentIndex: checklist.equipmentIndex || 0,
            items: Array.isArray(checklist.items) ? checklist.items.map(item => ({
              id: item.id || Date.now().toString(),
              text: item.text || '',
              checked: item.checked || false
            })) : []
          })) : [],
          technicalFeedback: orderData.technicalFeedback || '',
          discount: orderData.discount || orderData.discountedAmount || 0, // Tentar ambos os campos
        };

        console.log('Final formatted data:', formattedData);
        
        // Limpar o localStorage antes de definir os novos dados
        localStorage.removeItem('serviceOrder_draft');
        
        setFormData(formattedData);
        
        // Atualizar cliente selecionado
        if (orderData.customerId && orderData.customerName) {
          setSelectedCustomer({
            id: orderData.customerId,
            name: orderData.customerName
          } as Customer);
        }

        // Atualizar técnico selecionado
        if (orderData.technicianId && orderData.technicianName) {
          setSelectedTechnician({
            id: orderData.technicianId,
            name: orderData.technicianName
          } as Employee);
        }

        // Atualizar garantia selecionada
        if (orderData.warrantyId) {
          console.log('Setting warranty ID:', orderData.warrantyId);
          setOrderWarrantyId(orderData.warrantyId);
          
          // Tentar encontrar a garantia nos dados já carregados
          const warranty = warranties.find(w => w.id === orderData.warrantyId);
          if (warranty) {
            console.log('Found warranty immediately:', warranty);
            setSelectedWarranty(warranty);
          }
        }

        // Atualizar data
        if (formattedData.startDate) {
          const date = new Date(formattedData.startDate);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          setDateInputValue(`${day}/${month}/${year}`);
        }
      } else {
        throw new Error('Ordem de serviço não encontrada');
      }
    } catch (error) {
      console.error('Error loading service order:', error);
      setErrorModal({
        show: true,
        message: 'Erro ao carregar a ordem de serviço. Por favor, tente novamente.'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, orderData: false }));
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    setCustomerSearchTerm('');
    
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name
    }));
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.cpf?.includes(customerSearchTerm) ||
    customer.cnpj?.includes(customerSearchTerm)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
    
      // Validate required fields
      if (!formData.customerId || !formData.technicianName) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }
    
      // Move to next step
      if (parentOnNext) {
        parentOnNext();
      }
    } catch (err) {
      console.error('Error moving to next step:', err);
      setError('Erro ao avançar para próxima etapa');
    }
  };

  // Load technicians
  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const techniciansRef = collection(db, 'employees');
        const q = query(
          techniciansRef,
          where('role', '==', 'tecnico'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        const techniciansData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Employee[];
        setTechnicians(techniciansData);
      } catch (error) {
        console.error('Error loading technicians:', error);
        setError('Erro ao carregar lista de técnicos.');
      }
    };
    loadTechnicians();
  }, []);

  useEffect(() => {
    const loadWarranties = async () => {
      setLoadingStates(prev => ({ ...prev, warranties: true }));
      try {
        const warrantiesRef = collection(db, 'warranties');
        const warrantiesSnap = await getDocs(warrantiesRef);
        const warrantiesData = warrantiesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Warranty[];
        setWarranties(warrantiesData);

        // Se temos um orderWarrantyId, seleciona a garantia correspondente
        if (orderWarrantyId) {
          const warranty = warrantiesData.find(w => w.id === orderWarrantyId);
          if (warranty) {
            console.log('Found warranty immediately:', warranty);
            setSelectedWarranty(warranty);
          }
        }
      } catch (error) {
        console.error('Error loading warranties:', error);
        setError('Erro ao carregar lista de garantias.');
      } finally {
        setLoadingStates(prev => ({ ...prev, warranties: false }));
      }
    };
    loadWarranties();
  }, [orderWarrantyId]);

  const handleSelectTechnician = (technician: Employee) => {
    setSelectedTechnician(technician);
    setShowTechnicianDropdown(false);
    setTechnicianSearchTerm('');
    setFormData(prev => ({
      ...prev,
      technicianId: technician.id,
      technicianName: technician.name
    }));
  };

  const handleSelectWarranty = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
    setFormData(prev => ({
      ...prev,
      warrantyId: warranty.id,
      warrantyPeriod: warranty.durationDays
    }));
    setShowWarrantyDropdown(false);
    setWarrantySearchTerm('');
  };

  const filteredTechnicians = technicians.filter(tech =>
    tech.name.toLowerCase().includes(technicianSearchTerm.toLowerCase())
  );

  const filteredWarranties = warranties.filter(warranty =>
    warranty.name.toLowerCase().includes(warrantySearchTerm.toLowerCase())
  );

  const isMobile = window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {Object.values(loadingStates).some(state => state) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Carregando...</span>
          </div>
        </div>
      )}

      <ErrorModal 
        message={error || errorModal.message} 
        onClose={() => {
          setError('');
          setErrorModal(prev => ({ ...prev, show: false, message: '' }));
        }} 
      />

      <div className={`max-w-7xl mx-auto ${isMobile ? 'py-1' : 'py-6'} ${isMobile ? 'px-1' : 'sm:px-6 lg:px-8'}`}>
        <div className={`${isMobile ? 'px-1 py-1' : 'px-4 py-6'} sm:px-0`}>
          <div className={`flex justify-between items-center ${isMobile ? 'mb-3' : 'mb-6'}`}>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/service-orders')}
                className={`${isMobile ? 'mr-2' : 'mr-4'} p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-gray-900`}>
                {id ? 'Editar O.S.' : 'Nova O.S.'}
              </h1>
            </div>
          </div>

          <form onSubmit={handleNext} className={`bg-white shadow-lg rounded-lg ${isMobile ? 'p-3' : 'p-6'}`}>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h2>
            
            {/* Grid layout que muda para coluna única no mobile */}
            <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-6'}`}>
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <div className="relative">
                  <div
                    onClick={() => setShowCustomerDropdown(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between bg-white"
                  >
                    <span className={selectedCustomer ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedCustomer ? selectedCustomer.name : 'Selecione um cliente'}
                    </span>
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>

                  {showCustomerDropdown && (
                    <>
                      <div className="fixed inset-0" onClick={() => setShowCustomerDropdown(false)} />
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                        <div className="p-2">
                          <input
                            type="text"
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            placeholder="Buscar cliente..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              onClick={() => handleSelectCustomer(customer)}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">
                                {customer.email} - {customer.cpf || customer.cnpj}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Data de Início */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data de Início
                </label>
                <input
                  type="text"
                  value={dateInputValue}
                  onChange={handleStartDateChange}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="h-12 mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.entries(serviceOrderStatus).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Previsão de Entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Previsão de Entrega
                </label>
                <input
                  type="text"
                  name="deliveryDate"
                  value={formData.deliveryDate || ''}
                  onChange={handleDeliveryDateChange}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Técnico Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Técnico Responsável *
                </label>
                <div className="relative">
                  <div
                    onClick={() => setShowTechnicianDropdown(true)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between bg-white"
                  >
                    <span className={selectedTechnician ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedTechnician ? selectedTechnician.name : 'Selecione um técnico'}
                    </span>
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>

                  {showTechnicianDropdown && (
                    <>
                      <div className="fixed inset-0" onClick={() => setShowTechnicianDropdown(false)} />
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                        <div className="p-2">
                          <input
                            type="text"
                            value={technicianSearchTerm}
                            onChange={(e) => setTechnicianSearchTerm(e.target.value)}
                            placeholder="Buscar técnico..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredTechnicians.map(technician => (
                            <div
                              key={technician.id}
                              onClick={() => handleSelectTechnician(technician)}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-medium">{technician.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Garantia */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Garantia
                </label>
                <div className="relative">
                  <div
                    onClick={() => setShowWarrantyDropdown(true)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between bg-white"
                  >
                    <span className={selectedWarranty ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedWarranty ? `${selectedWarranty.name} (${selectedWarranty.durationDays} dias)` : 'Selecione uma garantia'}
                    </span>
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>

                  {showWarrantyDropdown && (
                    <>
                      <div className="fixed inset-0" onClick={() => setShowWarrantyDropdown(false)} />
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                        <div className="p-2">
                          <input
                            type="text"
                            value={warrantySearchTerm}
                            onChange={(e) => setWarrantySearchTerm(e.target.value)}
                            placeholder="Buscar garantia..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredWarranties.map(warranty => (
                            <div
                              key={warranty.id}
                              onClick={() => handleSelectWarranty(warranty)}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-medium">{warranty.name}</div>
                              <div className="text-sm text-gray-500">
                                {warranty.durationDays} dias
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className={`mt-6 ${isMobile ? 'flex flex-col space-y-3' : 'flex justify-end space-x-4'}`}>
              <button
                type="button"
                onClick={() => navigate('/service-orders')}
                className={`${isMobile ? 'w-full' : ''} px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`${isMobile ? 'w-full' : ''} px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Carregando...
                  </>
                ) : (
                  'Próximo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export { ServiceOrderFormPage }