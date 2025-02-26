import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Editor } from '../../components/Editor';
import { AlertModal } from '../../components/AlertModal';

interface WarrantyFormData {
  name: string;
  durationDays: number;
  warrantyTerms: string;
}

export function WarrantyFormPage() {
  const [formData, setFormData] = useState<WarrantyFormData>({
    name: '',
    durationDays: 30,
    warrantyTerms: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      loadWarranty(id);
    }
  }, [id]);

  const loadWarranty = async (warrantyId: string) => {
    try {
      const warrantyDoc = await getDoc(doc(db, 'warranties', warrantyId));
      if (warrantyDoc.exists()) {
        const data = warrantyDoc.data();
        setFormData({
          name: data.name || '',
          durationDays: data.durationDays || 30,
          warrantyTerms: data.warrantyTerms || ''
        });
      }
    } catch (error) {
      console.error('Error loading warranty:', error);
    }
  };

  const getWarrantyDescription = (days: number) => {
    return `A Empresa compromete-se com a garantia de ${days} dias para a prestação de serviço de manutenção para o CLIENTE, conforme especificada na Ordem de Serviço (O.S.): IDENTIFICAÇÃO DA O.S., com a finalidade de restabelecer as funcionalidades do MARCA, MODELO, IMEI conforme serviços: SERVIÇOS.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        // Update existing warranty
        await updateDoc(doc(db, 'warranties', id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new warranty
        const newWarrantyRef = doc(collection(db, 'warranties'));
        await setDoc(newWarrantyRef, {
          ...formData,
          id: newWarrantyRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isDefault: false
        });
      }
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving warranty:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Editar Garantia' : 'Nova Garantia'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id ? 'Edite os detalhes da garantia' : 'Preencha os detalhes da nova garantia'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome da Garantia
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700">
                Duração (dias)
              </label>
              <input
                type="number"
                id="durationDays"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                min="0"
              />
              <div className="mt-2 p-4 bg-gray-50 rounded-md text-sm text-gray-600">
                {getWarrantyDescription(formData.durationDays)}
              </div>
            </div>

            <div>
              <label htmlFor="warrantyTerms" className="block text-sm font-medium text-gray-700 mb-1">
                Termos da Garantia
              </label>
              <Editor
                value={formData.warrantyTerms}
                onChange={(value) => setFormData({ ...formData, warrantyTerms: value })}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/service-orders/warranties')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AlertModal
        isOpen={showSuccessModal}
        title="Sucesso!"
        message="Garantia salva com sucesso."
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/service-orders/warranties');
        }}
      />
    </div>
  );
}
