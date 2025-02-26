import React, { useState, useEffect } from 'react';
import { Search, X, Plus, MessageCircle, Check } from 'lucide-react';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatPhone } from '../utils/validators';
import { Customer } from '../types/customer';

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (whatsapp: string, name: string) => void;
  serviceName: string;
  selectedService: any;
  partQuality: string;
  formatCurrency: (value: number) => string;
}

type Mode = 'select' | 'search' | 'quickAdd';

export function CustomerSearchModal({ isOpen, onClose, onSelectCustomer, serviceName, selectedService, partQuality, formatCurrency }: CustomerSearchModalProps) {
  const [mode, setMode] = useState<Mode>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newCustomer, setNewCustomer] = useState<{ phone: string; name: string } | null>(null);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    whatsapp: ''
  });

  const handleSendWhatsApp = () => {
    if (!newCustomer) return;
    
    const message = `Olá, ${newCustomer.name}, tudo bom? O orçamento para o serviço: ${serviceName} é ${formatCurrency(selectedService.salePrice)}, essa é uma peça ${partQuality}.O orçamento tem validade de 24hs, pois o valor da peça depende da variação do mercado e do dólar.`;
    window.open(`https://wa.me/55${newCustomer.phone}?text=${encodeURIComponent(message)}`, '_blank');
    onClose();
  };

  const handleQuickAdd = async () => {
    if (!quickAddForm.name.trim() || !quickAddForm.whatsapp.trim()) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = quickAddForm.whatsapp.replace(/\D/g, '');
      const customerData = {
        name: quickAddForm.name.trim(),
        type: 'individual',
        status: 'active',
        phones: {
          whatsapp: formattedPhone
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalPurchases: 0
      };

      await addDoc(collection(db, 'customers'), customerData);
      setNewCustomer({ phone: formattedPhone, name: customerData.name });
      setShowSuccess(true);
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      alert('Erro ao cadastrar cliente. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Customer[];

      setCustomers(customersData);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'search') {
      handleSearch();
    }
  }, [mode]);

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setQuickAddForm(prev => ({
      ...prev,
      whatsapp: formatPhone(value)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'select' ? 'Selecione uma opção' : mode === 'search' ? 'Buscar Cliente' : 'Cadastro Rápido'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {showSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cliente cadastrado com sucesso!</h3>
              <button
                onClick={handleSendWhatsApp}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Clique para enviar o orçamento
              </button>
            </div>
          ) : mode === 'select' ? (
            <div className="space-y-4">
              <button
                onClick={() => setMode('search')}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar Cliente
              </button>
              <button
                onClick={() => setMode('quickAdd')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Cadastro Rápido
              </button>
            </div>
          ) : mode === 'search' ? (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Digite o nome do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : filteredCustomers.length > 0 ? (
                  <div className="space-y-2">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          if (customer.phones?.whatsapp) {
                            onSelectCustomer(customer.phones.whatsapp, customer.name);
                            onClose();
                          } else {
                            alert('Este cliente não possui WhatsApp cadastrado');
                          }
                        }}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            {customer.phones?.whatsapp && (
                              <div className="text-sm text-gray-500 mt-1">
                                WhatsApp: {customer.phones.whatsapp}
                              </div>
                            )}
                          </div>
                          {customer.phones?.whatsapp && (
                            <MessageCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchTerm ? (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum cliente encontrado
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Digite para buscar clientes
                  </div>
                )}
              </div>

              <button
                onClick={() => setMode('select')}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={quickAddForm.whatsapp}
                  onChange={handlePhoneChange}
                  placeholder="00 00000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setMode('select')}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleQuickAdd}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar e Enviar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
