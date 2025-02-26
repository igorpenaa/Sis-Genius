import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Wrench,
  DollarSign,
  Tag,
  Package,
  Menu,
  X,
  MessageCircle
} from 'lucide-react';
import {
  collection, getDocs, query, orderBy, doc, deleteDoc, getDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Part } from '../../../types/part';
import { formatCurrency } from '../../../utils/format';
import { DeleteConfirmationModal } from '../../../components/DeleteConfirmationModal';

interface DeleteModalState {
  isOpen: boolean;
  partId: string | null;
  partName: string;
}

export function PartListPage() {
  const navigate = useNavigate();
  const [parts, setParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    partId: null,
    partName: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    loadParts();
    const loadSuppliers = async () => {
      try {
        const suppliersRef = collection(db, 'suppliers');
        const snapshot = await getDocs(suppliersRef);
        const suppliersData = {};
        snapshot.docs.forEach(doc => {
          suppliersData[doc.id] = doc.data();
        });
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
      }
    };
    loadSuppliers();
  }, []);

  const loadParts = async () => {
    try {
      const partsRef = collection(db, 'parts');
      const q = query(partsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const partsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Part[];

      setParts(partsData);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPart = () => {
    navigate('/store/parts/new');
  };

  const handleEdit = (part: Part) => {
    navigate(`/store/parts/edit/${part.id}`);
  };

  const handleDelete = (part: Part) => {
    setDeleteModal({
      isOpen: true,
      partId: part.id,
      partName: part.name
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.partId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'parts', deleteModal.partId));
      await loadParts();
      setDeleteModal({ isOpen: false, partId: null, partName: '' });
    } catch (error) {
      console.error('Error deleting part:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleWhatsAppMessage = (part: Part) => {
    if (!part.supplierId) {
      alert('Esta peça não tem fornecedor cadastrado.');
      return;
    }

    const supplierData = suppliers[part.supplierId];
    if (!supplierData?.phones?.mobile) {
      alert('O fornecedor não tem telefone móvel cadastrado.');
      return;
    }

    const phone = supplierData.phones.mobile.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá, tudo bom? Tem disponível ${part.name} da ${part.brand}, em caso positivo qual o valor?`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lista de Peças</h1>
              <p className="hidden md:block text-gray-600 mt-1">Visualize e gerencie todas as suas peças</p>
            </div>
            
            {/* Desktop button */}
            <div className="hidden md:block">
              <button
                onClick={handleNewPart}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova Peça
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
                onClick={handleNewPart}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova Peça
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar peças..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-1 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Part List */}
      <div className="p-4 md:p-8">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peça
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-500">Carregando peças...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma peça encontrada
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {part.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(Number(part.price))}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{part.brand}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${
                          part.quality === 'exclusive' ? 'bg-green-700' :
                          part.quality === 'premium' ? 'bg-green-500' :
                          part.quality === 'traditional' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}>
                          {part.quality === 'exclusive' && 'Exclusiva'}
                          {part.quality === 'premium' && 'Premium'}
                          {part.quality === 'traditional' && 'Tradicional'}
                          {part.quality === 'inferior' && 'Inferior'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleWhatsAppMessage(part)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Enviar mensagem WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(part)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(part)}
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
                  <span className="text-gray-500">Carregando peças...</span>
                </div>
              </div>
            ) : filteredParts.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                Nenhuma peça encontrada
              </div>
            ) : (
              filteredParts.map((part) => (
                <div key={part.id} className="p-3">
                  <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {part.name}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <div className="text-xs text-gray-500 flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatCurrency(part.price)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            {part.brand}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Package className="w-3 h-3 mr-1" />
                            {part.quality === 'exclusive' ? 'Exclusiva' :
                             part.quality === 'premium' ? 'Premium' :
                             part.quality === 'traditional' ? 'Tradicional' :
                             'Inferior'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleWhatsAppMessage(part)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Enviar mensagem WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(part)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(part)}
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
        title="Excluir Peça"
        message={`Tem certeza que deseja excluir a peça "${deleteModal.partName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, partId: null, partName: '' })}
        loading={deleteLoading}
      />
    </div>
  );
}
