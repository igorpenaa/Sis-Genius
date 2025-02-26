import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, FileText, MessageCircle, Edit2, Trash2, Search } from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { formatCurrency } from '../../../utils/format';
import { StatusEditModal } from '../../../components/StatusEditModal';
import { DeleteConfirmationModal } from '../../../components/DeleteConfirmationModal';
import { ProductSaleReceiptModal } from '../../../components/ProductSaleReceiptModal';

interface DeviceSale {
  id: string;
  saleNumber: string;
  customerName: string;
  customerId: string;
  customerPhone?: string;
  status: string;
  totalValue: number;
  finalValue: number;
  discountValue: number;
  paymentMethod: string;
  devices: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    condition: 'NOVO' | 'SEMINOVO' | 'VITRINE' | 'USADO';
    ram?: string;
    rom?: string;
    color?: string;
    serialNumber?: string;
    imei1?: string;
    imei2?: string;
  }>;
  createdAt: any;
}

interface DeleteModalState {
  isOpen: boolean;
  saleId: string | null;
  saleNumber: string;
}

export function DeviceSalesListPage() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<DeviceSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<DeviceSale | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    saleId: null,
    saleNumber: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const salesRef = collection(db, 'deviceSales');
      const q = query(salesRef, orderBy('saleNumber', 'desc'));
      const snapshot = await getDocs(q);
      
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeviceSale[];

      setSales(salesData);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      setError('Erro ao carregar vendas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const filteredSales = sales.filter(sale => 
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (saleId: string) => {
    try {
      setDeleteLoading(true);
      await deleteDoc(doc(db, 'deviceSales', saleId));
      await loadSales();
      setDeleteModal({ isOpen: false, saleId: null, saleNumber: '' });
    } catch (error) {
      console.error('Erro ao deletar venda:', error);
      setError('Erro ao deletar venda. Tente novamente.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedSale) return;

    try {
      await updateDoc(doc(db, 'deviceSales', selectedSale.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      await loadSales();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setError('Erro ao atualizar status. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'canceled':
        return 'Cancelada';
      case 'in_progress':
        return 'Em Andamento';
      default:
        return 'Em Aberto';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendas de Aparelhos</h1>
        <button
          onClick={() => navigate('/sales/devices/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Venda de Aparelho
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por número da venda ou cliente..."
          className="w-full outline-none"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nº Venda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Final
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Carregando...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Nenhuma venda encontrada
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.saleNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                        {getStatusText(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(sale.totalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(sale.finalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowStatusModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Alterar Status"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowReceiptModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Ver Recibo"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/sales/devices/edit/${sale.id}`)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({
                          isOpen: true,
                          saleId: sale.id,
                          saleNumber: sale.saleNumber
                        })}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
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

      {showStatusModal && selectedSale && (
        <StatusEditModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onStatusChange={handleStatusChange}
          currentStatus={selectedSale.status}
        />
      )}

      {showReceiptModal && selectedSale && (
        <ProductSaleReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          sale={{
            ...selectedSale,
            products: selectedSale.devices.map(device => ({
              name: device.name,
              quantity: device.quantity,
              unitPrice: device.unitPrice,
              discount: device.discount,
              subtotal: device.subtotal
            }))
          }}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, saleId: null, saleNumber: '' })}
        onConfirm={() => deleteModal.saleId && handleDelete(deleteModal.saleId)}
        title="Excluir Venda"
        message={`Tem certeza que deseja excluir a venda ${deleteModal.saleNumber}?`}
        loading={deleteLoading}
      />
    </div>
  );
}
