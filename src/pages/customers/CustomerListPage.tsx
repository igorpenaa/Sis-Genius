import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  User,
  Building2,
  Globe,
  Menu,
  X,
  Phone,
  MessageCircle
} from 'lucide-react';
import {
  collection, getDocs, query, orderBy, doc, deleteDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Customer } from '../../types/customer';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

interface DeleteModalState {
  isOpen: boolean;
  customerId: string | null;
  customerName: string;
}

export function CustomerListPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    customerId: null,
    customerName: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastPurchaseDate: doc.data().lastPurchaseDate?.toDate()
      })) as Customer[];

      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewCustomer = () => {
    navigate('/customers/new');
  };

  const handleEdit = (customerId: string) => {
    navigate(`/customers/edit/${customerId}`);
  };

  const handleDelete = (customer: Customer) => {
    setDeleteModal({
      isOpen: true,
      customerId: customer.id,
      customerName: customer.name
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.customerId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'customers', deleteModal.customerId));
      await loadCustomers();
      setDeleteModal({ isOpen: false, customerId: null, customerName: '' });
    } catch (error) {
      console.error('Error deleting customer:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'individual':
        return <User className="w-5 h-5" />;
      case 'company':
        return <Building2 className="w-5 h-5" />;
      case 'foreign':
        return <Globe className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const handleWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${formattedPhone}?text=Olá`, '_blank');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cpf?.includes(searchTerm) ||
    customer.cnpj?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lista de Clientes</h1>
              <p className="hidden md:block text-gray-600 mt-1">Visualize e gerencie todos os seus clientes</p>
            </div>
            
            {/* Desktop button */}
            <div className="hidden md:block">
              <button
                onClick={handleNewCustomer}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Novo Cliente
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
                onClick={handleNewCustomer}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Novo Cliente
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-1 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="p-4 md:p-8">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-500">Carregando clientes...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            {getCustomerTypeIcon(customer.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            {customer.type === 'company' && (
                              <div className="text-sm text-gray-500">
                                {customer.tradeName}
                              </div>
                            )}
                            {customer.phones?.mobile && (
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <Phone className="w-3 h-3 mr-1" />
                                {customer.phones.mobile}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phones?.whatsapp}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.type === 'company' ? customer.cnpj : customer.cpf}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {customer.phones?.whatsapp && (
                          <button
                            onClick={() => handleWhatsApp(customer.phones.whatsapp)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(customer.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                  <span className="text-gray-500">Carregando clientes...</span>
                </div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                Nenhum cliente encontrado
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-3">
                  <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        {getCustomerTypeIcon(customer.type)}
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {customer.name}
                        </div>
                        {customer.phones?.mobile && (
                          <div className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{customer.phones.mobile}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {customer.phones?.whatsapp && (
                        <button
                          onClick={() => handleWhatsApp(customer.phones.whatsapp)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Enviar mensagem no WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(customer.id)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${deleteModal.customerName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, customerId: null, customerName: '' })}
        loading={deleteLoading}
      />
    </div>
  );
}