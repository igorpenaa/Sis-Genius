import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { doc, addDoc, collection, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Product } from '../../../types/store';
import { SearchSelect } from '../../../components/SearchSelect';
import { formatCurrency } from '../../../utils/format';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
}

interface Supplier {
  id: string;
  name: string;
  label: string;
}

const categoryOptions = [
  { id: 'aparelhos', label: 'Aparelhos' },
  { id: 'acessorios', label: 'Acessórios' },
  { id: 'eletronicos', label: 'Eletrônicos' },
  { id: 'equipamentos', label: 'Equipamentos' }
];

export function ProductModal({ isOpen, onClose, onSuccess, product }: ProductModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<{ id: string; label: string } | null>(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [costPrice, setCostPrice] = useState('');
  const [price, setPrice] = useState('');
  const [profit, setProfit] = useState(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 500);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setBarcode(product.barcode || '');
      setBrand(product.brand || '');
      setCategory(categoryOptions.find(opt => opt.id === product.category) || null);
      setStockQuantity(product.stockQuantity.toString());
      setCostPrice(product.costPrice.toString());
      setPrice(product.price.toString());
      setDescription(product.description || '');
      setIsActive(product.isActive);

      if (product.supplierId) {
        const supplierData = suppliers.find(s => s.id === product.supplierId);
        if (supplierData) {
          setSupplier(supplierData);
        }
      }
    } else {
      resetForm();
    }
  }, [product, suppliers]);

  useEffect(() => {
    const cost = Number(costPrice) || 0;
    const sale = Number(price) || 0;
    setProfit(sale - cost);
  }, [costPrice, price]);

  const loadSuppliers = async () => {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const snapshot = await getDocs(suppliersRef);
      const suppliersData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        label: doc.data().name
      }));
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setBarcode('');
    setBrand('');
    setCategory(null);
    setStockQuantity('');
    setSupplier(null);
    setCostPrice('');
    setPrice('');
    setDescription('');
    setIsActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !price || !costPrice || !stockQuantity) {
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name,
        barcode: barcode || null,
        brand: brand || null,
        category: category?.id || null,
        stockQuantity: Number(stockQuantity),
        costPrice: Number(costPrice),
        price: Number(price),
        description: description || null,
        isActive,
        updatedAt: serverTimestamp(),
      };

      // Só adiciona o supplierId se houver um fornecedor selecionado
      if (supplier?.id) {
        productData['supplierId'] = supplier.id;
      }

      if (product?.id) {
        await updateDoc(doc(db, 'products', product.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
          images: [], // Initialize empty images array for new products
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputBaseClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
  const labelBaseClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-xl shadow-xl w-full ${isMobile ? 'h-full max-h-full rounded-none' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
        <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3 shadow-md' : 'p-4 border-b'} sticky top-0 bg-white z-10`}>
          <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button
            onClick={onClose}
            className={`${isMobile ? 'w-10 h-10' : 'p-2'} hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`${isMobile ? 'px-4 pb-4 divide-y divide-gray-100' : 'p-6'} space-y-4`}>
          <div className={`${isMobile ? 'grid-cols-1 gap-4 py-4' : 'grid-cols-2 gap-4'} grid`}>
            <div>
              <label htmlFor="name" className={labelBaseClass}>
                Nome *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputBaseClass}
                required
              />
            </div>

            <div>
              <label htmlFor="barcode" className={labelBaseClass}>
                Código de Barras
              </label>
              <input
                type="text"
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className={inputBaseClass}
              />
            </div>

            <div>
              <label htmlFor="brand" className={labelBaseClass}>
                Marca
              </label>
              <input
                type="text"
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={inputBaseClass}
              />
            </div>

            <div>
              <label htmlFor="category" className={labelBaseClass}>
                Categoria
              </label>
              <SearchSelect
                id="category"
                value={category}
                onChange={(e) => setCategory(e)}
                options={categoryOptions}
                className={inputBaseClass}
              />
            </div>

            <div>
              <label htmlFor="stockQuantity" className={labelBaseClass}>
                Quantidade em Estoque *
              </label>
              <input
                type="number"
                id="stockQuantity"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className={inputBaseClass}
                min="0"
                required
              />
            </div>

            <div>
              <label htmlFor="supplier" className={labelBaseClass}>
                Fornecedor
              </label>
              <SearchSelect
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e)}
                options={suppliers}
                className={inputBaseClass}
              />
            </div>

            <div>
              <label htmlFor="costPrice" className={labelBaseClass}>
                Preço de Custo *
              </label>
              <input
                type="number"
                id="costPrice"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className={inputBaseClass}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="price" className={labelBaseClass}>
                Preço de Venda *
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputBaseClass}
                min="0"
                step="0.01"
                required
              />
            </div>

            {(price || costPrice) && (
              <div className={`${isMobile ? 'col-span-1 -mx-4 px-4 py-3 bg-gray-50' : 'col-span-2 bg-gray-50 p-4 rounded-lg'}`}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Resumo</h3>
                <div className={`${isMobile ? 'grid grid-cols-3 gap-2' : 'flex justify-between items-center'}`}>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Venda</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(Number(price))}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Custo</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(Number(costPrice))}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Lucro</span>
                    <span className={`text-sm font-medium ${profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(profit)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="py-4">
            <label htmlFor="description" className={labelBaseClass}>
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputBaseClass} ${isMobile ? 'text-base' : ''}`}
            />
          </div>

          <div className="flex items-center py-4">
            <label htmlFor="isActive" className="flex items-center space-x-3 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
              />
              <span className={isMobile ? 'text-base' : ''}>Produto Ativo</span>
            </label>
          </div>

          <div className={`${isMobile ? 'fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg' : 'flex justify-end space-x-3 mt-6'}`}>
            <div className={`flex ${isMobile ? 'space-x-3 w-full' : ''}`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${isMobile ? 'flex-1 text-base' : ''}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${isMobile ? 'flex-1 text-base' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </div>
          {isMobile && <div className="h-24" />} {/* Increased space for the fixed buttons */}
        </form>
      </div>
    </div>
  );
}
