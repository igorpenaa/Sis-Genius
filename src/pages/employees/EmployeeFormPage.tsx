import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Save, AlertTriangle, X } from 'lucide-react';
import { db } from '../../config/firebase';
import { Employee } from '../../types/employee';
import { validateCPF, formatCPF, validateCNPJ, formatCNPJ, formatPhone } from '../../utils/validators';

type EmployeeFormData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;

const defaultFormData: EmployeeFormData = {
  registrationType: 'simplified',
  type: 'individual',
  name: '',
  status: 'active',
  email: '',
  phones: {
    commercial: '',
    mobile: '',
    whatsapp: ''
  },
  cpf: '',
  rg: '',
  birthDate: null as unknown as Date,
  gender: 'male',
  cnpj: '',
  tradeName: '',
  companyName: '',
  municipalRegistration: '',
  stateRegistrationNumber: '',
  role: 'tecnico',
  salesCommissionPercentage: 0,
  servicesCommissionPercentage: 0,
  observations: '',
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

export function EmployeeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [formData, setFormData] = useState<EmployeeFormData>(defaultFormData);
  const [dateInputValue, setDateInputValue] = useState('');

  const showError = (message: string) => {
    setErrorModal({ show: true, message });
  };

  const formatDateInput = (value: string): string => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    
    // Formata no padrão dd/mm/yyyy
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const validateDate = (dateString: string): boolean => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;
    
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getDate() === day &&
           date.getMonth() === month - 1 &&
           date.getFullYear() === year &&
           date >= new Date(1900, 0, 1) &&
           date <= new Date();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setDateInputValue(formatted);
    
    if (formatted.length === 10 && validateDate(formatted)) {
      const [day, month, year] = formatted.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      date.setHours(12); // Set to noon to avoid timezone issues
      setFormData(prev => ({ ...prev, birthDate: date }));
    }
  };

  useEffect(() => {
    if (id) {
      const loadEmployee = async () => {
        try {
          const docRef = doc(db, 'employees', id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const employeeData = {
              ...data,
              birthDate: data.birthDate?.toDate() || null,
              phones: {
                commercial: data.phones?.commercial || '',
                mobile: data.phones?.mobile || '',
                whatsapp: data.phones?.whatsapp || ''
              },
              address: {
                street: data.address?.street || '',
                number: data.address?.number || '',
                complement: data.address?.complement || '',
                neighborhood: data.address?.neighborhood || '',
                city: data.address?.city || '',
                state: data.address?.state || '',
                zipCode: data.address?.zipCode || ''
              }
            } as EmployeeFormData;

            setFormData(employeeData);
            if (employeeData.birthDate) {
              setDateInputValue(new Intl.DateTimeFormat('pt-BR').format(employeeData.birthDate));
            }
          }
        } catch (error) {
          console.error('Error loading employee:', error);
          showError('Erro ao carregar dados do funcionário');
        }
      };

      loadEmployee();
    }
  }, [id]);

  useEffect(() => {
    if (formData.birthDate) {
      const date = new Date(formData.birthDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setDateInputValue(`${day}/${month}/${year}`);
    }
  }, [formData.birthDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields for all registration types
    if (!formData.name || !formData.email || !formData.phones.whatsapp || !formData.role) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validate type-specific required fields
    if (formData.registrationType === 'complete') {
      if (formData.type === 'individual') {
        if (!formData.cpf || !formData.rg || !formData.birthDate) {
          showError('Por favor, preencha todos os campos obrigatórios para pessoa física.');
          return;
        }
        if (!validateCPF(formData.cpf)) {
          showError('CPF inválido.');
          return;
        }
      } else if (formData.type === 'company') {
        if (!formData.cnpj || !formData.tradeName || !formData.companyName) {
          showError('Por favor, preencha todos os campos obrigatórios para pessoa jurídica.');
          return;
        }
        if (!validateCNPJ(formData.cnpj)) {
          showError('CNPJ inválido.');
          return;
        }
      }

      // Validate address fields if complete registration
      const requiredAddressFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode'];
      const missingFields = requiredAddressFields.filter(field => !formData.address[field as keyof typeof formData.address]);
      if (missingFields.length > 0) {
        showError('Por favor, preencha todos os campos de endereço obrigatórios.');
        return;
      }
    } else {
      // Simplified registration - validate only document
      if (formData.type === 'individual') {
        if (!formData.cpf) {
          showError('Por favor, preencha o CPF.');
          return;
        }
        if (!validateCPF(formData.cpf)) {
          showError('CPF inválido.');
          return;
        }
      } else if (formData.type === 'company') {
        if (!formData.cnpj) {
          showError('Por favor, preencha o CNPJ.');
          return;
        }
        if (!validateCNPJ(formData.cnpj)) {
          showError('CNPJ inválido.');
          return;
        }
      }
    }

    setLoading(true);
    try {
      const employeeData = {
        ...formData,
        phones: {
          ...formData.phones,
          mobile: formatPhone(formData.phones.mobile),
          whatsapp: formatPhone(formData.phones.whatsapp),
          commercial: formData.phones.commercial ? formatPhone(formData.phones.commercial) : ''
        }
      };

      if (formData.type === 'individual') {
        employeeData.cpf = formatCPF(formData.cpf || '');
      } else if (formData.type === 'company') {
        employeeData.cnpj = formatCNPJ(formData.cnpj || '');
      }

      if (id) {
        await updateDoc(doc(db, 'employees', id), {
          ...employeeData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'employees'), {
          ...employeeData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      navigate('/employees/list');
    } catch (error) {
      console.error('Error saving employee:', error);
      showError('Erro ao salvar funcionário. Por favor, tente novamente.');
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
          ...prev[parent as keyof typeof prev],
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/employees/list')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {id ? 'Editar Funcionário' : 'Novo Funcionário'}
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
            {/* Tipo de Cadastro e Tipo de Pessoa */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tipo de Cadastro *
                </label>
                <select
                  name="registrationType"
                  value={formData.registrationType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="simplified">Cadastro Simplificado</option>
                  <option value="complete">Cadastro Completo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tipo de Pessoa *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="individual">Pessoa Física</option>
                  <option value="company">Pessoa Jurídica</option>
                </select>
              </div>
            </div>

            {/* Status e Nome */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status *</label>
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Email e Documento (CPF/CNPJ) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {formData.type === 'individual' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CPF *</label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf || ''}
                    onChange={handleChange}
                    maxLength={14}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CNPJ *</label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj || ''}
                    onChange={handleChange}
                    maxLength={18}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Campos específicos baseados no tipo de cadastro */}
            {formData.registrationType === 'complete' && (
              <>
                {/* Campos para cadastro completo */}
                {formData.type === 'individual' && (
                  <>
                    {/* Campos específicos para pessoa física no cadastro completo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">RG</label>
                        <input
                          type="text"
                          name="rg"
                          value={formData.rg || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Data de Nascimento</label>
                        <input
                          type="date"
                          name="birthDate"
                          value={dateInputValue}
                          onChange={handleDateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone Comercial</label>
                        <input
                          type="text"
                          name="phones.commercial"
                          value={formData.phones.commercial}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Celular</label>
                        <input
                          type="text"
                          name="phones.mobile"
                          value={formData.phones.mobile}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.type === 'company' && (
                  <>
                    {/* Campos específicos para pessoa jurídica no cadastro completo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Fantasia</label>
                        <input
                          type="text"
                          name="tradeName"
                          value={formData.tradeName || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Razão Social</label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Inscrição Municipal</label>
                        <input
                          type="text"
                          name="municipalRegistration"
                          value={formData.municipalRegistration || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Inscrição Estadual</label>
                        <input
                          type="text"
                          name="stateRegistrationNumber"
                          value={formData.stateRegistrationNumber || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone Comercial</label>
                        <input
                          type="text"
                          name="phones.commercial"
                          value={formData.phones.commercial}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Celular</label>
                        <input
                          type="text"
                          name="phones.mobile"
                          value={formData.phones.mobile}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* WhatsApp e Função lado a lado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp *</label>
                <input
                  type="text"
                  name="phones.whatsapp"
                  value={formData.phones.whatsapp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all h-[42px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Função *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all h-[42px]"
                >
                  <option value="">Selecione uma função</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="tecnico">Técnico</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>

            {/* Comissões */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Comissão de Vendas (%)</label>
                <input
                  type="number"
                  name="salesCommissionPercentage"
                  value={formData.salesCommissionPercentage || ''}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Comissão de Serviços (%)</label>
                <input
                  type="number"
                  name="servicesCommissionPercentage"
                  value={formData.servicesCommissionPercentage || ''}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Observações</label>
              <textarea
                name="observations"
                value={formData.observations || ''}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/employees/list')}
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
        </div>
      </div>
    </div>
  );
}