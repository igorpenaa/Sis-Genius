import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Product } from '../../types/store';
import { useServiceOrder } from '../../contexts/ServiceOrderContext';
import { formatCurrency } from '../../utils/format';

interface ServiceOrderFormProductProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function ServiceOrderFormProduct({
  onNext,
  onPrevious
}: ServiceOrderFormProductProps) {
  const { formData, setFormData } = useServiceOrder();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Produto sem nome',
          description: data.description || '',
          sku: data.sku || '',
          price: data.price || 0,
          costPrice: data.costPrice || 0,
          stockQuantity: data.stockQuantity || 0,
          category: data.category || '',
          brand: data.brand || '',
          isActive: data.isActive || false,
          images: data.images || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = () => {
    if (!selectedProduct) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setFormData(prev => ({
      ...prev,
      products: [
        ...(prev.products || []),
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price
        }
      ]
    }));

    setSelectedProduct('');
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProductQuantity = (index: number, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, quantity } : product
      )
    }));
  };

  const calculateTotal = () => {
    return formData.products.reduce((total, product) => {
      const productData = products.find(p => p.id === product.productId);
      if (!productData) return total;
      return total + (productData.price * product.quantity);
    }, 0);
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Product Selection */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Produtos</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-64 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Selecione um produto...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatCurrency(product.price)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addProduct}
              disabled={!selectedProduct}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar
            </button>
          </div>
        </div>

        {/* Product List */}
        {formData.products.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            Nenhum produto adicionado. Selecione um produto acima para adicionar.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr,100px,120px,120px,48px] gap-4 px-4 py-2 bg-gray-50 rounded-t-lg">
              <div className="text-sm font-medium text-gray-500">Produto</div>
              <div className="text-sm font-medium text-gray-500">Qtd.</div>
              <div className="text-sm font-medium text-gray-500">Valor Unit.</div>
              <div className="text-sm font-medium text-gray-500">Subtotal</div>
              <div></div>
            </div>
            
            {formData.products.map((product, index) => {
              const productData = products.find(p => p.id === product.productId);
              if (!productData) return null;
              
              const subtotal = product.quantity * productData.price;
              
              return (
                <div key={index} className="grid grid-cols-[1fr,100px,120px,120px,48px] gap-4 items-center px-4 py-3 bg-white rounded-lg shadow-sm">
                  <div>
                    <div className="font-medium">{productData.name}</div>
                    <div className="text-sm text-gray-500">{productData.description}</div>
                  </div>
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => updateProductQuantity(index, parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="text-right font-medium">
                    {formatCurrency(productData.price)}
                  </div>
                  <div className="text-right font-medium">
                    {formatCurrency(subtotal)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}

            <div className="flex justify-end pt-4 border-t">
              <div className="text-lg font-bold">
                Total: {formatCurrency(calculateTotal())}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
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