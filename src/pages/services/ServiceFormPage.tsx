import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ArrowLeft, Save, AlertTriangle, X, Plus } from 'lucide-react';
import { db } from '../../config/firebase';
import { Service, ServiceFormData } from '../../types/service';
import { Part } from '../../types/part';
import { formatCurrency } from '../../utils/format';
import { PartFormPage } from '../store/parts/PartFormPage';

const defaultFormData: ServiceFormData = {
  name: '',
  salePrice: 0,
  partId: '',
  description: '',
  status: 'active'
};

export function ServiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);
  const [parts, setParts] = useState<Part[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [profit, setProfit] = useState<number>(0);
  const [showPartModal, setShowPartModal] = useState(false);

  const showError = (message: string) => {
    setErrorModal({ show: true, message });
  };

  useEffect(() => {
    const init = async () => {
      await loadParts();
      if (id) {
        await loadService(id);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (selectedPart && formData.salePrice) {
      const newProfit = formData.salePrice - selectedPart.price;
      setProfit(newProfit);
    } else {
      setProfit(formData.salePrice);
    }
  }, [selectedPart, formData.salePrice]);

  const loadParts = async () => {
    try {
      const partsRef = collection(db, 'parts');
      const q = query(partsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const partsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Part[];

      setParts(partsData);
      return partsData;
    } catch (error) {
      console.error('Error loading parts:', error);
      return [];
    }
  };

  const loadService = async (serviceId: string) => {
    try {
      const docRef = doc(db, 'services', serviceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const serviceData = docSnap.data() as Service;
        setFormData({
          name: serviceData.name,
          salePrice: serviceData.salePrice,
          partId: serviceData.partId || '',
          description: serviceData.description,
          status: serviceData.status
        });

        if (serviceData.partId) {
          const partRef = doc(db, 'parts', serviceData.partId);
          const partSnap = await getDoc(partRef);
          
          if (partSnap.exists()) {
            const partData = { id: partSnap.id, ...partSnap.data() } as Part;
            setSelectedPart(partData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading service:', error);
      showError('Erro ao carregar dados do serviço');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || '',
        salePrice: Number(formData.salePrice),
        partId: formData.partId || null,
        status: formData.status,
        updatedAt: serverTimestamp()
      };

      if (id) {
        await updateDoc(doc(db, 'services', id), serviceData);
      } else {
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          createdAt: serverTimestamp()
        });
      }

      navigate('/services/list');
    } catch (error) {
      console.error('Error saving service:', error);
      showError('Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };

  const handlePartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const partId = e.target.value;
    const part = parts.find(p => p.id === partId);
    setSelectedPart(part || null);
    setFormData(prev => ({ ...prev, partId }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
    part.brand.toLowerCase().includes(partSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/services/list')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {id ? 'Editar Serviço' : 'Novo Serviço'}
              </h1>
            </div>
          </div>

          {errorModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                    <h3 className="text-lg font-medium">Erro</h3>
                  </div>
                  <button
                    onClick={() => setErrorModal({ show: false, message: '' })}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600">{errorModal.message}</p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setErrorModal({ show: false, message: '' })}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-6">
            {/* Nome do Serviço */}
            <div className="grid form-grid-2 grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Serviço *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Valor de Venda */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor de Venda *</label>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Peça Utilizada */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Peça Utilizada</label>
              <div className="relative mt-1">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div
                      onClick={() => setShowPartDropdown(true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between"
                    >
                      <span className={selectedPart ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedPart ? `${selectedPart.name} - ${formatCurrency(parseFloat(selectedPart.price))}` : 'Selecione uma peça'}
                      </span>
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    {showPartDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                        <div className="p-2">
                          <input
                            type="text"
                            value={partSearchTerm}
                            onChange={(e) => setPartSearchTerm(e.target.value)}
                            placeholder="Buscar peça..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredParts.map(part => (
                            <div
                              key={part.id}
                              onClick={() => {
                                setSelectedPart(part);
                                setFormData(prev => ({ ...prev, partId: part.id }));
                                setShowPartDropdown(false);
                                setPartSearchTerm('');
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-medium">{part.name}</div>
                              <div className="text-sm text-gray-500">
                                {part.brand} - {formatCurrency(parseFloat(part.price))}
                              </div>
                            </div>
                          ))}
                          {filteredParts.length === 0 && (
                            <div className="px-4 py-2 text-gray-500 text-center">
                              Nenhuma peça encontrada
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPartModal(true)}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Click outside handler */}
              {showPartDropdown && (
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setShowPartDropdown(false)}
                />
              )}
            </div>

            {/* Lucratividade */}
            {(selectedPart || formData.salePrice > 0) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Resumo da Lucratividade</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valor de Venda:</span>
                    <span className="font-medium">{formatCurrency(formData.salePrice)}</span>
                  </div>
                  {selectedPart && (
                    <div className="flex justify-between">
                      <span>Custo da Peça:</span>
                      <span className="font-medium">{formatCurrency(selectedPart.price)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Lucro:</span>
                    <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profit)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6 form-buttons">
              <button
                type="button"
                onClick={() => navigate('/services/list')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Modal de Nova Peça */}
          {showPartModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Nova Peça</h2>
                  <button
                    onClick={() => setShowPartModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <PartFormPage
                    isModal
                    onSuccess={async () => {
                      await loadParts();
                      setShowPartModal(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}