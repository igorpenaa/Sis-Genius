import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Printer,
  MessageCircle,
  RefreshCw,
  Wrench,
  Tag,
  DollarSign,
  Package,
  X,
  Menu,
  Share2,
  Download
} from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ServiceOrder } from '../../types/serviceOrder';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import { StatusEditModal } from '../../components/StatusEditModal';
import ServiceOrderReport from './ServiceOrderReport';
import { formatCurrency } from '../../utils/format';
import { serviceOrderStatus } from '../../utils/serviceOrderStatus';
import { initializeExistingOrders } from '../../utils/orderNumberGenerator';
import { message, Modal } from 'antd';
import html2pdf from 'html2pdf.js';
import ReactDOM from 'react-dom';

interface DeleteModalState {
  isOpen: boolean;
  orderId: string | null;
  orderNumber: string;
}

interface StatusModalState {
  isOpen: boolean;
  order: ServiceOrder | null;
}

interface PrintModalState {
  isOpen: boolean;
  order: ServiceOrder | null;
}

export function ServiceOrderListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    orderId: null,
    orderNumber: ''
  });
  const [statusModal, setStatusModal] = useState<StatusModalState>({
    isOpen: false,
    order: null
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isReportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [printModal, setPrintModal] = useState<PrintModalState>({
    isOpen: false,
    order: null
  });

  useEffect(() => {
    loadOrders();
    initializeOrderNumbers();
  }, []);

  const loadOrders = async () => {
    try {
      const ordersRef = collection(db, 'serviceOrders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        warrantyExpiration: doc.data().warrantyExpiration?.toDate()
      })) as ServiceOrder[];

      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading service orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeOrderNumbers = async () => {
    try {
      const updatedCount = await initializeExistingOrders();
      if (updatedCount > 0) {
        // Reload orders if any were updated
        loadOrders();
      }
    } catch (error) {
      console.error('Error initializing order numbers:', error);
    }
  };

  const handleNewOrder = () => {
    navigate('/service-orders/new');
  };

  const handleView = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setReportOpen(true);
  };

  const handlePrintClick = (order: ServiceOrder) => {
    // No mobile, abre o modal de seleção
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      setPrintModal({ isOpen: true, order });
    } else {
      // No desktop, comportamento padrão de impressão
      handlePrint(order);
    }
  };

  const handlePrint = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setReportOpen(true);
  };

  const handleWhatsApp = async (order: ServiceOrder) => {
    try {
      if (!order.customerId) {
        message.error('Cliente não encontrado para esta ordem de serviço.');
        return;
      }

      // Buscar dados do cliente
      const customerRef = doc(db, 'customers', order.customerId);
      const customerSnap = await getDoc(customerRef);
      
      if (!customerSnap.exists()) {
        message.error('Dados do cliente não encontrados.');
        return;
      }

      const customer = customerSnap.data();
      
      if (!customer.phones?.whatsapp) {
        message.error('Número de WhatsApp não encontrado para este cliente.');
        return;
      }

      const phoneNumber = customer.phones.whatsapp.replace(/\D/g, '');
      const equipment = order.equipments?.[0];

      const messageText = `Olá ${customer.name}, *O.S. #${order.orderNumber}* | *Status:* ${serviceOrderStatus[order.status || '']} | *Equipamento:* ${equipment?.model || '-'} | *Cor:* ${equipment?.color || '-'} | *IMEI:* ${equipment?.imei || '-'} | *Valor Total:* ${formatCurrency(order.totalAmount || 0)} - Agradecemos a preferência! Se precisar de algo mais, estamos à disposição!`;

      // Em dispositivos móveis, usar window.location.href
      const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(messageText)}`;
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      message.error('Erro ao abrir WhatsApp. Por favor, tente novamente.');
    }
  };

  const handleEdit = (orderId: string) => {
    navigate(`/service-orders/edit/${orderId}`);
  };

  const handleDelete = (order: ServiceOrder) => {
    setDeleteModal({
      isOpen: true,
      orderId: order.id,
      orderNumber: order.id.slice(-4).toUpperCase()
    });
  };

  const handleStatusEdit = (order: ServiceOrder) => {
    setStatusModal({
      isOpen: true,
      order
    });
  };

  const handleStatusUpdate = async (order: ServiceOrder, newStatus: string) => {
    try {
      const orderRef = doc(db, 'serviceOrders', order.id);
      await updateDoc(orderRef, { status: newStatus });

      // Atualizar a lista de ordens
      const updatedOrders = orders.map(o => {
        if (o.id === order.id) {
          return { ...o, status: newStatus };
        }
        return o;
      });
      setOrders(updatedOrders);

      // Perguntar se deseja notificar o cliente
      Modal.confirm({
        title: 'Notificar Cliente',
        content: 'Deseja informar o cliente sobre a mudança de status?',
        okText: 'Sim',
        cancelText: 'Não',
        onOk: async () => {
          try {
            // Buscar dados do cliente
            const customerRef = doc(db, 'customers', order.customerId);
            const customerSnap = await getDoc(customerRef);
            
            if (!customerSnap.exists()) {
              message.error('Dados do cliente não encontrados.');
              return;
            }

            const customer = customerSnap.data();
            
            if (!customer.phones?.whatsapp) {
              message.error('Número de WhatsApp não encontrado para este cliente.');
              return;
            }

            const phoneNumber = customer.phones.whatsapp.replace(/\D/g, '');
            const messageText = `Olá ${customer.name}, sua O.S. ${order.orderNumber}, agora está com o status: ${serviceOrderStatus[newStatus]}`;

            const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(messageText)}`;
            window.open(whatsappUrl, '_blank');
          } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            message.error('Erro ao enviar mensagem. Por favor, tente novamente.');
          }
        }
      });

      message.success('Status atualizado com sucesso!');
      setStatusModal({ isOpen: false, order: null });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      message.error('Erro ao atualizar status. Por favor, tente novamente.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.orderId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'serviceOrders', deleteModal.orderId));
      await loadOrders();
      setDeleteModal({ isOpen: false, orderId: null, orderNumber: '' });
    } catch (error) {
      console.error('Error deleting service order:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeModal = () => {
    setReportOpen(false);
    setSelectedOrder(null);
  };

  const handlePrintOption = async (option: 'print' | 'pdf') => {
    if (!printModal.order) return;

    // Fechar o modal de seleção
    setPrintModal({ isOpen: false, order: null });

    // Abrir o relatório
    setSelectedOrder(printModal.order);
    setReportOpen(true);

    // Aguardar o carregamento do relatório
    await new Promise(resolve => setTimeout(resolve, 500));

    // Chamar a função apropriada do ServiceOrderReport
    const reportElement = document.getElementById('report-content');
    if (!reportElement) {
      message.error('Erro ao gerar relatório. Por favor, tente novamente.');
      return;
    }

    if (option === 'print') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ordem de Serviço #${printModal.order.orderNumber}</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                @media print {
                  @page { margin: 1cm; }
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${reportElement.outerHTML}
              <script>
                window.onload = () => {
                  setTimeout(() => window.print(), 1000);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      try {
        message.loading('Gerando PDF...');
        const opt = {
          margin: 10,
          filename: `ordem-servico-${printModal.order.orderNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          }
        };

        await html2pdf().set(opt).from(reportElement).save();
        message.success('PDF gerado com sucesso!');
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        message.error('Erro ao gerar PDF. Por favor, tente novamente.');
      }
    }

    // Fechar o relatório após a impressão/geração do PDF
    setSelectedOrder(null);
    setReportOpen(false);
  };

  const filteredOrders = orders.filter(order =>
    (order.numidos?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (order.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm relative z-[1]">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
              <p className="hidden md:block text-gray-600 mt-1">Gerencie suas ordens de serviço</p>
            </div>
            
            {/* Desktop button */}
            <div className="hidden md:block">
              <button
                onClick={handleNewOrder}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova O.S.
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
                onClick={handleNewOrder}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova O.S.
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por número ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-1 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Orders List */}
      <div className="p-4 md:p-8">
        {/* Desktop View */}
        <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    O.S.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>                  
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-500">Carregando ordens de serviço...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma ordem de serviço encontrada
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber?.toString().padStart(6, '0')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'canceled' ? 'bg-red-100 text-red-800' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'awaiting_parts' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'warranty_return' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'approved' ? 'bg-teal-100 text-teal-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {serviceOrderStatus[order.status]}
                        </span>
                        <button
                          onClick={() => handleStatusEdit(order)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center justify-end ml-2"
                          title="Alterar Status"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(order.totalAmount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleView(order)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Visualizar"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePrintClick(order)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Imprimir"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(order)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(order.id)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(order)}
                          className="text-red-600 hover:text-red-900 p-1"
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

        {/* Mobile List View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500">Carregando ordens de serviço...</span>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-4 bg-white rounded-lg shadow text-center text-gray-500">
              Nenhuma ordem de serviço encontrada
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow">
                <div className="p-4">
                  {/* Customer Name */}
                  <div className="text-sm font-medium text-gray-900">
                    {order.customerName}
                  </div>

                  {/* Order Details */}
                  <div className="mt-1 space-y-0.5">
                    <div className="text-xs text-gray-500">
                      O.S.: {order.orderNumber?.toString().padStart(6, '0')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="mt-2">
                    <div className="flex items-center justify-center">
                      <span className={`px-2 py-0.5 text-xs leading-4 font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-500 text-white' :
                        order.status === 'canceled' ? 'bg-red-500 text-white' :
                        order.status === 'in_progress' ? 'bg-blue-500 text-white' :
                        order.status === 'awaiting_parts' ? 'bg-yellow-500 text-white' :
                        order.status === 'warranty_return' ? 'bg-purple-500 text-white' :
                        order.status === 'approved' ? 'bg-teal-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {serviceOrderStatus[order.status]}
                      </span>
                      <button
                        onClick={() => handleStatusEdit(order)}
                        className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Alterar Status"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-3 border-t border-gray-200"></div>

                  {/* Centered Action Buttons */}
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => handlePrintClick(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Imprimir"
                    >
                      <Printer className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleWhatsApp(order)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleEdit(order.id)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full"
                      title="Editar"
                    >
                      <Edit2 className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleDelete(order)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Excluir"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <StatusEditModal
        isOpen={statusModal.isOpen}
        order={statusModal.order}
        onClose={() => setStatusModal({ isOpen: false, order: null })}
        onConfirm={handleStatusUpdate}
      />

      {selectedOrder ? (
        <div className="fixed inset-0 z-[200] bg-gray-500 bg-opacity-75">
          <ServiceOrderReport
            isOpen={isReportOpen}
            order={selectedOrder}
            onClose={() => {
              setSelectedOrder(null);
              setReportOpen(false);
            }}
          />
        </div>
      ) : null}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, orderId: null, orderNumber: '' })}
        onConfirm={confirmDelete}
        title="Excluir Ordem de Serviço"
        message={`Tem certeza que deseja excluir a Ordem de Serviço ${deleteModal.orderNumber}?`}
        isLoading={deleteLoading}
      />

      {/* Print/PDF Selection Modal */}
      {printModal.isOpen && printModal.order && (
        <div className="fixed inset-0 z-[300] overflow-y-auto">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="relative inline-block w-full max-w-sm p-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl">
              <div className="text-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Escolha uma opção
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePrintOption('print')}
                    className="inline-flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <Printer className="w-8 h-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-blue-900">Imprimir</span>
                  </button>
                  <button
                    onClick={() => handlePrintOption('pdf')}
                    className="inline-flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
                  >
                    <Share2 className="w-8 h-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-green-900">PDF</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setPrintModal({ isOpen: false, order: null })}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}