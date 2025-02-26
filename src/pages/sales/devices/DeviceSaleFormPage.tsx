import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, X, Plus, Trash2 } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where,
  getDocs, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { formatCurrency } from '../../../utils/format';
import { SearchSelect } from '../../../components/SearchSelect';

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface SaleProduct {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  condition: string;
  color?: string;
  ram?: string;
  rom?: string;
  serialNumber?: string;
  imei1?: string;
  imei2?: string;
}

interface DeviceSaleFormData {
  customerId: string;
  sellerId: string;
  status: 'open' | 'completed' | 'canceled' | 'in_progress';
  purchaseDate: string;
  products: SaleProduct[];
  paymentMethod: string;
  discountValue: number;
  discountPercentage: number;
  totalValue: number;
  finalValue: number;
  customerName: string;
  saleNumber: string;
}

const defaultFormData: DeviceSaleFormData = {
  customerId: '',
  sellerId: '',
  status: 'open',
  purchaseDate: new Date().toISOString().split('T')[0],
  products: [],
  paymentMethod: '',
  discountValue: 0,
  discountPercentage: 0,
  totalValue: 0,
  finalValue: 0,
  customerName: '',
  saleNumber: ''
};

const paymentMethods = [
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'credito', label: 'Cartão de Crédito' },
  { id: 'debito', label: 'Cartão de Débito' },
  { id: 'ted', label: 'TED/DOC' },
  { id: 'pix', label: 'PIX' },
  { id: 'boleto', label: 'Boleto Bancário' },
  { id: 'vale', label: 'Vale-Compras' },
  { id: 'beneficio', label: 'Cartões Benefício' },
  { id: 'cripto', label: 'Criptomoedas' }
];

const statusOptions = [
  { id: 'open', label: 'Aberto' },
  { id: 'completed', label: 'Concluído' },
  { id: 'canceled', label: 'Cancelado' },
  { id: 'in_progress', label: 'Em Andamento' }
];

export function DeviceSaleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DeviceSaleFormData>(defaultFormData);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    loadCustomers();
    loadProducts();
    loadSellers();
    if (id) {
      loadSale(id);
    }
  }, [id]);

  const loadCustomers = async () => {
    try {
      const customersRef = collection(db, 'customers');
      const snapshot = await getDocs(customersRef);
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      showError('Erro ao carregar clientes');
    }
  };

  const loadProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('category', 'in', ['Aparelhos', 'Equipamentos']));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setErrorModal({
        show: true,
        message: 'Erro ao carregar a lista de produtos. Por favor, tente novamente.'
      });
    }
  };

  const loadSellers = async () => {
    try {
      const sellersRef = collection(db, 'employees');
      const snapshot = await getDocs(sellersRef);
      const sellersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSellers(sellersData);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      showError('Erro ao carregar vendedores');
    }
  };

  const loadSale = async (saleId: string) => {
    try {
      const saleRef = doc(db, 'deviceSales', saleId);
      const saleSnap = await getDoc(saleRef);
      
      if (saleSnap.exists()) {
        const saleData = saleSnap.data();
        setFormData({
          ...saleData,
          purchaseDate: saleData.purchaseDate.split('T')[0]
        } as DeviceSaleFormData);
      }
    } catch (error) {
      console.error('Erro ao carregar venda:', error);
      showError('Erro ao carregar dados da venda');
    }
  };

  const showError = (message: string) => {
    setErrorModal({ show: true, message });
  };

  const calculateTotals = (products: SaleProduct[], discountValue: number, discountPercentage: number) => {
    const totalValue = products.reduce((sum, product) => sum + product.subtotal, 0);
    const percentageDiscount = totalValue * (discountPercentage / 100);
    const finalValue = totalValue - discountValue - percentageDiscount;
    return { totalValue, finalValue };
  };

  const handleProductAdd = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, {
        productId: '',
        name: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        subtotal: 0,
        condition: 'NOVO',
        color: '',
        ram: '',
        rom: '',
        serialNumber: '',
        imei1: '',
        imei2: ''
      }]
    }));
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          newProducts[index] = {
            ...newProducts[index],
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            subtotal: product.price * newProducts[index].quantity - newProducts[index].discount
          };
        }
      } else {
        if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
          const quantity = field === 'quantity' ? value : newProducts[index].quantity;
          const unitPrice = field === 'unitPrice' ? value : newProducts[index].unitPrice;
          const discount = field === 'discount' ? value : newProducts[index].discount;
          newProducts[index] = {
            ...newProducts[index],
            [field]: value,
            subtotal: quantity * unitPrice - discount
          };
        } else {
          newProducts[index] = {
            ...newProducts[index],
            [field]: value
          };
        }
      }
      return {
        ...prev,
        products: newProducts,
        totalValue: calculateTotals(newProducts, prev.discountValue, prev.discountPercentage).totalValue,
        finalValue: calculateTotals(newProducts, prev.discountValue, prev.discountPercentage).finalValue
      };
    });
  };

  const handleProductRemove = (index: number) => {
    setFormData(prev => {
      const newProducts = prev.products.filter((_, i) => i !== index);
      return {
        ...prev,
        products: newProducts,
        totalValue: calculateTotals(newProducts, prev.discountValue, prev.discountPercentage).totalValue,
        finalValue: calculateTotals(newProducts, prev.discountValue, prev.discountPercentage).finalValue
      };
    });
  };

  const handleDiscountChange = (field: 'discountValue' | 'discountPercentage', value: number) => {
    setFormData(prev => {
      return {
        ...prev,
        [field]: value,
        totalValue: calculateTotals(prev.products, field === 'discountValue' ? value : prev.discountValue, field === 'discountPercentage' ? value : prev.discountPercentage).totalValue,
        finalValue: calculateTotals(prev.products, field === 'discountValue' ? value : prev.discountValue, field === 'discountPercentage' ? value : prev.discountPercentage).finalValue
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      showError('Por favor, selecione um cliente');
      return;
    }

    if (!formData.sellerId) {
      showError('Por favor, selecione um vendedor');
      return;
    }

    if (formData.products.length === 0) {
      showError('Por favor, adicione pelo menos um produto');
      return;
    }

    for (let i = 0; i < formData.products.length; i++) {
      const product = formData.products[i];
      if (!product.productId) {
        showError(`Por favor, selecione o produto na linha ${i + 1}`);
        return;
      }
      if (product.quantity <= 0) {
        showError(`Por favor, informe uma quantidade válida na linha ${i + 1}`);
        return;
      }
      if (!product.condition) {
        showError(`Por favor, selecione a condição do produto na linha ${i + 1}`);
        return;
      }
    }

    setLoading(true);

    try {
      const customerDoc = await getDoc(doc(db, 'customers', formData.customerId));
      const customerName = customerDoc.exists() ? customerDoc.data().name : '';

      let saleNumber = '1';
      const counterRef = doc(db, 'counters', 'deviceSales');
      const counterDoc = await getDoc(counterRef);
      
      if (!id) { 
        if (counterDoc.exists()) {
          const currentNumber = counterDoc.data().currentNumber || 0;
          saleNumber = (currentNumber + 1).toString();
          await updateDoc(counterRef, { currentNumber: currentNumber + 1 });
        } else {
          await setDoc(counterRef, { currentNumber: 1 });
        }
      } else {
        const originalSale = await getDoc(doc(db, 'deviceSales', id));
        saleNumber = originalSale.data()?.saleNumber || '1';
      }

      const saleData = {
        ...formData,
        customerName,
        updatedAt: serverTimestamp(),
        saleNumber
      };

      if (id) {
        await updateDoc(doc(db, 'deviceSales', id), saleData);
      } else {
        await addDoc(collection(db, 'deviceSales'), {
          ...saleData,
          createdAt: serverTimestamp()
        });
      }

      navigate('/sales/devices/list');
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      showError('Erro ao salvar venda');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/sales/devices')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {id ? 'Editar Venda' : 'Nova Venda'}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <SearchSelect
                label="Cliente"
                value={formData.customerId ? {
                  id: formData.customerId,
                  label: formData.customerName || ''
                } : null}
                onChange={(option) => setFormData(prev => ({ ...prev, customerId: option?.id || '', customerName: option?.label || '' }))}
                options={customers.map(customer => ({
                  id: customer.id,
                  label: customer.name,
                  description: customer.phone
                }))}
                required
                placeholder="Selecione um cliente"
              />

              {/* Vendedor */}
              <SearchSelect
                label="Vendedor"
                value={sellers.find(s => s.id === formData.sellerId) ? {
                  id: formData.sellerId,
                  label: sellers.find(s => s.id === formData.sellerId)?.name || ''
                } : null}
                onChange={(option) => setFormData(prev => ({ ...prev, sellerId: option?.id || '' }))}
                options={sellers.map(seller => ({
                  id: seller.id,
                  label: seller.name,
                  description: seller.role
                }))}
                required
                placeholder="Selecione um vendedor"
              />

              {/* Status */}
              <SearchSelect
                label="Situação"
                value={statusOptions.find(s => s.id === formData.status) || null}
                onChange={(option) => setFormData(prev => ({ ...prev, status: (option?.id as any) || 'open' }))}
                options={statusOptions}
                required
                placeholder="Selecione a situação"
              />

              {/* Data da Compra */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Data da Compra *</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Produtos */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Produtos</h2>
                  <button
                    type="button"
                    onClick={handleProductAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar Produto
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-4 mb-2 text-sm font-medium text-gray-600">
                  <div className="col-span-4">Produto</div>
                  <div className="text-center col-span-2">Quantidade</div>
                  <div className="text-center col-span-2">Valor Un.</div>
                  <div className="text-center col-span-2">Desconto R$</div>
                  <div className="col-span-1">Subtotal</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-4">
                  {formData.products.map((product, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-12 gap-4 items-center mb-4">
                        <div className="col-span-4">
                          <SearchSelect
                            value={products.find(p => p.id === product.productId) ? {
                              id: product.productId,
                              label: product.name,
                              description: formatCurrency(products.find(p => p.id === product.productId)?.price || 0)
                            } : null}
                            onChange={(option) => handleProductChange(index, 'productId', option?.id || '')}
                            options={products.map(p => ({
                              id: p.id,
                              label: p.name || '',
                              description: formatCurrency(p.price || 0)
                            }))}
                            placeholder="Selecione um Aparelho"
                            required
                            className="-mt-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            containerClassName="!mt-0"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                            className="text-center block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.unitPrice}
                            onChange={(e) => handleProductChange(index, 'unitPrice', parseFloat(e.target.value))}
                            className="text-center block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.discount}
                            onChange={(e) => handleProductChange(index, 'discount', parseFloat(e.target.value))}
                            className="text-center block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="col-span-1 font-medium text-gray-900">
                          {formatCurrency(product.subtotal)}
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleProductRemove(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Detalhes do Produto */}
                      <div className="grid grid-cols-7 gap-4 mt-2 pt-4 border-t border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Condição
                          </label>
                          <select
                            value={product.condition}
                            onChange={(e) => handleProductChange(index, 'condition', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="NOVO">Novo</option>
                            <option value="SEMINOVO">Seminovo</option>
                            <option value="VITRINE">Vitrine</option>
                            <option value="USADO">Usado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-center font-medium text-gray-700 mb-1">
                            Cor
                          </label>
                          <input
                            type="text"
                            value={product.color || ''}
                            onChange={(e) => handleProductChange(index, 'color', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-center font-medium text-gray-700 mb-1">
                            RAM
                          </label>
                          <input
                            type="text"
                            value={product.ram || ''}
                            onChange={(e) => handleProductChange(index, 'ram', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Ex: 8GB"
                          />
                        </div>
                        <div>
                          <label className="block text-center font-medium text-gray-700 mb-1">
                            ROM
                          </label>
                          <input
                            type="text"
                            value={product.rom || ''}
                            onChange={(e) => handleProductChange(index, 'rom', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Ex: 128GB"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nº de Série
                          </label>
                          <input
                            type="text"
                            value={product.serialNumber || ''}
                            onChange={(e) => handleProductChange(index, 'serialNumber', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-center font-medium text-gray-700 mb-1">
                            IMEI 1
                          </label>
                          <input
                            type="text"
                            value={product.imei1 || ''}
                            onChange={(e) => handleProductChange(index, 'imei1', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-center font-medium text-gray-700 mb-1">
                            IMEI 2
                          </label>
                          <input
                            type="text"
                            value={product.imei2 || ''}
                            onChange={(e) => handleProductChange(index, 'imei2', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totais */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(formData.totalValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Desconto Total:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(formData.totalValue - formData.finalValue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium pt-2 border-t">
                        <span>Total:</span>
                        <span className="text-green-600">{formatCurrency(formData.finalValue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Pagamento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {paymentMethods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountValue}
                      onChange={(e) => handleDiscountChange('discountValue', parseFloat(e.target.value))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discountPercentage}
                      onChange={(e) => handleDiscountChange('discountPercentage', parseFloat(e.target.value))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(formData.totalValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Desconto Total:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(formData.totalValue - formData.finalValue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(formData.finalValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/sales/devices')}
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

          {/* Modal de Erro */}
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
        </div>
      </div>
    </div>
  );
}
