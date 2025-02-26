import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Wrench,
  WrenchIcon,
  Menu,
  X,
  DollarSign,
  Tag,
  Package,
  MessageCircle
} from 'lucide-react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Service } from '../../types/service';
import { Part } from '../../types/part';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import { CustomerSearchModal } from '../../components/CustomerSearchModal';
import { formatCurrency } from '../../utils/format';

interface DeleteModalState {
  isOpen: boolean;
  serviceId: string | null;
  serviceName: string;
}

export function ServiceListPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [parts, setParts] = useState<{ [key: string]: Part }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasServices, setHasServices] = useState<boolean | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    serviceId: null,
    serviceName: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadParts = async (services: Service[]) => {
    const partsToLoad = services.filter(service => service.partId);
    const partsData: Record<string, Part> = {};

    for (const service of partsToLoad) {
      if (service.partId) {
        try {
          const partDoc = await getDoc(doc(db, 'parts', service.partId));
          if (partDoc.exists()) {
            partsData[service.partId] = partDoc.data() as Part;
          }
        } catch (error) {
          console.error('Error loading part:', error);
        }
      }
    }

    setParts(partsData);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Service[];

      // Carregar todas as peças referenciadas
      const partsToFetch = new Set(servicesData.map(service => service.partId).filter(Boolean));
      const partsData = {};
      
      for (const partId of partsToFetch) {
        const partDoc = await getDoc(doc(db, 'parts', partId));
        if (partDoc.exists()) {
          partsData[partId] = { id: partId, ...partDoc.data() };
        }
      }

      setParts(partsData);
      setServices(servicesData);
      setHasServices(servicesData.length > 0);
    } catch (error) {
      console.error('Error loading services:', error);
      setHasServices(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNewService = () => {
    navigate('/services/new');
  };

  const handleEdit = (serviceId: string) => {
    navigate(`/services/edit/${serviceId}`);
  };

  const handleDelete = (service: Service) => {
    setDeleteModal({
      isOpen: true,
      serviceId: service.id,
      serviceName: service.name
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.serviceId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'services', deleteModal.serviceId));
      await loadServices();
      setDeleteModal({ isOpen: false, serviceId: null, serviceName: '' });
    } catch (error) {
      console.error('Error deleting service:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${formattedPhone}?text=Olá`, '_blank');
  };

  const handleWhatsAppClick = (service: Service) => {
    setSelectedService(service);
    setShowCustomerModal(true);
  };

  const handleCustomerSelect = (whatsapp: string, customerName: string) => {
    if (!selectedService) return;

    const formattedPhone = whatsapp.replace(/\D/g, '');
    const partQuality = selectedService.partId ? parts[selectedService.partId]?.quality || 'N/A' : 'N/A';
    const message = `Olá, ${customerName}, tudo bom? O orçamento para o serviço: ${selectedService.name} é ${formatCurrency(selectedService.salePrice)}, essa é uma peça ${partQuality}.O orçamento tem validade de 24hs, pois o valor da peça depende da variação do mercado e do dólar.`;
    
    const whatsappUrl = `https://wa.me/55${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    // Em dispositivos móveis, usar window.location.href
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, '_blank');
    }
    setShowCustomerModal(false);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lista de Serviços</h1>
              <p className="hidden md:block text-gray-600 mt-1">Visualize e gerencie todos os seus serviços</p>
            </div>
            
            {/* Desktop button */}
            <div className="hidden md:block">
              <button
                onClick={handleNewService}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Serviço
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg p-4 space-y-2 md:hidden">
              <button
                onClick={handleNewService}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Serviço
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-1 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service List */}
      <div className="p-4 md:p-8">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="mt-4">
              <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nome
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Valor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Marca
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Qualidade
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredServices.map((service) => (
                            <tr key={service.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <Wrench className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {service.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatCurrency(service.salePrice)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {service.partId && parts[service.partId]?.brand || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {service.partId && parts[service.partId] ? (
                                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${
                                    parts[service.partId].quality === 'exclusive' ? 'bg-green-700' :
                                    parts[service.partId].quality === 'premium' ? 'bg-green-500' :
                                    parts[service.partId].quality === 'traditional' ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}>
                                    {parts[service.partId].quality === 'exclusive' && 'Exclusiva'}
                                    {parts[service.partId].quality === 'premium' && 'Premium'}
                                    {parts[service.partId].quality === 'traditional' && 'Tradicional'}
                                    {parts[service.partId].quality === 'inferior' && 'Inferior'}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-500">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleWhatsAppClick(service)}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  <MessageCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleEdit(service.id)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(service)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden">
          {/* Mobile Table Header */}
          <div className="bg-gray-50 px-3 py-3 rounded-t-lg border-b">
            <div className="grid grid-cols-[1fr,auto]">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                Ações
              </div>
            </div>
          </div>
          
          {/* Mobile Table Content */}
          <div className="bg-white divide-y divide-gray-200">
            {loading ? (
              <div className="p-3 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-500">Carregando serviços...</span>
                </div>
              </div>
            ) : !hasServices ? (
              <div className="p-3 text-center text-gray-500">
                Nenhum serviço encontrado
              </div>
            ) : (
              filteredServices.map((service) => (
                <div key={service.id} className="p-3">
                  <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {service.name}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <div className="text-xs text-gray-500 flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatCurrency(service.salePrice)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            {service.partId && parts[service.partId]?.brand || '-'}
                          </div>
                          <div className="text-xs flex items-center">
                            <Package className="w-3 h-3 mr-1" />
                            {service.partId && parts[service.partId] ? (
                              <span className={`px-2 py-0.5 text-xs leading-4 font-semibold rounded-full text-white ${
                                parts[service.partId].quality === 'exclusive' ? 'bg-green-700' :
                                parts[service.partId].quality === 'premium' ? 'bg-green-500' :
                                parts[service.partId].quality === 'traditional' ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}>
                                {parts[service.partId].quality === 'exclusive' && 'Exclusiva'}
                                {parts[service.partId].quality === 'premium' && 'Premium'}
                                {parts[service.partId].quality === 'traditional' && 'Tradicional'}
                                {parts[service.partId].quality === 'inferior' && 'Inferior'}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleWhatsAppClick(service)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(service.id)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, serviceId: null, serviceName: '' })}
        onConfirm={confirmDelete}
        title={deleteModal.serviceName}
        loading={deleteLoading}
      />

      {showCustomerModal && (
        <CustomerSearchModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSelectCustomer={handleCustomerSelect}
          serviceName={selectedService?.name || ''}
          selectedService={selectedService}
          partQuality={selectedService?.partId ? parts[selectedService.partId]?.quality || 'N/A' : 'N/A'}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}