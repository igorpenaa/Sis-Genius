import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, getDocs, query } from 'firebase/firestore';
import { ArrowLeft, Save, AlertTriangle, X, Search } from 'lucide-react';
import { db } from '../../../config/firebase';
import { Part, PartFormData } from '../../../types/part';
import { Supplier } from '../../../types/supplier';

interface PartFormPageProps {
  isModal?: boolean;
  onSuccess?: () => void;
}

const defaultFormData: PartFormData = {
  name: '',
  brand: '',
  quality: 'traditional',
  price: '0',
  description: '',
  status: 'active'
};

export function PartFormPage({ isModal, onSuccess }: PartFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [formData, setFormData] = useState<PartFormData>(defaultFormData);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const showError = (message: string) => {
    setErrorModal({ show: true, message });
  };

  useEffect(() => {
    loadSuppliers();
    if (id) {
      loadPart(id);
    }
  }, [id]);

  const loadSuppliers = async () => {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const q = query(suppliersRef);
      const snapshot = await getDocs(q);
      
      const suppliersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }) as Supplier[];
      
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showError('Erro ao carregar lista de fornecedores');
    }
  };

  const loadPart = async (partId: string) => {
    try {
      const docRef = doc(db, 'parts', partId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const partData = docSnap.data() as Part;
        setFormData({
          name: partData.name || '',
          brand: partData.brand || '',
          quality: partData.quality || 'traditional',
          price: partData.price?.toString() || '0',
          description: partData.description || '',
          status: partData.status || 'active'
        });
        
        if (partData.supplierId && partData.supplierName) {
          setSelectedSupplier({
            id: partData.supplierId,
            name: partData.supplierName
          } as Supplier);
        }
      }
    } catch (error) {
      console.error('Error loading part:', error);
      showError('Erro ao carregar dados da peça');
    }
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierDropdown(false);
    setSupplierSearchTerm('');
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    supplier.cpf?.includes(supplierSearchTerm) ||
    supplier.cnpj?.includes(supplierSearchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const partData = {
        ...formData,
        price: parseFloat(formData.price),
        supplierId: selectedSupplier?.id || null,
        supplierName: selectedSupplier?.name || null,
        updatedAt: serverTimestamp()
      };

      if (id) {
        const partRef = doc(db, 'parts', id);
        await updateDoc(partRef, partData);
      } else {
        await addDoc(collection(db, 'parts'), {
          ...partData,
          createdAt: serverTimestamp()
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/store/parts/list');
      }
    } catch (error) {
      console.error('Error saving part:', error);
      showError('Erro ao salvar peça');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={isModal ? '' : 'min-h-screen bg-gray-50'}>
      <div className={isModal ? '' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'}>
        <div className={isModal ? '' : 'px-4 py-6 sm:px-0'}>
          {!isModal && <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/store/parts/list')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {id ? 'Editar Peça' : 'Nova Peça'}
              </h1>
            </div>
          </div>}

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
            {/* Nome da Peça */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome da Peça *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Marca e Qualidade */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Marca *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Qualidade *</label>
                <select
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="exclusive">Exclusiva</option>
                  <option value="premium">Premium</option>
                  <option value="traditional">Tradicional</option>
                  <option value="inferior">Inferior</option>
                </select>
              </div>
            </div>

            {/* Fornecedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fornecedor
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowSupplierDropdown(true)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between bg-white h-[42px]"
                >
                  <span className={selectedSupplier ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedSupplier ? selectedSupplier.name : 'Selecione um fornecedor'}
                  </span>
                  <Search className="w-5 h-5 text-gray-400" />
                </div>

                {showSupplierDropdown && (
                  <>
                    <div
                      className="fixed inset-0"
                      onClick={() => setShowSupplierDropdown(false)}
                    />
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                      <div className="p-2">
                        <input
                          type="text"
                          value={supplierSearchTerm}
                          onChange={(e) => setSupplierSearchTerm(e.target.value)}
                          placeholder="Buscar fornecedor..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredSuppliers.map(supplier => (
                          <div
                            key={supplier.id}
                            onClick={() => handleSelectSupplier(supplier)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-gray-500">
                              {supplier.email} - {supplier.cpf || supplier.cnpj}
                            </div>
                          </div>
                        ))}
                        {filteredSuppliers.length === 0 && (
                          <div className="px-4 py-2 text-gray-500 text-center">
                            Nenhum fornecedor encontrado
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Valor da Peça */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor da Peça *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>Salvar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}