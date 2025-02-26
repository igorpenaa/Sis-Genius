import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package2, Package, DollarSign, Menu, X, MessageCircle } from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Product } from '../../../types/store';
import { formatCurrency } from '../../../utils/format';
import { ProductModal } from './ProductModal';
import { DeleteConfirmationModal } from '../../../components/DeleteConfirmationModal';

interface DeleteModalState {
  isOpen: boolean;
  productId: string | null;
  productName: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  supplierId?: string;
  [key: string]: any;
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    productId: null,
    productName: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const suppliersRef = collection(db, 'suppliers');
        const snapshot = await getDocs(suppliersRef);
        const suppliersData = {};
        snapshot.docs.forEach(doc => {
          suppliersData[doc.id] = doc.data();
        });
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
      }
    };
    loadSuppliers();
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[];

      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteModal({
      isOpen: true,
      productId: product.id,
      productName: product.name
    });
  };

  const handleWhatsAppMessage = (product: Product) => {
    if (!product.supplierId) {
      alert('Este produto não tem fornecedor cadastrado.');
      return;
    }

    const supplierData = suppliers[product.supplierId];
    if (!supplierData?.phones?.mobile) {
      alert('O fornecedor não tem telefone móvel cadastrado.');
      return;
    }

    const phone = supplierData.phones.mobile.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá, tudo bom? Tem disponível o ${product.name}, em caso positivo qual o valor?`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const confirmDelete = async () => {
    if (!deleteModal.productId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'products', deleteModal.productId));
      await loadProducts();
      setDeleteModal({ isOpen: false, productId: null, productName: '' });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    } finally {
      setDeleteLoading(false);
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lista de Produtos</h1>
              <p className="hidden md:block text-gray-600 mt-1">Visualize e gerencie todos os seus produtos</p>
            </div>
            
            {/* Desktop button */}
            <div className="hidden md:block">
              <button
                onClick={handleNewProduct}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Produto
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg p-4 space-y-2 md:hidden">
              <button
                onClick={handleNewProduct}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Produto
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-1 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="p-4 md:p-8">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-500">Carregando produtos...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(product.price)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.stockQuantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleWhatsAppMessage(product)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Enviar mensagem WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden">
          {/* Mobile Table Header */}
          <div className="bg-gray-50 px-3 py-3 rounded-t-lg border-b">
            <div className="grid grid-cols-[1fr,auto]">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                Ações
              </div>
            </div>
          </div>
          
          {/* Mobile Table Content */}
          <div className="bg-white divide-y divide-gray-200">
            {loading ? (
              <div className="p-3 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-500">Carregando produtos...</span>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                Nenhum produto encontrado
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="p-3">
                  <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <div className="text-xs text-gray-500 flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatCurrency(product.price)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Package className="w-3 h-3 mr-1" />
                            Estoque: {product.stockQuantity}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWhatsAppMessage(product);
                        }}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Enviar mensagem WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ProductModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={loadProducts}
        product={selectedProduct}
      />
      
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir o produto "${deleteModal.productName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, productId: null, productName: '' })}
        loading={deleteLoading}
      />
    </div>
  );
}