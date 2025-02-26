import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { AlertModal } from '../../components/AlertModal';

interface Warranty {
  id: string;
  name: string;
  durationDays: number;
  warrantyTerms: string;
  isDefault: boolean;
}

export function WarrantyListPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadWarranties();
  }, []);

  const loadWarranties = async () => {
    try {
      const warrantyQuery = query(collection(db, 'warranties'));
      const querySnapshot = await getDocs(warrantyQuery);
      const warrantiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Warranty[];
      setWarranties(warrantiesData);
    } catch (error) {
      console.error('Error loading warranties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (warranty: Warranty) => {
    navigate(`/service-orders/warranties/edit/${warranty.id}`);
  };

  const handleDelete = async () => {
    if (!selectedWarranty) return;

    try {
      if (selectedWarranty.isDefault) {
        alert('Não é possível excluir garantias padrão do sistema.');
        return;
      }

      await deleteDoc(doc(db, 'warranties', selectedWarranty.id));
      await loadWarranties();
      setShowDeleteModal(false);
      setSelectedWarranty(null);
    } catch (error) {
      console.error('Error deleting warranty:', error);
    }
  };

  const filteredWarranties = warranties.filter(warranty =>
    warranty.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Garantias</h1>
              <p className="text-gray-600 mt-1">
                Gerencie os modelos de garantia para ordens de serviço
              </p>
            </div>
            <button
              onClick={() => navigate('/service-orders/warranties/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Garantia
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar garantias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duração (dias)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Padrão
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWarranties.map((warranty) => (
                  <tr key={warranty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{warranty.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{warranty.durationDays}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {warranty.isDefault ? 'Sim' : 'Não'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(warranty)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      {!warranty.isDefault && (
                        <button
                          onClick={() => {
                            setSelectedWarranty(warranty);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={showDeleteModal}
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir esta garantia? Esta ação não pode ser desfeita."
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedWarranty(null);
        }}
        confirmButton={{
          text: 'Excluir',
          onClick: handleDelete,
          className: 'bg-red-600 hover:bg-red-700'
        }}
      />
    </div>
  );
}
