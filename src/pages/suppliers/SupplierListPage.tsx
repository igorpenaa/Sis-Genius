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
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Supplier } from '../../types/supplier';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

interface DeleteModalState {
  isOpen: boolean;
  supplierId: string | null;
  supplierName: string;
}

export function SupplierListPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    supplierId: null,
    supplierName: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const q = query(suppliersRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const suppliersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Supplier[];

      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSupplier = () => {
    navigate('/suppliers/new');
    setMenuOpen(false);
  };

  const handleEdit = (supplierId: string) => {
    navigate(`/suppliers/edit/${supplierId}`);
  };

  const handleWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${formattedPhone}?text=Olá`, '_blank');
  };

  const handleDelete = (supplier: Supplier) => {
    setDeleteModal({
      isOpen: true,
      supplierId: supplier.id,
      supplierName: supplier.name
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.supplierId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'suppliers', deleteModal.supplierId));
      await loadSuppliers();
      setDeleteModal({ isOpen: false, supplierId: null, supplierName: '' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getSupplierTypeIcon = (type: string) => {
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

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cpf?.includes(searchTerm) ||
    supplier.cnpj?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lista de Fornecedores</h1>
              <p className="hidden md:block text-gray-600 mt-1">Visualize e gerencie todos os seus fornecedores</p>
            </div>

            {/* Desktop button */}
            <div className="hidden md:block">
              <button
                onClick={handleNewSupplier}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Novo Fornecedor
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
                onClick={handleNewSupplier}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Novo Fornecedor
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Supplier List */}
      <div className="p-4 md:p-8">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornecedor
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
                        <span className="text-gray-500">Carregando fornecedores...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nenhum fornecedor encontrado
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            {getSupplierTypeIcon(supplier.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {supplier.type === 'company' ? supplier.tradeName : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.email}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {supplier.phones?.commercial}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {supplier.type === 'company' ? supplier.cnpj : supplier.cpf}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          supplier.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {supplier.phones?.mobile && (
                          <button
                            onClick={() => handleWhatsApp(supplier.phones.mobile)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(supplier.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
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
          <div className="bg-gray-50 px-4 py-3 rounded-t-lg border-b">
            <div className="grid grid-cols-2">
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
              <div className="p-4 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-500">Carregando fornecedores...</span>
                </div>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhum fornecedor encontrado
              </div>
            ) : (
              filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="p-4">
                  <div className="grid grid-cols-2 items-center">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        {getSupplierTypeIcon(supplier.type)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.name}
                        </div>
                        {supplier.phones?.commercial && (
                          <div className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Phone className="w-3 h-3 mr-1" />
                            {supplier.phones.commercial}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      {supplier.phones?.mobile && (
                        <button
                          onClick={() => handleWhatsApp(supplier.phones.mobile)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(supplier.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
        title="Excluir Fornecedor"
        message={`Tem certeza que deseja excluir o fornecedor "${deleteModal.supplierName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, supplierId: null, supplierName: '' })}
        loading={deleteLoading}
      />
    </div>
  );
}