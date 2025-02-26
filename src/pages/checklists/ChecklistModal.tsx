import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Checklist, ChecklistFormData } from '../../types/checklist';
import { categories } from '../../utils/categories';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  checklist?: Checklist | null;
}

export function ChecklistModal({
  isOpen,
  onClose,
  onSuccess,
  checklist
}: ChecklistModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ChecklistFormData>({
    name: '',
    category: '',
    subcategory: '',
    items: []
  });
  const [newItem, setNewItem] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  useEffect(() => {
    if (checklist) {
      setFormData({
        name: checklist.name,
        category: checklist.category,
        subcategory: checklist.subcategory,
        items: checklist.items.map(item => item.text)
      });
      updateSubcategories(checklist.category);
    } else {
      resetForm();
    }
  }, [checklist]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      items: []
    });
    setNewItem('');
    setError('');
  };

  const updateSubcategories = (category: string) => {
    const subcategories = categories.find(c => c.category === category)?.subcategories || [];
    setAvailableSubcategories(subcategories);
    if (!subcategories.includes(formData.subcategory)) {
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      updateSubcategories(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    
    if (formData.items.length >= 25) {
      setError('Maximum limit is 25 items per checklist');
      return;
    }

    const truncatedItem = newItem.trim().slice(0, 20);
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, truncatedItem]
    }));
    setNewItem('');
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const checklistData = {
        name: formData.name.trim(),
        category: formData.category,
        subcategory: formData.subcategory,
        items: formData.items.map((text, index) => ({
          id: `item-${index + 1}`,
          text
        })),
        updatedAt: serverTimestamp()
      };

      if (checklist) {
        const checklistRef = doc(db, 'checklists', checklist.id);
        await updateDoc(checklistRef, checklistData);
      } else {
        await addDoc(collection(db, 'checklists'), {
          ...checklistData,
          createdAt: serverTimestamp()
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving checklist:', error);
      setError('Error saving checklist');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {checklist ? 'Editar Checklist' : 'Novo Checklist'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={100}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Categoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione uma Categoria</option>
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
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                required
                disabled={!formData.category}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Selecione uma Subcategoria</option>
                {availableSubcategories.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items ({formData.items.length}/25)
            </label>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                maxLength={20}
                placeholder="Digite o texto do item (máximo 20 caracteres)"
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem();
                  }
                }}
              />
              <button
                type="button"
                onClick={addItem}
                disabled={formData.items.length >= 25}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-700">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}