import React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/format';

interface ProductSaleReceiptProps {
  sale: {
    id: string;
    saleNumber: string;
    customerName: string;
    products: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      subtotal: number;
    }>;
    paymentMethod: string;
    discountValue: number;
    totalValue: number;
    finalValue: number;
    createdAt: any;
  };
  companyInfo: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
  };
}

export const ProductSaleReceipt: React.FC<ProductSaleReceiptProps> = ({
  sale,
  companyInfo
}) => {
  if (!sale || !companyInfo) {
    console.error('Dados necessários não fornecidos para o recibo');
    return null;
  }

  const safeData = {
    ...sale,
    saleNumber: sale.saleNumber || '0',
    customerName: sale.customerName || 'Cliente não identificado',
    products: Array.isArray(sale.products) ? sale.products : [],
    totalValue: sale.totalValue || 0,
    finalValue: sale.finalValue || 0,
    discountValue: sale.discountValue || 0,
    paymentMethod: sale.paymentMethod || 'Não especificado',
    createdAt: sale.createdAt || new Date()
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-white print:shadow-none print:p-0" id="receipt-content">
      <div className="mx-10 print:mx-0"> 
        {/* Cabeçalho */}
        <div className="flex items-start gap-4 mb-6">
          {companyInfo.logo && (
            <img src={companyInfo.logo} alt="Logo" className="w-20 h-auto object-contain" />
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold">{companyInfo.name || 'Nome da Empresa'}</h1>
            <p className="text-xs">{companyInfo.address || 'Endereço não especificado'}</p>
            <p className="text-xs">CNPJ: {companyInfo.cnpj || 'N/A'}</p>
            <p className="text-xs">Tel: {companyInfo.phone || 'N/A'}</p>
          </div>
        </div>

        <div className="border-b border-gray-300 mb-6"></div>

        {/* Título do Comprovante */}
        <div className="text-center mb-6">
          <h2 className="text-base font-bold">COMPROVANTE DE VENDA</h2>
          <p className="text-xs mt-1">
            Nº {safeData.saleNumber} - {safeData.createdAt?.toDate?.() ? format(safeData.createdAt.toDate(), 'dd/MM/yyyy') : 'Data não disponível'}
          </p>
        </div>

        {/* Cliente */}
        <div className="text-sm mb-6">
          <p className="font-medium">Cliente: {safeData.customerName}</p>
        </div>

        {/* Produtos */}
        <div className="mb-6">
          {safeData.products.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-2 text-left font-medium">Produto</th>
                  <th className="py-2 text-right font-medium">Qtd</th>
                  <th className="py-2 text-right font-medium">Valor Un.</th>
                  <th className="py-2 text-right font-medium">Desc.</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safeData.products.map((product, index) => (
                  <tr key={index}>
                    <td className="py-2">{product.name || 'Produto sem nome'}</td>
                    <td className="py-2 text-right">{product.quantity || 0}</td>
                    <td className="py-2 text-right">{formatCurrency(product.unitPrice || 0)}</td>
                    <td className="py-2 text-right">{formatCurrency(product.discount || 0)}</td>
                    <td className="py-2 text-right">{formatCurrency(product.subtotal || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 text-xs py-2">Nenhum produto encontrado</p>
          )}
        </div>

        {/* Totais */}
        <div className="border-t border-gray-300 pt-4 mb-6">
          <div className="flex justify-between text-xs mb-1">
            <span>Subtotal:</span>
            <span>{formatCurrency(safeData.totalValue)}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span>Desconto:</span>
            <span>{formatCurrency(safeData.discountValue)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold mt-2">
            <span>Total:</span>
            <span>{formatCurrency(safeData.finalValue)}</span>
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="text-xs mb-8">
          <p><strong>Forma de Pagamento:</strong> {safeData.paymentMethod}</p>
        </div>

        {/* Mensagem de Agradecimento */}
        <div className="text-center text-sm mt-8">
          <p className="font-medium">Obrigado pela preferência!</p>
          <p>Volte sempre!</p>
        </div>
      </div>
    </div>
  );
};
