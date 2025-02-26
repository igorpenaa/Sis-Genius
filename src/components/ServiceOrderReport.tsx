import React from 'react';
import { format } from 'date-fns';
import { ServiceOrder } from '../types/serviceOrder';
import { formatCurrency } from '../utils/format';

interface ServiceOrderReportProps {
  serviceOrder: ServiceOrder;
  companyInfo: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
  };
}

export const ServiceOrderReport: React.FC<ServiceOrderReportProps> = ({
  serviceOrder,
  companyInfo
}) => {
  if (!serviceOrder) {
    console.error('Nenhuma ordem de serviço fornecida.');
    return null;
  }

  if (!companyInfo) {
    console.error('Nenhuma informação da empresa fornecida.');
    return null;
  }

  try {
    const calculateWarrantyDate = (startDate: Date, warrantyDays: number) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + warrantyDays);
      return date;
    };

    const calculateTotal = () => {
      const servicesTotal = serviceOrder.services.reduce(
        (total, service) => total + service.quantity * service.unitPrice,
        0
      );
      const productsTotal = serviceOrder.products.reduce(
        (total, product) => total + product.quantity * product.unitPrice,
        0
      );
      return servicesTotal + productsTotal - (serviceOrder.discount || 0);
    };

    return (
      <div className="p-8 max-w-4xl mx-auto bg-white">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-start">
            <img src={companyInfo.logo} alt="Logo" className="w-32 h-auto mr-4" />
            <div>
              <h1 className="text-xl font-bold">{companyInfo.name}</h1>
              <p className="text-sm">CNPJ: {companyInfo.cnpj}</p>
              <p className="text-sm">{companyInfo.address}</p>
              <p className="text-sm">Tel: {companyInfo.phone}</p>
              <p className="text-sm">{companyInfo.email}</p>
              <p className="text-blue-600 mt-2">Responsável: {serviceOrder.technicianName}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold mb-2">ORDEM DE SERVIÇO #{serviceOrder.id}</h2>
            <p className="text-sm">
              Data de Emissão: {format(new Date(serviceOrder.startDate), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        {/* Informações Gerais */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">STATUS</th>
                <th className="border px-4 py-2">DATA INICIAL</th>
                <th className="border px-4 py-2">DATA FINAL</th>
                <th className="border px-4 py-2">GARANTIA</th>
                <th className="border px-4 py-2">VENCIMENTO DA GARANTIA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2 text-center">{serviceOrder.status}</td>
                <td className="border px-4 py-2 text-center">
                  {format(new Date(serviceOrder.startDate), 'dd/MM/yyyy')}
                </td>
                <td className="border px-4 py-2 text-center">
                  {serviceOrder.endDate ? format(new Date(serviceOrder.endDate), 'dd/MM/yyyy') : '-'}
                </td>
                <td className="border px-4 py-2 text-center">{serviceOrder.warrantyPeriod} dias</td>
                <td className="border px-4 py-2 text-center">
                  {format(calculateWarrantyDate(serviceOrder.startDate, serviceOrder.warrantyPeriod), 'dd/MM/yyyy')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dados do Cliente */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Dados do Cliente</h3>
          <div className="space-y-2">
            <p><strong>Cliente:</strong> {serviceOrder.customerName}</p>
            <p><strong>CPF/CNPJ:</strong> {serviceOrder.customerDocument}</p>
            <p><strong>Telefone:</strong> {serviceOrder.customerPhone}</p>
            <p><strong>Endereço:</strong> {serviceOrder.customerAddress}</p>
          </div>
        </div>

        {/* Equipamentos */}
        {serviceOrder.equipments.map((equipment, index) => (
          <div key={equipment.id} className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Descrição do Equipamento {index + 1}</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="border px-4 py-2 bg-gray-100"><strong>Tipo de Produto</strong></td>
                  <td className="border px-4 py-2">{equipment.category}</td>
                  <td className="border px-4 py-2 bg-gray-100"><strong>Marca</strong></td>
                  <td className="border px-4 py-2">{equipment.brand}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 bg-gray-100"><strong>Modelo</strong></td>
                  <td className="border px-4 py-2">{equipment.model}</td>
                  <td className="border px-4 py-2 bg-gray-100"><strong>Cor</strong></td>
                  <td className="border px-4 py-2">{equipment.color}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 bg-gray-100"><strong>IMEI</strong></td>
                  <td className="border px-4 py-2" colSpan={3}>{equipment.imei}</td>
                </tr>
              </tbody>
            </table>

            {/* Defeito Apresentado */}
            <div className="mt-4 p-4 bg-gray-100">
              <h4 className="font-semibold mb-2">Defeito Apresentado:</h4>
              <p>{equipment.reportedIssue}</p>
            </div>

            {/* Checklist */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Checklist do Aparelho:</h4>
              <div className="mb-4">
                <p>O Aparelho Liga ou Possibilita Testes?</p>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={equipment.hasPower}
                      readOnly
                      className="mr-2"
                    />
                    Sim
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!equipment.hasPower}
                      readOnly
                      className="mr-2"
                    />
                    Não
                  </label>
                </div>
              </div>
              
              {/* Itens do Checklist */}
              {serviceOrder.checklists && serviceOrder.checklists
                .filter(checklist => checklist.equipmentIndex === index)
                .map((checklist, checklistIndex) => (
                  <div key={checklistIndex} className="mt-4">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-4 py-2 text-left">Item</th>
                          <th className="border px-4 py-2 w-24 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checklist.items.map((item, itemIndex) => (
                          <tr key={itemIndex}>
                            <td className="border px-4 py-2">{item.text}</td>
                            <td className="border px-4 py-2 text-center">
                              {item.checked ? '✓' : '✗'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Serviços Realizados */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Serviços Realizados</h3>
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Descrição do Serviço</th>
                <th className="border px-4 py-2">QTD</th>
                <th className="border px-4 py-2">Valor Unitário</th>
                <th className="border px-4 py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {serviceOrder.services.map((service, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{service.serviceName}</td>
                  <td className="border px-4 py-2 text-center">{service.quantity}</td>
                  <td className="border px-4 py-2 text-right">{formatCurrency(service.unitPrice)}</td>
                  <td className="border px-4 py-2 text-right">
                    {formatCurrency(service.quantity * service.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="border px-4 py-2 text-right font-bold">Total:</td>
                <td className="border px-4 py-2 text-right font-bold">
                  {formatCurrency(calculateTotal())}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Parecer Técnico */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Parecer Técnico</h3>
          <div className="p-4 bg-gray-100">
            <p>{serviceOrder.technicalFeedback}</p>
          </div>
        </div>

        {/* Assinaturas */}
        <div className="mt-16">
          <div className="flex justify-between">
            <div className="text-center">
              <div className="border-t border-black w-48">
                <p className="mt-2">Assinatura do Cliente</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-black w-48">
                <p className="mt-2">Assinatura do Técnico</p>
              </div>
            </div>
          </div>
        </div>

        {/* Declaração do Cliente */}
        <div className="mt-8">
          <p className="text-sm">
            Declaro que retirei o aparelho e realizei os testes necessários:
          </p>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" /> Realizado
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" /> Não Realizado
            </label>
          </div>
          <div className="mt-4">
            <p className="text-sm">Estado final do aparelho:</p>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" /> Perfeito estado de funcionamento
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" /> Mesmo problema identificado
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Erro ao carregar o relatório:', error);
    return null;
  }
};
