import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Checklist } from '../../types/checklist';
import { categories } from '../../utils/categories';
import { useServiceOrder } from '../../contexts/ServiceOrderContext';

interface ServiceOrderFormEquipmentProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function ServiceOrderFormEquipment({
  onNext,
  onPrevious
}: ServiceOrderFormEquipmentProps) {
  const { formData, setFormData } = useServiceOrder();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEquipmentIndex, setActiveEquipmentIndex] = useState(0);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Constante para o limite de equipamentos
  const MAX_EQUIPMENTS = 3;

  // Garantir que temos equipamentos válidos
  useEffect(() => {
    if (!Array.isArray(formData.equipments) || formData.equipments.length === 0) {
      setFormData(prev => ({
        ...prev,
        equipments: [{
          id: Date.now().toString(),
          category: '',
          subcategory: '',
          brand: '',
          model: '',
          color: '',
          imei: '',
          serialNumber: '',
          reportedIssue: '',
          hasPower: true
        }]
      }));
    } else {
      // Garantir que os equipamentos existentes tenham todos os campos
      const updatedEquipments = formData.equipments.map(equip => ({
        id: equip.id || Date.now().toString(),
        category: equip.category || '',
        subcategory: equip.subcategory || '',
        brand: equip.brand || '',
        model: equip.model || '',
        color: equip.color || '',
        imei: equip.imei || '',
        serialNumber: equip.serialNumber || '',
        reportedIssue: equip.reportedIssue || '',
        hasPower: typeof equip.hasPower === 'boolean' ? equip.hasPower : true
      }));

      // Só atualizar se houver diferença
      if (JSON.stringify(updatedEquipments) !== JSON.stringify(formData.equipments)) {
        console.log('Updating equipments with validated data:', updatedEquipments);
        setFormData(prev => ({
          ...prev,
          equipments: updatedEquipments
        }));
      }
    }
  }, []);

  // Carregar subcategorias baseado na categoria atual
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>(() => {
    const equipment = formData.equipments?.[activeEquipmentIndex];
    if (!equipment) return [];
    const category = categories.find(c => c.category === equipment.category);
    return category?.subcategories || [];
  });

  useEffect(() => {
    loadChecklists();
  }, []);

  useEffect(() => {
    const equipment = formData.equipments?.[activeEquipmentIndex];
    if (equipment) {
      const category = categories.find(c => c.category === equipment.category);
      setAvailableSubcategories(category?.subcategories || []);
    }
  }, [formData.equipments, activeEquipmentIndex]);

  const loadChecklists = async () => {
    try {
      const checklistsRef = collection(db, 'checklists');
      const snapshot = await getDocs(checklistsRef);
      setChecklists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Checklist[]);
    } catch (error) {
      console.error('Error loading checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEquipment = (index: number, field: string, value: any) => {
    console.log('Updating equipment:', { index, field, value }); // Debug
    const updatedEquipments = [...(formData.equipments || [])];
    
    if (!updatedEquipments[index]) {
      updatedEquipments[index] = {
        id: Date.now().toString(),
        category: '',
        subcategory: '',
        brand: '',
        model: '',
        color: '',
        imei: '',
        serialNumber: '',
        reportedIssue: '',
        hasPower: true
      };
    }

    // Criar uma cópia do equipamento atual
    const currentEquipment = { ...updatedEquipments[index] };
    
    // Atualizar o campo específico
    currentEquipment[field] = value;
    
    // Se mudou a categoria, limpar a subcategoria
    if (field === 'category') {
      currentEquipment.subcategory = '';
      const category = categories.find(c => c.category === value);
      setAvailableSubcategories(category?.subcategories || []);
    }

    // Atualizar o equipamento no array
    updatedEquipments[index] = currentEquipment;

    console.log('Updated equipment data:', currentEquipment); // Debug

    setFormData(prev => ({
      ...prev,
      equipments: updatedEquipments
    }));
  };

  const addEquipment = () => {
    if (formData.equipments.length >= MAX_EQUIPMENTS) {
      setErrorModal({
        show: true,
        message: 'Limite máximo de 3 equipamentos por O.S. atingido.'
      });
      return;
    }

    const newEquipment = {
      id: Date.now().toString(),
      category: '',
      subcategory: '',
      brand: '',
      model: '',
      color: '',
      imei: '',
      serialNumber: '',
      reportedIssue: '',
      hasPower: true
    };

    setFormData(prev => ({
      ...prev,
      equipments: [...prev.equipments, newEquipment]
    }));

    // Selecionar o novo equipamento
    setActiveEquipmentIndex(formData.equipments.length);
  };

  const removeEquipment = (index: number) => {
    if (!Array.isArray(formData.equipments) || formData.equipments.length <= 1) {
      alert('É necessário ter pelo menos um equipamento');
      return;
    }

    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.filter((_, i) => i !== index)
    }));

    if (activeEquipmentIndex >= index) {
      setActiveEquipmentIndex(Math.max(0, activeEquipmentIndex - 1));
    }
  };

  const addChecklist = (checklist: Checklist) => {
    const uniqueId = `${checklist.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Set initial equipment index to active equipment
    // Allow adding the same checklist multiple times
    setFormData(prev => ({
      ...prev,
      checklists: [
        ...prev.checklists,
        {
          checklistId: checklist.id,
          id: uniqueId,
          equipmentIndex: activeEquipmentIndex,
          items: checklist.items.map(item => ({
            id: `${uniqueId}-${item.id}`,
            text: item.text,
            checked: false
          }))
        }
      ]
    }));
  };

  const removeChecklist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklists: prev.checklists.filter((_, i) => i !== index)
    }));
  };

  const handleChecklistItemToggle = (checklistIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      checklists: prev.checklists.map((checklist, cIndex) => {
        if (cIndex !== checklistIndex) return checklist;
        return {
          ...checklist,
          items: checklist.items.map((item, iIndex) => {
            if (iIndex !== itemIndex) return item;
            return { ...item, checked: !item.checked };
          })
        };
      })
    }));
  };

  const handleNext = () => {
    // Validate required fields
    const invalidEquipment = formData.equipments.find(equipment => 
      !equipment.category ||
      !equipment.subcategory ||
      !equipment.brand ||
      !equipment.model ||
      !equipment.reportedIssue
    );

    if (invalidEquipment) {
      alert('Por favor, preencha todos os campos obrigatórios de todos os equipamentos');
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      {errorModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Atenção</h3>
            <p className="text-gray-500 mb-4">{errorModal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorModal({ show: false, message: '' })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Equipment Information */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Equipamentos</h2>
          <button
            type="button"
            onClick={addEquipment}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Equipamento
          </button>
        </div>

        {/* Equipment Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {formData.equipments.map((equipment, index) => (
            <div
              key={equipment.id}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                activeEquipmentIndex === index
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } cursor-pointer`}
              onClick={() => setActiveEquipmentIndex(index)}
            >
              <span>Equipamento {index + 1}</span>
              {formData.equipments.length > 1 && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEquipment(index);
                  }}
                  className="ml-2 p-1 hover:bg-red-500 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Active Equipment Form */}
        {formData.equipments[activeEquipmentIndex] && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Equipamento</h2>
          
          {/* Grid que muda baseado no tamanho da tela */}
          <div className={isMobile ? 'space-y-4' : ''}>
            {/* Categoria e Subcategoria */}
            <div className={`${isMobile ? '' : 'grid grid-cols-2 gap-6 mb-6'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Categoria *
                </label>
                <select
                  value={formData.equipments[activeEquipmentIndex].category}
                  onChange={(e) => updateEquipment(activeEquipmentIndex, 'category', e.target.value)}
                  required
                  className="h-12 mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subcategoria *
                </label>
                <select
                  value={formData.equipments[activeEquipmentIndex].subcategory}
                  onChange={(e) => updateEquipment(activeEquipmentIndex, 'subcategory', e.target.value)}
                  required
                  disabled={!formData.equipments[activeEquipmentIndex].category}
                  className="h-12 mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione uma subcategoria</option>
                  {availableSubcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Marca e Modelo */}
            <div className={`${isMobile ? '' : 'grid grid-cols-2 gap-6 mb-6'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Marca *
                </label>
                <input
                  type="text"
                  value={formData.equipments[activeEquipmentIndex].brand}
                  onChange={(e) => updateEquipment(activeEquipmentIndex, 'brand', e.target.value)}
                  required
                  className="h-12 mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Modelo *
                </label>
                <input
                  type="text"
                  value={formData.equipments[activeEquipmentIndex].model}
                  onChange={(e) => updateEquipment(activeEquipmentIndex, 'model', e.target.value)}
                  required
                  className="h-12 mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Cor e IMEI */}
            <div className={`${isMobile ? '' : 'grid grid-cols-2 gap-6 mb-6'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cor
                </label>
                <input
                  type="text"
                  value={formData.equipments[activeEquipmentIndex].color}
                  onChange={(e) => updateEquipment(activeEquipmentIndex, 'color', e.target.value)}
                  className="h-12 mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  IMEI / Número de Série
                </label>
                <input
                  type="text"
                  value={formData.equipments[activeEquipmentIndex].imei}
                  onChange={(e) => updateEquipment(activeEquipmentIndex, 'imei', e.target.value)}
                  className="h-12 mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Problema Relatado */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Problema Relatado *
              </label>
              <textarea
                value={formData.equipments[activeEquipmentIndex].reportedIssue}
                onChange={(e) => updateEquipment(activeEquipmentIndex, 'reportedIssue', e.target.value)}
                required
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Aparelho Liga */}
            <div className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.equipments[activeEquipmentIndex].hasPower}
                  onChange={(e) => updateEquipment(activeEquipmentIndex, 'hasPower', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Aparelho liga
                </label>
              </div>

              {!formData.equipments[activeEquipmentIndex].hasPower && (
                <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    O cliente está ciente de que o aparelho foi recebido sem condições de realizar os testes de funcionalidades através do checklist. Dessa forma, o dispositivo está sendo registrado com todas as funções consideradas inoperantes devido à impossibilidade de teste.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Checklist Section */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Checklist</h2>
            <p className="text-sm text-gray-500 mt-1">Selecione os checklists aplicáveis ao equipamento</p>
          </div>
        </div>

        <div className={`${isMobile ? 'mt-4' : '-mt-3'}`}>
          <select
            value=""
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId) {
                const checklist = checklists.find(c => c.id === selectedId);
                if (checklist) {
                  addChecklist(checklist);
                }
                e.target.value = '';
              }
            }}
            className={`${isMobile ? 'h-12 w-full' : 'w-64'} rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
          >
            <option value="">Selecione um checklist...</option>
            {checklists.map(checklist => (
              <option key={checklist.id} value={checklist.id}>
                {checklist.name} - {checklist.category}
              </option>
            ))}
          </select>
        </div>

        {formData.checklists.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            Nenhum checklist adicionado. Selecione um checklist acima para adicionar.
          </div>
        ) : (
          <div className="space-y-6">
            {formData.checklists.map((checklistEntry, checklistIndex) => {
              const checklistData = checklists.find(c => c.id === checklistEntry.checklistId);
              if (!checklistData) return null;

              return (
                <div key={checklistEntry.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{checklistData.name}</h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {checklistData.category} - {checklistData.subcategory}
                        </span>
                        <select
                          value={checklistEntry.equipmentIndex}
                          onChange={(e) => {
                            const updatedChecklists = [...formData.checklists];
                            updatedChecklists[checklistIndex] = {
                              ...updatedChecklists[checklistIndex],
                              equipmentIndex: parseInt(e.target.value)
                            };
                            setFormData(prev => ({
                              ...prev,
                              checklists: updatedChecklists
                            }));
                          }}
                          className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white cursor-pointer"
                        >
                          {formData.equipments.map((_, index) => (
                            <option key={index} value={index}>
                              Equipamento {index + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeChecklist(checklistIndex)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {checklistEntry.items.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{item.text}</span>
                          <div className="relative inline-block w-10 h-5 ml-2">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => handleChecklistItemToggle(checklistIndex, itemIndex)}
                              className="toggle-checkbox"
                            />
                            <label
                              className="toggle-label"
                            ></label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Technical Feedback */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Parecer Técnico</h2>
        <textarea
          value={formData.technicalFeedback}
          onChange={(e) => setFormData(prev => ({ ...prev, technicalFeedback: e.target.value }))}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          placeholder="Descreva o parecer técnico..."
        />
      </div>

      {/* Navigation Buttons */}
      <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-between mt-6'}`}>
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center"
        >
          Próximo
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}