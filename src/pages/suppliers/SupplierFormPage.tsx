import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, Save, AlertTriangle, X } from 'lucide-react';
import { db } from '../../config/firebase';
import { Supplier } from '../../types/supplier';
import { validateCPF, formatPhone, formatCPF, validateCNPJ, formatCNPJ } from '../../utils/validators';

type SupplierFormData = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;

const defaultFormData: SupplierFormData = {
  type: 'company',
  status: 'active',
  name: '',
  email: '',
  phones: {
    commercial: '',
    mobile: '',
    whatsapp: ''
  },
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  }
};

export function SupplierFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [formData, setFormData] = useState<SupplierFormData>(defaultFormData);

  const showError = (message: string) => {
    setErrorModal({ show: true, message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação dos campos obrigatórios
      const missingFields: string[] = [];
      
      // Campos comuns obrigatórios
      if (!formData.name) missingFields.push('Nome');
      if (!formData.phones.whatsapp) missingFields.push('WhatsApp');

      // Validação dos documentos apenas se estiverem preenchidos
      switch (formData.type) {
        case 'individual':
          if (formData.cpf && !validateCPF(formData.cpf)) {
            setErrorModal({ show: true, message: 'CPF inválido. Por favor, verifique.' });
            setLoading(false);
            return;
          }
          break;
        case 'company':
          if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
            setErrorModal({ show: true, message: 'CNPJ inválido. Por favor, verifique.' });
            setLoading(false);
            return;
          }
          break;
        case 'foreign':
          // Não há validação específica para documento estrangeiro
          break;
      }

      if (missingFields.length > 0) {
        setErrorModal({ show: true, message: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}` });
        setLoading(false);
        return;
      }

      // Prepare base data
      const baseData = {
        type: formData.type,
        status: formData.status,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phones: {
          commercial: formData.phones.commercial?.trim() || '',
          mobile: formData.phones.mobile?.trim() || '',
          whatsapp: formData.phones.whatsapp?.trim() || ''
        },
        address: {
          street: formData.address.street?.trim() || '',
          number: formData.address.number?.trim() || '',
          complement: formData.address.complement?.trim() || '',
          neighborhood: formData.address.neighborhood?.trim() || '',
          city: formData.address.city?.trim() || '',
          state: formData.address.state?.trim() || '',
          zipCode: formData.address.zipCode?.trim() || ''
        }
      };

      // Add type-specific fields
      let supplierData = { ...baseData };
      
      if (formData.type === 'individual') {
        supplierData = {
          ...supplierData,
          cpf: formData.cpf?.trim() || '',
          rg: formData.rg?.trim() || ''
        };
      } else if (formData.type === 'company') {
        supplierData = {
          ...supplierData,
          cnpj: formData.cnpj?.trim() || '',
          tradeName: formData.tradeName?.trim() || '',
          companyName: formData.companyName?.trim() || '',
          municipalRegistration: formData.municipalRegistration?.trim() || '',
          stateRegistrationNumber: formData.stateRegistrationNumber?.trim() || ''
        };
      } else if (formData.type === 'foreign') {
        supplierData = {
          ...supplierData,
          document: formData.document?.trim() || ''
        };
      }

      // Add timestamp
      supplierData.updatedAt = serverTimestamp();

      if (id) {
        await updateDoc(doc(db, 'suppliers', id), supplierData);
      } else {
        const newData = {
          ...supplierData,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'suppliers'), newData);
      }

      navigate('/suppliers/list');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      setErrorModal({ show: true, message: 'Erro ao salvar fornecedor. Por favor, tente novamente.' });
    } finally {
      setLoading(false);
    }
    
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatPhone(value);
    
    const [parent, child] = name.split('.');
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof SupplierFormData],
        [child]: formattedValue
      }
    }));
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'cnpj') {
      formattedValue = formatCNPJ(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  useEffect(() => {
    if (id) {
      loadSupplier(id);
    }
  }, [id]);

  const loadSupplier = async (supplierId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'suppliers', supplierId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const supplierData = docSnap.data() as Supplier;
        setFormData({
          ...defaultFormData,
          ...supplierData
        });
      } else {
        showError('Fornecedor não encontrado');
        navigate('/suppliers');
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedor:', error);
      showError('Erro ao carregar dados do fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof SupplierFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Modal de Erro */}
          {errorModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Atenção</h2>
                  </div>
                  <button
                    onClick={() => setErrorModal({ show: false, message: '' })}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-6">{errorModal.message}</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setErrorModal({ show: false, message: '' })}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/suppliers')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-6">
            {/* Tipo de Fornecedor e Status */}
            <div className="grid form-grid-2 grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Fornecedor</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="company">Pessoa Jurídica</option>
                  <option value="individual">Pessoa Física</option>
                  <option value="foreign">Estrangeiro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="grid form-grid-2 grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Campos específicos por tipo */}
            {formData.type === 'individual' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf || ''}
                    onChange={handleDocumentChange}
                    maxLength={14}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                  <input
                    type="text"
                    name="rg"
                    value={formData.rg || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            {formData.type === 'company' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                    <input
                      type="text"
                      name="cnpj"
                      value={formData.cnpj || ''}
                      onChange={handleDocumentChange}
                      maxLength={18}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                    <input
                      type="text"
                      name="tradeName"
                      value={formData.tradeName || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                    <input
                      type="text"
                      name="stateRegistrationNumber"
                      value={formData.stateRegistrationNumber || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'foreign' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                <input
                  type="text"
                  name="document"
                  value={formData.document || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            )}

            {/* Contatos */}
            <div className="grid form-grid-2 grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Comercial</label>
                <input
                  type="tel"
                  name="phones.commercial"
                  value={formData.phones.commercial}
                  onChange={handlePhoneChange}
                  placeholder="00 0000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Celular</label>
                <input
                  type="tel"
                  name="phones.mobile"
                  value={formData.phones.mobile}
                  onChange={handlePhoneChange}
                  placeholder="00 00000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
                <input
                  type="tel"
                  name="phones.whatsapp"
                  value={formData.phones.whatsapp}
                  onChange={handlePhoneChange}
                  required
                  placeholder="00 00000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input
                    type="text"
                    name="address.number"
                    value={formData.address.number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    name="address.complement"
                    value={formData.address.complement}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    name="address.neighborhood"
                    value={formData.address.neighborhood}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6 form-buttons">
              <button
                type="button"
                onClick={() => navigate('/suppliers/list')}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center font-medium transition-colors shadow-lg shadow-indigo-100"
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
        </div>
      </div>
    </div>
  );
}