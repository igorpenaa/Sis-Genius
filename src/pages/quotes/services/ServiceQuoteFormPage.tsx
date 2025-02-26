import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ArrowLeft, Save, AlertTriangle, X, Plus, Search } from 'lucide-react';
import { db } from '../../../config/firebase';
import { ServiceQuotation } from '../../../types/quotation';
import { Customer } from '../../../types/customer';
import { Service } from '../../../types/service';
import { Product } from '../../../types/store';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency } from '../../../utils/format';

// Default form data
const defaultFormData = {
  clientId: '',
  deliveryTime: '',
  validity: '',
  salesChannel: '',
  description: '',
  services: [],
  products: [],
  internalNotes: ''
};

// Error modal component
function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
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

// Customer selector component
function CustomerSelector({ 
  selectedCustomer,
  customers,
  onSelect
}: { 
  selectedCustomer: Customer | null;
  customers: Customer[];
  onSelect: (customer: Customer) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cpf?.includes(searchTerm) ||
    customer.cnpj?.includes(searchTerm)
  );

  return (
    <div className="relative">
      <div
        onClick={() => setShowDropdown(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between bg-white"
      >
        <span className={selectedCustomer ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCustomer ? selectedCustomer.name : 'Selecione um cliente'}
        </span>
        <Search className="w-5 h-5 text-gray-400" />
      </div>
      
      {showDropdown && (
        <>
          <div className="fixed inset-0" onClick={() => setShowDropdown(false)} />
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => {
                    onSelect(customer);
                    setShowDropdown(false);
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-500">
                    {customer.email} - {customer.cpf || customer.cnpj}
                  </div>
                </div>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="px-4 py-2 text-gray-500 text-center">
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Service search component
function ServiceSearch({ 
  services, 
  onSelect 
}: { 
  services: Service[]; 
  onSelect: (service: Service) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <div
            onClick={() => setShowDropdown(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between bg-white"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(true);
              }}
              placeholder="Buscar serviço..."
              className="w-full focus:outline-none"
            />
            <Search className="w-5 h-5 text-gray-400" />
          </div>

          {showDropdown && filteredServices.length > 0 && (
            <>
              <div className="fixed inset-0" onClick={() => setShowDropdown(false)} />
              <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="max-h-60 overflow-y-auto">
                  {filteredServices.map(service => (
                    <div
                      key={service.id}
                      onClick={() => {
                        onSelect(service);
                        setShowDropdown(false);
                        setSearchTerm('');
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(service.salePrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Service list item component
function ServiceListItem({
  service,
  onRemove,
  onDiscountChange,
  discount = 0
}: {
  service: Service;
  onRemove: () => void;
  onDiscountChange: (value: number) => void;
  discount: number;
}) {
  const total = service.salePrice - discount;

  return (
    <div className="grid grid-cols-[1fr,160px,160px,48px] gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="font-medium">{service.name}</div>
      </div>
      <div>
        <input
          type="number"
          value={discount}
          onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
          className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Desconto"
        />
      </div>
      <div className="text-right font-medium">
        {formatCurrency(total)}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function ServiceQuoteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [nextQuoteNumber, setNextQuoteNumber] = useState('000001');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadNextQuoteNumber(),
        loadCustomers(),
        loadServices(),
        loadProducts(),
        id ? loadQuote(id) : Promise.resolve()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Erro ao carregar dados iniciais');
    }
  };

  const loadNextQuoteNumber = async () => {
    const quotesRef = collection(db, 'serviceQuotes');
    const q = query(quotesRef, orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const lastQuote = snapshot.docs[0].data();
      if (lastQuote?.number) {
        const lastNumber = parseInt(lastQuote.number);
        if (!isNaN(lastNumber)) {
          setNextQuoteNumber(String(lastNumber + 1).padStart(6, '0'));
          return;
        }
      }
    }
    setNextQuoteNumber('000001');
  };

  const loadCustomers = async () => {
    const customersRef = collection(db, 'customers');
    const q = query(customersRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
  };

  const loadServices = async () => {
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
  };

  const loadProducts = async () => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
  };

  const loadQuote = async (quoteId: string) => {
    const docRef = doc(db, 'serviceQuotes', quoteId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const quoteData = docSnap.data() as ServiceQuotation;
      setFormData({
        clientId: quoteData.clientId,
        deliveryTime: quoteData.deliveryTime,
        validity: quoteData.validity,
        salesChannel: quoteData.salesChannel,
        description: quoteData.description,
        services: quoteData.services,
        products: quoteData.products,
        internalNotes: quoteData.internalNotes
      });

      const customer = customers.find(c => c.id === quoteData.clientId);
      if (customer) setSelectedCustomer(customer);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      setError('Selecione um cliente');
      return;
    }

    setLoading(true);
    try {
      const quoteData = {
        number: nextQuoteNumber,
        clientId: formData.clientId,
        userId: currentUser?.uid,
        date: new Date(),
        deliveryTime: formData.deliveryTime,
        validity: formData.validity,
        salesChannel: formData.salesChannel,
        description: formData.description,
        services: formData.services,
        internalNotes: formData.internalNotes,
        updatedAt: serverTimestamp()
      };

      if (id) {
        await updateDoc(doc(db, 'serviceQuotes', id), quoteData);
      } else {
        await addDoc(collection(db, 'serviceQuotes'), {
          ...quoteData,
          createdAt: serverTimestamp()
        });
      }

      navigate('/quotes/services/list');
    } catch (error) {
      console.error('Error saving quote:', error);
      setError('Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addService = (service: Service) => {
    setFormData(prev => ({
      ...prev,
      services: [
        ...prev.services,
        { 
          id: Date.now().toString(), 
          serviceId: service.id,
          quantity: 1,
          price: service.salePrice,
          discount: 0
        }
      ]
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const updateServiceDiscount = (index: number, discount: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((s, i) => 
        i === index ? { ...s, discount } : s
      )
    }));
  };

  const addProduct = (product: Product) => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: Date.now().toString(),
          productId: product.id,
          quantity: 1,
          price: product.price,
          discount: 0
        }
      ]
    }));
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProductDiscount = (index: number, discount: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((p, i) =>
        i === index ? { ...p, discount } : p
      )
    }));
  };

  const calculateServicesTotal = () => {
    return formData.services.reduce((total, service) => {
      const serviceData = services.find(s => s.id === service.serviceId);
      if (!serviceData) return total;
      return total + (serviceData.salePrice - service.discount);
    }, 0);
  };

  const calculateProductsTotal = () => {
    return formData.products.reduce((total, product) => {
      const productData = products.find(p => p.id === product.productId);
      if (!productData) return total;
      return total + (productData.price - product.discount);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateServicesTotal() + calculateProductsTotal();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/quotes/services/list')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {id ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h1>
            </div>
          </div>

          <ErrorModal message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Orçamento Nº</label>
                <input
                  type="text"
                  value={nextQuoteNumber}
                  disabled
                  className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('pt-BR')}
                  disabled
                  className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendedor</label>
                <input
                  type="text"
                  value={currentUser?.email || ''}
                  disabled
                  className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
            </div>

            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                customers={customers}
                onSelect={(customer) => {
                  setSelectedCustomer(customer);
                  setFormData(prev => ({ ...prev, clientId: customer.id }));
                }}
              />
            </div>

            {/* Quote Details */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prazo de Entrega</label>
                <input
                  type="text"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: 5 dias úteis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Validade</label>
                <input
                  type="text"
                  name="validity"
                  value={formData.validity}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: 15 dias"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Canal de Vendas</label>
                <input
                  type="text"
                  name="salesChannel"
                  value={formData.salesChannel}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Loja Física"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                placeholder="Descreva os detalhes do orçamento..."
              />
            </div>

            {/* Services */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Serviços</h3>
                </div>
              </div>

              <div className="space-y-4">
                <ServiceSearch 
                  services={services} 
                  onSelect={addService}
                />

                {formData.services.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Nenhum serviço adicionado. Use a busca acima para adicionar serviços.
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="grid grid-cols-[1fr,160px,160px,48px] gap-4 mb-2 px-4">
                      <div className="text-sm font-medium text-gray-500">Nome do Serviço</div>
                      <div className="text-sm font-medium text-gray-500">Desconto</div>
                      <div className="text-sm font-medium text-gray-500 text-right">Valor</div>
                      <div></div>
                    </div>
                    <div className="space-y-2">
                      {formData.services.map((service, index) => {
                        const serviceData = services.find(s => s.id === service.serviceId);
                        if (!serviceData) return null;
                        
                        return (
                          <ServiceListItem
                            key={service.id}
                            service={serviceData}
                            onRemove={() => removeService(index)}
                            onDiscountChange={(discount) => updateServiceDiscount(index, discount)}
                            discount={service.discount}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
                {formData.services.length > 0 && (
                  <div className="flex justify-end mt-4">
                    <p className="text-sm font-medium text-gray-900">
                      Subtotal de serviços: <span className="ml-2">{formatCurrency(calculateServicesTotal())}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Products */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Produtos</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <div
                        onClick={() => setShowProductDropdown(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between bg-white"
                      >
                        <input
                          type="text"
                          value={productSearchTerm}
                          onChange={(e) => {
                            setProductSearchTerm(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProductDropdown(true);
                          }}
                          placeholder="Buscar produto..."
                          className="w-full focus:outline-none"
                        />
                        <Search className="w-5 h-5 text-gray-400" />
                      </div>

                      {showProductDropdown && (
                        <>
                          <div className="fixed inset-0" onClick={() => setShowProductDropdown(false)} />
                          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                            <div className="max-h-60 overflow-y-auto">
                              {products
                                .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                                .map(p => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      addProduct(p);
                                      setShowProductDropdown(false);
                                      setProductSearchTerm('');
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  >
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {formatCurrency(p.price)}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {formData.products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Nenhum produto adicionado. Use a busca acima para adicionar produtos.
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="grid grid-cols-[1fr,160px,160px,48px] gap-4 mb-2 px-4">
                      <div className="text-sm font-medium text-gray-500">Nome do Produto</div>
                      <div className="text-sm font-medium text-gray-500">Desconto</div>
                      <div className="text-sm font-medium text-gray-500 text-right">Valor</div>
                      <div></div>
                    </div>
                    <div className="space-y-2">
                      {formData.products.map((product, index) => {
                        const productData = products.find(p => p.id === product.productId);
                        if (!productData) return null;
                        
                        return (
                          <div key={product.id} className="grid grid-cols-[1fr,160px,160px,48px] gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div>
                              <div className="font-medium">{productData.name}</div>
                            </div>
                            <div>
                              <input
                                type="number"
                                value={product.discount}
                                onChange={(e) => updateProductDiscount(index, parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Desconto"
                              />
                            </div>
                            <div className="text-right font-medium">
                              {formatCurrency(productData.price - product.discount)}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {formData.products.length > 0 && (
                  <div className="flex justify-end mt-4">
                    <p className="text-sm font-medium text-gray-900">
                      Subtotal de produtos: <span className="ml-2">{formatCurrency(calculateProductsTotal())}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
              <textarea
                name="internalNotes"
                value={formData.internalNotes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                placeholder="Adicione notas internas sobre o orçamento..."
              />
            </div>

            {/* Total */}
            <div className="border-t pt-6">
              <div className="flex justify-end">
                <div className="w-80 bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Subtotal de Serviços:</span>
                    <span>{formatCurrency(calculateServicesTotal())}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="font-medium">Subtotal de Produtos:</span>
                    <span>{formatCurrency(calculateProductsTotal())}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-4 border-t">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/quotes/services/list')}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200/50 disabled:opacity-50 flex items-center font-medium"
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