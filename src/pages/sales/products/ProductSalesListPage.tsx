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
  serverTimestamp, 
  getDoc, 
  setDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { formatCurrency } from '../../../utils/format';
import { StatusEditModal } from '../../../components/StatusEditModal';
import { DeleteConfirmationModal } from '../../../components/DeleteConfirmationModal';
import { ProductSaleReceiptModal } from '../../../components/ProductSaleReceiptModal';

interface ProductSale {
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
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }>;
  createdAt: any;
}

interface DeleteModalState {
  isOpen: boolean;
  saleId: string | null;
  saleNumber: string;
}

export function ProductSalesListPage() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<ProductSale | null>(null);
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
      
      const salesRef = collection(db, 'productSales');
      const q = query(salesRef, orderBy('saleNumber', 'desc'));
      const snapshot = await getDocs(q);
      
      const salesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          saleNumber: data.saleNumber || '0',
          customerName: data.customerName || '',
          customerId: data.customerId,
          customerPhone: data.customerPhone,
          status: data.status,
          totalValue: data.totalValue || 0,
          finalValue: data.finalValue || 0,
          discountValue: data.discountValue || 0,
          paymentMethod: data.paymentMethod || '',
          products: data.products || [],
          createdAt: data.createdAt
        };
      }) as ProductSale[];

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

  const handleDelete = (sale: ProductSale) => {
    setDeleteModal({
      isOpen: true,
      saleId: sale.id,
      saleNumber: sale.saleNumber
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.saleId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'productSales', deleteModal.saleId));
      await loadSales();
      setDeleteModal({ isOpen: false, saleId: null, saleNumber: '' });
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (sale: ProductSale, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'productSales', sale.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      await loadSales();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleWhatsApp = async (sale: ProductSale) => {
    try {
      if (!sale.customerId) {
        alert('Cliente não encontrado');
        return;
      }

      // Buscar os dados do cliente na coleção customers
      const customerRef = doc(db, 'customers', sale.customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        alert('Cliente não encontrado');
        return;
      }

      const customerData = customerDoc.data();
      const whatsapp = customerData.whatsapp;

      if (!whatsapp) {
        alert('Cliente não possui número de WhatsApp cadastrado');
        return;
      }

      // Formatar o número do WhatsApp (remover caracteres especiais)
      const formattedWhatsapp = whatsapp.replace(/\D/g, '');
      
      // Criar lista de produtos
      const productsList = sale.products
        .map(p => p.name)
        .join(', ');

      // Criar a mensagem
      const message = `Olá ${sale.customerName}, vamos te encaminhar o comprovante de venda ${sale.saleNumber}, referente ${productsList}`;
      
      // Codificar a mensagem para URL
      const encodedMessage = encodeURIComponent(message);
      
      // Criar o link do WhatsApp
      const whatsappUrl = `https://wa.me/55${formattedWhatsapp}?text=${encodedMessage}`;
      
      // Abrir em uma nova aba
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem via WhatsApp');
    }
  };

  const handleShowReceipt = async (sale: ProductSale) => {
    try {
      // Carregar dados completos da venda
      const saleDoc = await getDoc(doc(db, 'productSales', sale.id));
      if (saleDoc.exists()) {
        const data = saleDoc.data();
        const fullSale: ProductSale = {
          id: sale.id,
          saleNumber: data.saleNumber || '0',
          customerName: data.customerName || '',
          customerId: data.customerId,
          customerPhone: data.customerPhone,
          status: data.status,
          totalValue: data.totalValue || 0,
          finalValue: data.finalValue || 0,
          discountValue: data.discountValue || 0,
          paymentMethod: data.paymentMethod || '',
          products: data.products || [],
          createdAt: data.createdAt
        };
        setSelectedSale(fullSale);
        setShowReceiptModal(true);
      }
    } catch (error) {
      console.error('Erro ao carregar dados completos da venda:', error);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
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
      case 'open':
        return 'Aberto';
      case 'completed':
        return 'Concluído';
      case 'canceled':
        return 'Cancelado';
      case 'in_progress':
        return 'Em Andamento';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Vendas de Produtos</h1>
          <button
            onClick={() => navigate('/sales/products/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Venda
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar por número ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:ring-0 flex-1"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
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
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{sale.saleNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sale.status)}`}
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowStatusModal(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {getStatusText(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(sale.totalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleShowReceipt(sale)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        title="Visualizar Recibo"
                      >
                        <FileText className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleWhatsApp(sale)}
                        className="text-green-600 hover:text-green-900 inline-flex items-center"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/sales/products/edit/${sale.id}`)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sale)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma venda encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Status */}
      {showStatusModal && selectedSale && (
        <StatusEditModal
          currentStatus={selectedSale.status}
          onStatusChange={(newStatus) => handleStatusChange(selectedSale, newStatus)}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedSale(null);
          }}
        />
      )}

      {/* Modal do Recibo */}
      {showReceiptModal && selectedSale && (
        <ProductSaleReceiptModal
          sale={selectedSale}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Excluir Venda"
        message={`Tem certeza que deseja excluir a venda #${deleteModal.saleNumber}?`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, saleId: null, saleNumber: '' })}
        isLoading={deleteLoading}
      />
    </div>
  );
}
