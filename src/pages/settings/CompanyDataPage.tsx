import React, { useState, useEffect } from 'react';
import { Save, Upload, Trash2, AlertTriangle, X } from 'lucide-react';
import { collection, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { validateCPF, validateCNPJ, formatPhone, formatCPF, formatCNPJ } from '../../utils/validators';
import { useAuth } from '../../contexts/AuthContext';
import { brazilianStates } from '../../utils/brazilianStates';
import { CompanyData, CompanyFormData } from '../../types/company';
import SHA1 from 'crypto-js/sha1';
import { enc } from 'crypto-js';

// Cloudinary configuration
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/di1blafqh/image/upload';
const CLOUDINARY_API_KEY = '787376142159164';
const CLOUDINARY_API_SECRET = 'HLRj8RZ2LDQ9pK4cC7vB1Cv1VbU';

const generateSHA1 = (message: string) => {
  return SHA1(message).toString(enc.Hex);
};

const generateSignature = (publicId: string, timestamp: number) => {
  const params = {
    public_id: publicId,
    timestamp: timestamp,
  };
  
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return generateSHA1(paramString + CLOUDINARY_API_SECRET);
};

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

function ErrorModal({ message, onClose }: ErrorModalProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
            <h3 className="text-lg font-medium">Erro</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function CompanyDataPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<CompanyFormData>({
    type: 'company',
    name: '',
    whatsapp: '',
    zipCode: '',
    address: '',
    state: '',
    city: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    setLoading(true);
    try {
      const companyRef = doc(db, 'companies', currentUser?.uid || 'default');
      const docSnap = await getDoc(companyRef);      
      if (docSnap.exists()) {
        const data = {
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        } as CompanyData;
        setFormData(data);
        if (data.logo) {
          setImagePreview(data.logo);
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      setError('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'whatsapp' || name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhone(value)
      }));
    } else if (name === 'cpf') {
      setFormData(prev => ({
        ...prev,
        [name]: formatCPF(value)
      }));
    } else if (name === 'cnpj') {
      setFormData(prev => ({
        ...prev,
        [name]: formatCNPJ(value)
      }));
    } else if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value as 'individual' | 'company',
        cpf: undefined,
        cnpj: undefined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar o tamanho do arquivo (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2MB');
      return;
    }

    // Validar o tipo do arquivo
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Apenas arquivos .jpg e .png são permitidos');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleUpload = async () => {
    if (imageFile) {
      try {
        setLoading(true);
        const timestamp = Math.floor(Date.now() / 1000);
        const publicId = `company-logo-${timestamp}`;
        const signature = generateSignature(publicId, timestamp);

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('public_id', publicId);

        const response = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response from Cloudinary:', errorData);
          setError('Erro ao fazer upload da imagem: ' + (errorData.error?.message || 'Erro desconhecido'));
          return;
        }

        const data = await response.json();
        console.log('Imagem carregada com sucesso:', data);
        
        if (currentUser?.uid) {
          const companyRef = doc(db, 'companies', currentUser.uid);
          await updateDoc(companyRef, {
            logo: data.secure_url,
            updatedAt: serverTimestamp()
          });
          
          setImageUrl(data.secure_url);
          setSuccessMessage('Logo atualizado com sucesso!');
          await loadCompanyData();
        }
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        setError('Erro ao fazer upload da imagem. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Por favor, selecione uma imagem para upload.');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      setError('Nome da empresa é obrigatório');
      return false;
    }

    if (formData.type === 'individual') {
      if (!formData.cpf) {
        setError('CPF é obrigatório');
        return false;
      }
      if (!validateCPF(formData.cpf)) {
        setError('CPF inválido');
        return false;
      }
    }

    if (formData.type === 'company') {
      if (!formData.cnpj) {
        setError('CNPJ é obrigatório');
        return false;
      }
      if (!validateCNPJ(formData.cnpj)) {
        setError('CNPJ inválido');
        return false;
      }
    }

    if (!formData.whatsapp?.trim()) {
      setError('WhatsApp é obrigatório');
      return false;
    }

    if (!formData.zipCode?.trim()) {
      setError('CEP é obrigatório');
      return false;
    }

    if (!formData.address?.trim()) {
      setError('Endereço é obrigatório');
      return false;
    }

    if (!formData.state?.trim()) {
      setError('Estado é obrigatório');
      return false;
    }

    if (!formData.city?.trim()) {
      setError('Cidade é obrigatória');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let logoUrl = imagePreview;

      if (imageFile) {
        const timestamp = Math.floor(Date.now() / 1000);
        const publicId = `company-logo-${timestamp}`;
        const signature = generateSignature(publicId, timestamp);

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('public_id', publicId);

        const response = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Erro ao fazer upload da imagem');
        }

        const data = await response.json();
        logoUrl = data.secure_url;
      }

      const companyData: CompanyData = {
        ...formData,
        logo: logoUrl,
        updatedAt: serverTimestamp(),
        createdAt: formData.createdAt || serverTimestamp()
      };

      const companyRef = doc(db, 'companies', currentUser?.uid || 'default');
      await setDoc(companyRef, companyData);

      setSuccessMessage('Dados da empresa atualizados com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving company data:', error);
      setError('Erro ao salvar dados da empresa: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Carregando dados...</span>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dados da Empresa</h1>
            <p className="text-gray-600 mt-1">
              Mantenha os dados da sua empresa atualizados
            </p>
          </div>

          <ErrorModal message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-6">
            {/* Tipo de Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Empresa *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="company">Pessoa Jurídica</option>
                <option value="individual">Pessoa Física</option>
              </select>
            </div>

            {/* Dados Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                {formData.type === 'company' ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700">
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      name="cnpj"
                      value={formData.cnpj || ''}
                      onChange={handleChange}
                      required
                      maxLength={18}
                      placeholder="XX.XXX.XXX/XXXX-XX"
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700">
                      CPF *
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf || ''}
                      onChange={handleChange}
                      required
                      maxLength={14}
                      placeholder="XXX.XXX.XXX-XX"
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  WhatsApp *
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  required
                  placeholder="(XX) XXXXX-XXXX"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="(XX) XXXX-XXXX"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CEP *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    placeholder="XXXXX-XXX"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estado *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="Digite o estado"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Digite a cidade"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Logo da Empresa
              </label>
              <div className="mt-2 flex items-center space-x-6">
                <div className="flex-shrink-0 h-24 w-24 rounded-lg overflow-hidden bg-gray-100">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Logo Preview"
                      className="h-24 w-24 object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 flex items-center justify-center text-gray-400">
                      <Upload className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                    <span>Alterar logo</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleImageChange}
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-red-600 hover:text-red-500 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover
                    </button>
                  )}
                  <p className="text-xs text-gray-500">
                    JPG ou PNG até 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                {successMessage}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center font-medium transition-colors shadow-lg shadow-green-100"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Atualizar
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