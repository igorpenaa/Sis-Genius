import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useServiceOrder } from '../../contexts/ServiceOrderContext';
import { formatCurrency } from '../../utils/format';
import { 
  User, 
  Smartphone, 
  Settings, 
  Box, 
  Calendar, 
  CheckSquare,
  FileText,
  DollarSign,
  AlertCircle,
  Save,
  ArrowLeft
} from 'lucide-react';

export const ServiceOrderFormSummary = () => {
  const navigate = useNavigate();
  const { formData, clearFormData, setFormData } = useServiceOrder();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateServicesTotal = () => {
    return formData.services.reduce(
      (total, service) => total + service.quantity * service.unitPrice,
      0
    );
  };

  const calculateProductsTotal = () => {
    return formData.products.reduce(
      (total, product) => total + product.quantity * product.unitPrice,
      0
    );
  };

  const calculateTotal = () => {
    return calculateServicesTotal() + calculateProductsTotal() - (formData.discount || 0);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (formData.id) {
        // Atualizar O.S. existente
        const orderRef = doc(db, 'serviceOrders', formData.id);
        const updateData = {
          customerId: formData.customerId,
          customerName: formData.customerName,
          technicianId: formData.technicianId || '',
          technicianName: formData.technicianName,
          status: formData.status,
          startDate: formData.startDate,
          deliveryDate: formData.deliveryDate || '',
          warrantyPeriod: formData.warrantyPeriod || 90, // Garantia padrão se não definida
          warrantyId: formData.warrantyId || '',
          equipments: formData.equipments,
          services: formData.services,
          products: formData.products,
          checklists: formData.checklists,
          technicalFeedback: formData.technicalFeedback,
          discount: formData.discount,
          discountedAmount: formData.discount,
          totalAmount: calculateTotal(),
          servicesTotal: calculateServicesTotal(),
          productsTotal: calculateProductsTotal(),
          updatedAt: serverTimestamp(),
          lastModified: serverTimestamp()
        };

        await updateDoc(orderRef, updateData);
      } else {
        // Criar nova O.S.
        await addDoc(collection(db, 'serviceOrders'), {
          customerId: formData.customerId,
          customerName: formData.customerName,
          technicianId: formData.technicianId || '',
          technicianName: formData.technicianName,
          status: formData.status,
          startDate: formData.startDate,
          deliveryDate: formData.deliveryDate || '',
          warrantyId: formData.warrantyId || '',
          warrantyPeriod: formData.warrantyPeriod || 90,
          equipments: formData.equipments,
          services: formData.services,
          products: formData.products,
          checklists: formData.checklists,
          technicalFeedback: formData.technicalFeedback,
          discount: formData.discount,
          discountedAmount: formData.discount,
          totalAmount: calculateTotal(),
          servicesTotal: calculateServicesTotal(),
          productsTotal: calculateProductsTotal(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastModified: serverTimestamp()
        });
      }
      // clearFormData(); // Remover chamada anterior
      navigate('/service-orders');
    } catch (err) {
      console.error('Error saving service order:', err);
      setError('Erro ao salvar a ordem de serviço. Por favor, tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Cabeçalho com botões */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar O.S.
            </>
          )}
        </button>
      </div>

      {/* Grid de informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cliente e Informações Gerais */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium">Informações do Cliente</h3>
          </div>
          <div className="space-y-3">
            <p><span className="text-gray-500">Nome:</span> {formData.customerName}</p>
            <p><span className="text-gray-500">Técnico:</span> {formData.technicianName}</p>
            <p><span className="text-gray-500">Status:</span> {formData.status}</p>
          </div>
        </div>

        {/* Datas e Garantia */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium">Datas e Garantia</h3>
          </div>
          <div className="space-y-3">
            <p>
              <span className="text-gray-500">Data Inicial:</span>{' '}
              {formData.startDate.toLocaleDateString()}
            </p>
            <p>
              <span className="text-gray-500">Garantia:</span>{' '}
              {formData.warrantyPeriod} dias
            </p>
          </div>
        </div>

        {/* Equipamentos */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <Smartphone className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium">Equipamentos</h3>
          </div>
          <div className="space-y-6">
            {formData.equipments.map((equipment, index) => (
              <div key={equipment.id} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Equipamento {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><span className="text-gray-500">Categoria:</span> {equipment.category}</p>
                  <p><span className="text-gray-500">Marca:</span> {equipment.brand}</p>
                  <p><span className="text-gray-500">Modelo:</span> {equipment.model}</p>
                  <p><span className="text-gray-500">Cor:</span> {equipment.color}</p>
                  <p><span className="text-gray-500">IMEI:</span> {equipment.imei}</p>
                  <p><span className="text-gray-500">Nº de Série:</span> {equipment.serialNumber}</p>
                </div>
                <div className="mt-3">
                  <p className="text-gray-500">Problema Relatado:</p>
                  <p className="mt-1">{equipment.reportedIssue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist - Horizontal */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <CheckSquare className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium">Checklist</h3>
          </div>
          <div className="space-y-4">
            {formData.checklists.map((checklist, checklistIndex) => {
              // Encontrar o equipamento correspondente usando o equipmentIndex
              const equipment = formData.equipments[checklist.equipmentIndex];
              const equipmentName = equipment 
                ? `${equipment.brand} ${equipment.model}`
                : `Equipamento ${checklistIndex + 1}`;

              return (
                <div key={checklist.id}>
                  <h4 className="font-medium mb-3">Checklist - {equipmentName}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {checklist.items.map((item) => (
                      <div key={item.id} className="flex items-center">
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            checked={item.checked}
                            readOnly
                            className="hidden"
                          />
                          <div className={`block w-10 h-6 rounded-full transition-colors ${
                            item.checked ? 'bg-green-400' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${
                              item.checked ? 'translate-x-4' : ''
                            }`}></div>
                          </div>
                        </div>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Parecer Técnico - Horizontal */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium">Parecer Técnico</h3>
          </div>
          <p className="text-gray-700">{formData.technicalFeedback}</p>
        </div>

        {/* Serviços e Produtos - Horizontal */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Serviços */}
            <div>
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium">Serviços</h3>
              </div>
              <div className="space-y-3">
                {formData.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {service.serviceName || 'Serviço não identificado'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {service.quantity}x {formatCurrency(service.unitPrice)}
                      </p>
                    </div>
                    <span className="ml-4 font-medium">
                      {formatCurrency(service.quantity * service.unitPrice)}
                    </span>
                  </div>
                ))}
                {formData.services.length === 0 && (
                  <p className="text-gray-500 italic">Nenhum serviço adicionado</p>
                )}
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total Serviços:</span>
                    <span>{formatCurrency(calculateServicesTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div>
              <div className="flex items-center mb-4">
                <Box className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium">Produtos</h3>
              </div>
              <div className="space-y-3">
                {formData.products.map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {product.productName || 'Produto não identificado'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.quantity}x {formatCurrency(product.unitPrice)}
                      </p>
                    </div>
                    <span className="ml-4 font-medium">
                      {formatCurrency(product.quantity * product.unitPrice)}
                    </span>
                  </div>
                ))}
                {formData.products.length === 0 && (
                  <p className="text-gray-500 italic">Nenhum produto adicionado</p>
                )}
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total Produtos:</span>
                    <span>{formatCurrency(calculateProductsTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro - Horizontal */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium">Resumo Financeiro</h3>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Total Serviços:</span>
              <span className="font-medium">{formatCurrency(calculateServicesTotal())}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Total Produtos:</span>
              <span className="font-medium">{formatCurrency(calculateProductsTotal())}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Desconto:</span>
              <input
                type="number"
                value={formData.discount || 0}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount: parseFloat(e.target.value) || 0 
                }))}
                min="0"
                step="0.01"
                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center ml-auto">
              <span className="font-medium mr-2">Total Geral:</span>
              <span className="text-lg font-medium text-blue-600">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        </div>

        {/* Barra inferior com botão salvar */}
        <div className="bg-gray-50 p-4 rounded-lg md:col-span-2 mt-6">
          <div className="flex items-center">
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar O.S.
                </>
              )}
            </button>
            {error && (
              <p className="text-red-500 text-sm ml-4">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};