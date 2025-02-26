import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Save, AlertTriangle, X } from 'lucide-react';
import { db } from '../../config/firebase';
import { Customer } from '../../types/customer';
import { validateCPF, formatPhone, formatCPF, validateCNPJ } from '../../utils/validators';

type CustomerFormData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases'>;

const initialFormData: CustomerFormData = {
  type: 'individual',
  status: 'active',
  name: '',
  email: '',
  cpf: '',
  rg: '',
  cnpj: '',
  companyName: '',
  tradeName: '',
  stateRegistrationNumber: '',
  document: '',
  birthDate: null,
  gender: 'prefiro-nao-dizer',
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

export function CustomerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);

  const showError = (message: string) => {
    setErrorModal({ show: true, message });
  };

  const validateRequiredFields = () => {
    const missingFields = [];
    
    // Campos comuns obrigatórios
    if (!formData.name) missingFields.push('Nome');
    if (!formData.phones.whatsapp) missingFields.push('WhatsApp');

    // Campos específicos por tipo
    switch (formData.type) {
      case 'individual':
        // Removida obrigatoriedade do CPF
        break;
      case 'company':
        if (!formData.cnpj) missingFields.push('CNPJ');
        break;
      case 'foreign':
        if (!formData.document) missingFields.push('Documento');
        break;
    }

    if (missingFields.length > 0) {
      showError(`Os seguintes campos são obrigatórios: ${missingFields.join(', ')}`);
      return false;
    }

    return true;
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

      if (!validateRequiredFields()) {
        setLoading(false);
        return;
      }

      const customerData = {
        ...formData,
        status: formData.status || 'active',
        birthDate: formData.birthDate || null,
        updatedAt: serverTimestamp(),
        ...(id ? {} : { createdAt: serverTimestamp() })
      };

      if (id) {
        await updateDoc(doc(db, 'customers', id), customerData);
      } else {
        await addDoc(collection(db, 'customers'), customerData);
      }

      navigate('/customers/list');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setErrorModal({ show: true, message: 'Erro ao salvar cliente. Por favor, tente novamente.' });
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
        ...prev[parent as keyof CustomerFormData],
        [child]: formattedValue
      }
    }));
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatCPF(value);
    setFormData(prev => ({ ...prev, cpf: formattedValue }));
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let formattedValue = value.replace(/\D/g, '');
    let displayValue = value;
    
    if (formattedValue.length > 0) {
      displayValue = formattedValue.replace(/(\d{2})(\d)/, '$1/$2');
      displayValue = displayValue.replace(/(\d{2})(\d)/, '$1/$2');
      displayValue = displayValue.substring(0, 10);
    }

    // Convert formatted date string to Date object if it's a complete date
    if (displayValue.length === 10) {
      const [day, month, year] = displayValue.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      date.setHours(12); // Set to noon to avoid timezone issues
      if (!isNaN(date.getTime())) {
        setFormData(prev => ({ ...prev, birthDate: date }));
      }
    }

    e.target.value = displayValue;
  };

  useEffect(() => {
    if (id) {
      loadCustomer(id);
    }
  }, [id]);

  const loadCustomer = async (customerId: string) => {
    try {
      const docRef = doc(db, 'customers', customerId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const customerData = docSnap.data();
        // Convert Firestore Timestamp to Date
        const birthDate = customerData.birthDate instanceof Timestamp ? customerData.birthDate.toDate() : null;
        
        setFormData({
          ...initialFormData,
          ...customerData,
          status: customerData.status || 'active',
          birthDate: birthDate || null,
          gender: customerData.gender || 'prefiro-nao-dizer',
          phones: {
            commercial: customerData.phones?.commercial || '',
            mobile: customerData.phones?.mobile || '',
            whatsapp: customerData.phones?.whatsapp || ''
          },
          address: {
            street: customerData.address?.street || '',
            number: customerData.address?.number || '',
            complement: customerData.address?.complement || '',
            neighborhood: customerData.address?.neighborhood || '',
            city: customerData.address?.city || '',
            state: customerData.address?.state || '',
            zipCode: customerData.address?.zipCode || ''
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      setErrorModal({ show: true, message: 'Erro ao carregar dados do cliente.' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'individual':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf || ''}
                  onChange={handleChange}
                  maxLength={14}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">RG</label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                <input
                  type="text"
                  name="birthDate"
                  defaultValue={formData.birthDate ? new Date(formData.birthDate).toLocaleDateString('pt-BR') : ''}
                  onInput={handleDateInputChange}
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gênero</label>
                <select
                  name="gender"
                  value={formData.gender || 'prefiro-nao-dizer'}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="homem">Homem</option>
                  <option value="mulher">Mulher</option>
                  <option value="nao-binario">Não-Binário</option>
                  <option value="genero-fluido">Gênero-Fluido</option>
                  <option value="agender">Agênero</option>
                  <option value="outro">Outro</option>
                  <option value="prefiro-nao-dizer">Prefiro não dizer</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'company':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj || ''}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                <input
                  type="text"
                  name="tradeName"
                  value={formData.tradeName || ''}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ''}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inscrição Municipal</label>
                <input
                  type="text"
                  name="municipalRegistration"
                  value={formData.municipalRegistration || ''}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Inscrição Estadual</label>
                <input
                  type="text"
                  name="stateRegistrationNumber"
                  value={formData.stateRegistrationNumber || ''}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inscrição SUFRAMA</label>
                <input
                  type="text"
                  name="suframa"
                  value={formData.suframa || ''}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>
          </>
        );

      case 'foreign':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Documento</label>
            <input
              type="text"
              name="document"
              value={formData.document || ''}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/customers/list')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {id ? 'Editar Cliente' : 'Novo Cliente'}
              </h1>
            </div>
          </div>

          {errorModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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
            {/* Tipo de Cliente e Status */}
            <div className="grid form-grid-2 grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="individual">Pessoa Física</option>
                  <option value="company">Pessoa Jurídica</option>
                  <option value="foreign">Estrangeiro</option>
                </select>
              </div>
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
            </div>

            {/* Informações Básicas */}
            <div className="grid form-grid-2 grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Campos específicos por tipo */}
            {renderTypeSpecificFields()}

            {/* Contatos */}
            <div className="grid form-grid-3 grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone Comercial</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone Celular</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp *</label>
                <input
                  type="tel"
                  name="phones.whatsapp"
                  value={formData.phones.whatsapp}
                  onChange={handlePhoneChange}
                  placeholder="00 00000-0000"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Instagram</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  @
                </span>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram || ''}
                  onChange={handleChange}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="username"
                />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
              <div className="grid form-grid-2 grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">CEP</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rua</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número</label>
                  <input
                    type="text"
                    name="address.number"
                    value={formData.address.number}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Complemento</label>
                  <input
                    type="text"
                    name="address.complement"
                    value={formData.address.complement}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bairro</label>
                  <input
                    type="text"
                    name="address.neighborhood"
                    value={formData.address.neighborhood}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6 form-buttons">
              <button
                type="button"
                onClick={() => navigate('/customers/list')}
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