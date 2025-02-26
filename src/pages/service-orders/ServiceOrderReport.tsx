import React, { useRef, useEffect, useState } from 'react';
import { Printer, MessageCircle, FileText, Wrench, Smartphone, ClipboardCheck, DollarSign, UserCheck, UserCircle, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { message } from 'antd';
import { Template, generate } from '@pdfme/generator';
import { font as robotoFont } from '@pdfme/common';
import { formatDate, formatCurrency } from '../../utils/format';
import { serviceOrderStatus } from '../../utils/serviceOrderStatus';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface ServiceOrderReportProps {
  onClose?: () => void;
  order: any;
  hideControls?: boolean;
}

interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string;
}

interface Customer {
  id: string;
  name: string;
  cpf: string;
  rg: string;
  phones: {
    commercial?: string;
    mobile?: string;
    whatsapp: string;
  };
  address?: Address;
}

export default function ServiceOrderReport({ onClose, order, hideControls = false }: ServiceOrderReportProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyLogo, setCompanyLogo] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);
  const [checklistItems, setChecklistItems] = useState(order.checklists?.map((checklist: any) => checklist.items) || []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Buscar logo da empresa
        const companiesRef = collection(db, 'companies');
        const companiesSnapshot = await getDocs(companiesRef);
        
        if (!companiesSnapshot.empty) {
          const companyDoc = companiesSnapshot.docs[0];
          const companyData = companyDoc.data();
          console.log('Company data:', companyData);
          
          if (companyData.logo) {
            setCompanyLogo(companyData.logo);
          }
        }

        // Carregar dados do cliente
        if (order?.customerId) {
          const customerRef = doc(db, 'customers', order.customerId);
          const customerSnap = await getDoc(customerRef);
          
          if (customerSnap.exists()) {
            const customerData = customerSnap.data() as Customer;
            const addressCollectionRef = collection(customerRef, 'address');
            const addressSnapshot = await getDocs(addressCollectionRef);
            
            if (!addressSnapshot.empty) {
              const addressData = addressSnapshot.docs[0].data() as Address;
              customerData.address = addressData;
            }
            
            setCustomer(customerData);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [order]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <span>Carregando dados do cliente...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center p-4">
        <span>Dados do cliente não encontrados.</span>
      </div>
    );
  }

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ordem de Serviço #${order.orderNumber}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0.5cm;
              }
              body {
                margin: 0;
                padding: 0;
                font-size: 12px;
                color: #000;
              }
              .page-break {
                page-break-after: always;
              }
              .no-print {
                display: none;
              }
            }
            body {
              margin: 0;
              padding: 0;
            }
            #report-content {
              padding: 0.5cm;
            }
            .print-section {
              margin-bottom: 1rem;
              border: 1px solid #e5e7eb;
              padding: 1rem;
              border-radius: 0.375rem;
            }
            .section-title {
              background-color: #f3f4f6;
              padding: 0.5rem;
              margin-bottom: 0.5rem;
              font-weight: bold;
              border-radius: 0.25rem;
            }
          </style>
        </head>
        <body>
          <div id="report-content">
            ${document.getElementById('report-content')?.innerHTML || ''}
          </div>
          <script>
            window.onload = function() {
              // Aguardar o carregamento completo da página e imagens
              setTimeout(function() {
                // Adicionar botão de impressão
                var printButton = document.createElement('button');
                printButton.innerHTML = 'Imprimir';
                printButton.style.position = 'fixed';
                printButton.style.top = '20px';
                printButton.style.right = '20px';
                printButton.style.padding = '10px 20px';
                printButton.style.backgroundColor = '#4F46E5';
                printButton.style.color = 'white';
                printButton.style.border = 'none';
                printButton.style.borderRadius = '5px';
                printButton.style.cursor = 'pointer';
                printButton.className = 'no-print';
                
                printButton.onclick = function() {
                  window.print();
                };
                
                document.body.appendChild(printButton);
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;

    // Escrever o conteúdo na nova janela
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleGeneratePDF = async () => {
    try {
      const reportContent = document.getElementById('report-content');
      if (!reportContent) return;

      // Criar uma cópia do elemento para manipulação
      const clone = reportContent.cloneNode(true) as HTMLElement;
      clone.style.width = '210mm';
      clone.style.padding = '0';
      clone.style.paddingTop = '5mm';
      clone.style.paddingBottom = '5mm';
      clone.style.paddingLeft = '5mm';
      clone.style.paddingRight = '5mm';
      document.body.appendChild(clone);

      // Configurações do html2canvas
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight
      });

      // Remover o clone após captura
      document.body.removeChild(clone);

      // Criar PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calcular dimensões para ajustar a imagem na página A4
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Adicionar a imagem ao PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Se o conteúdo for maior que uma página A4, adicionar novas páginas
      if (imgHeight > 297) {
        let currentHeight = 0;
        while (currentHeight < imgHeight) {
          currentHeight += 297;
          if (currentHeight < imgHeight) {
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, -currentHeight, imgWidth, imgHeight);
          }
        }
      }

      // Criar nome do arquivo com número da OS e nome do cliente
      const clientName = customer.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();
      
      const fileName = `ordem-servico-${order.orderNumber}-${clientName}.pdf`;

      // Salvar o PDF
      pdf.save(fileName);

      message.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      message.error('Erro ao gerar o PDF. Por favor, tente novamente.');
    }
  };

  const handleWhatsApp = () => {
    if (!customer?.phones?.whatsapp) {
      alert('Número de WhatsApp não encontrado para este cliente.');
      return;
    }

    const phoneNumber = customer.phones.whatsapp.replace(/\D/g, '');
    const equipment = order.equipments?.[0]; // Certifique-se de obter o primeiro equipamento

    const message = `Olá ${customer.name}, *O.S. #${order.orderNumber}* | *Status:* ${serviceOrderStatus[order.status || '']} | *Equipamento:* ${equipment?.model || '-'} | *Cor:* ${equipment?.color || '-'} | *IMEI:* ${equipment?.imei || '-'} | *Valor Total:* ${formatCurrency(order.servicesTotal || 0)} - Agradecemos a preferência! Se precisar de algo mais, estamos à disposição!`;

    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleToggle = (itemId: string, checklistIndex: number, itemIndex: number) => {
    const updatedChecklistItems = [...checklistItems];
    updatedChecklistItems[checklistIndex][itemIndex].checked = !updatedChecklistItems[checklistIndex][itemIndex].checked;
    setChecklistItems(updatedChecklistItems);
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] flex flex-col">
        {/* Barra de ferramentas */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-center w-full">O.S. {order.orderNumber}</h2>
          <div className="flex gap-4">
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Printer size={20} />
              Impr
            </button>
            <button
              onClick={handleGeneratePDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <FileText size={20} />
              PDF
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <MessageCircle size={20} />
              Whats
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Conteúdo do relatório com scroll */}
        <div className="flex-1 overflow-y-auto">
          <div ref={reportRef} className="p-4 bg-white" id="report-content">
            {/* Cabeçalho da Empresa */}
            <div className="grid grid-cols-3 gap-1 mb-2 items-center">
              <div className="flex justify-center">
                <img src={companyLogo} alt="Logo" className="h-16 object-contain" />
              </div>
              <div className="text-center">
                <h1 className="text-[10px] font-bold uppercase">Rede Genius</h1>
                <p className="text-[8.5px]">
                  Rua Example, 123 - Centro
                  <br />
                  Salvador - BA
                </p>
              </div>
              <div className="text-right text-[8.5px]">
                <p>Email: contato@redegenius.com</p>
                <p>Tel: (71) 9999-9999</p>
              </div>
            </div>

            {/* Título da O.S. */}
            <div className="bg-gray-100 py-1 px-2 flex justify-center items-center mb-2">
              <span className="text-[12px] font-bold">ORDEM DE SERVIÇO <strong>Nº {order.orderNumber}</strong></span>
            </div>

            {/* Status e Datas */}
            <table className="w-full border-collapse mb-2 text-[8.5px]">
              <thead>
                <tr>
                  <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Status</th>
                  <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Data Inicial</th>
                  <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Previsão de Entrega</th>
                  <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Garantia</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-1 py-0.5 text-center">{serviceOrderStatus[order.status || '']}</td>
                  <td className="border px-1 py-0.5 text-center">{formatDate(order.startDate)}</td>
                  <td className="border px-1 py-0.5 text-center">{order.deliveryDate}</td>
                  <td className="border px-1 py-0.5 text-center">{order.warrantyPeriod} Dias</td>
                </tr>
              </tbody>
            </table>

            {/* Dados do Cliente */}
            <div className="mb-2">
              <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 mb-1">
                <UserCircle className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-[10px]">Dados do Cliente: {customer.name?.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[8.5px]">
                <div className="border px-1 py-0.5">
                  <span className="font-bold">CPF:</span> {customer.cpf || '-'}
                </div>
                <div className="border px-1 py-0.5">
                  <span className="font-bold">RG:</span> {customer.rg || '-'}
                </div>
                <div className="border px-1 py-0.5">
                  <span className="font-bold">Telefone:</span> {customer.phones?.commercial || '-'}
                </div>
                <div className="border px-1 py-0.5">
                  <span className="font-bold">Celular:</span> {customer.phones?.mobile || '-'}
                </div>
                <div className="border px-1 py-0.5">
                  <span className="font-bold">WhatsApp:</span> {customer.phones?.whatsapp || '-'}
                </div>
                <div className="border px-1 py-0.5">
                  <span className="font-bold">CEP:</span> {customer.address?.zipCode || '-'}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 text-[8.5px] mt-1">
                <div className="border px-1 py-0.5">
                  <span className="font-bold">Endereço:</span> {`${customer.address?.street || '-'}, Nº: ${customer.address?.number || '-'}${customer.address?.complement ? `, ${customer.address.complement}` : ''}, Bairro: ${customer.address?.neighborhood || '-'}, Cidade: ${customer.address?.city || '-'}, Estado: ${customer.address?.state || '-'}`}
                </div>
              </div>
            </div>

            {/* Dados dos Equipamentos */}
            {order.equipments?.map((equipment, index) => (
              <div key={index} className="mb-2">
                <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 mb-1">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-[9px]">Equipamento {index + 1}</span>
                </div>
                <table className="w-full border-collapse text-[8.5px]">
                  <thead>
                    <tr>
                      <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Nº</th>
                      <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Subcategoria</th>
                      <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Marca</th>
                      <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Modelo</th>
                      <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Cor</th>
                      <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">IMEI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border px-1 py-0.5 text-center font-bold">{index + 1}</td>
                      <td className="border px-1 py-0.5 text-center">{equipment.subcategory}</td>
                      <td className="border px-1 py-0.5 text-center">{equipment.brand}</td>
                      <td className="border px-1 py-0.5 text-center">{equipment.model}</td>
                      <td className="border px-1 py-0.5 text-center">{equipment.color}</td>
                      <td className="border px-1 py-0.5 text-center">{equipment.imei}</td>
                    </tr>
                  </tbody>
                </table>
                
                {/* Defeito Apresentado */}
                <div className="border-x border-b px-1 py-0.5">
                  <span className="font-bold">Defeito Apresentado:</span> {equipment.reportedIssue}
                </div>

                {/* Mensagem de Aparelho Desligado */}
                {!equipment.hasPower && (
                  <div className="border-x border-b px-1 py-0.5 text-red-600 bg-red-50">
                    Aparelho {equipment.model} foi recebido sem condições de realizar os testes de funcionalidades através do checklist. 
                    Dessa forma, o dispositivo está sendo registrado com todas as funções consideradas inoperantes devido à impossibilidade de teste.
                  </div>
                )}

                {/* Checklist */}
                {order.checklists?.filter(checklist => checklist.equipmentIndex === index).map((checklist) => (
                  <div key={checklist.id} className="border-x border-b px-1 py-0.5 mb-4">
                    <div className="flex items-center gap-1 mb-0.5">
                      <ClipboardCheck className="w-3 h-3 text-blue-600" />
                      <span className="font-bold">Checklist - {order.equipments?.[checklist.equipmentIndex]?.model || `Equipamento ${checklist.equipmentIndex + 1}`}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-[6.5px">  
                      {checklist.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-1">
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${item.checked ? 'bg-green-500' : 'bg-red-500'} text-white`}> 
                            {item.checked ? '' : ''}
                          </div>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Laudo Técnico */}
            {order.technicalFeedback && (
              <div className="mb-2">
                <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 mb-1">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-[9px]">Laudo Técnico</span>
                </div>
                <div className="border px-2 py-1 text-[8.5px]">
                  {order.technicalFeedback}
                </div>
              </div>
            )}

            {/* Serviços */}
            {order.services && order.services.length > 0 && (
              <table className="w-full border-collapse mb-2 text-[8.5px]">
                <thead>
                  <tr>
                    <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Serviço</th>
                    <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center w-16">QTD</th>
                    <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center w-24">UNI</th>
                    <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.services.map((service, index) => (
                    <tr key={index}>
                      <td className="border px-1 py-0.5 text-center">{service.serviceName}</td>
                      <td className="border px-1 py-0.5 text-center">{service.quantity}</td>
                      <td className="border px-1 py-0.5 text-center">{formatCurrency(service.unitPrice)}</td>
                      <td className="border px-1 py-0.5 text-center">{formatCurrency(service.quantity * service.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Produtos */}
            {order.products && order.products.length > 0 && (
              <table className="w-full border-collapse mb-2 text-[8.5px]">
                <thead>
                  <tr>
                    <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center">Produto</th>
                    <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center w-16">QTD</th>
                    <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center w-24">UNI</th>
                    <th className="border px-1 py-0.5 bg-gray-50 font-bold text-center w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.products.map((product, index) => (
                    <tr key={index}>
                      <td className="border px-1 py-0.5 text-center">{product.productName}</td>
                      <td className="border px-1 py-0.5 text-center">{product.quantity}</td>
                      <td className="border px-1 py-0.5 text-center">{formatCurrency(product.unitPrice)}</td>
                      <td className="border px-1 py-0.5 text-center">{formatCurrency(product.quantity * product.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Resumo Financeiro */}
            <div className="mb-4 border rounded-lg p-2 bg-gray-50">
              <div className="text-[10px] flex justify-center gap-2">
                <span>Total Serviços: {formatCurrency(order.servicesTotal || 0)}</span>
                <span>|</span>
                <span>Total Produtos: {formatCurrency(order.productsTotal || 0)}</span>
                <span>|</span>
                <span className="text-red-600">Desconto: -{formatCurrency(order.discount || 0)}</span>
                <span>|</span>
                <span className="text-[12px] font-bold">Total Geral: {formatCurrency(order.totalAmount || 0)}</span>
              </div>
            </div>

            {/* Assinaturas */}
            <div className="mt-8 grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col justify-end items-center h-[50px]">
                <div className="w-full border-t border-black pt-2 text-center">
                  <p className="mb-2">ASSINATURA {customer.name?.toUpperCase()}</p>
                  <p className="text-[8.5px]">{formatDate(new Date())}</p>
                </div>
              </div>
              <div className="flex flex-col justify-end items-center h-[50px]">
                <div className="w-full border-t border-black pt-2 text-center">
                  <p className="mb-2">Assinatura do Técnico</p>
                  <p className="text-[8.5px]">{formatDate(new Date())}</p>
                </div>
              </div>
            </div>

            {/* Declaração Final */}
            <div className="mb-4">
              <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 mb-1">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-[9px]">Declaração do Cliente</span>
              </div>
              <p className="text-[8.5px] mb-2 text-center">
                Eu, {customer.name}, declaro que retirei o aparelho e realizei todos os testes necessários, constatando que o serviço foi: [  ] Realizado | [  ] Não Realizado.<br />
                O aparelho encontra-se em: [  ] Perfeito estado de funcionamento [  ] Mesmo problema identificado
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-end items-center h-[40px]">
                  <p className="text-[8.5px] mb-2">Data da retirada: ___/___/_____</p>
                </div>
                <div className="flex flex-col justify-end items-center h-[40px]">
                  <div className="w-48 border-t border-black pt-2 text-center">
                    <p className="text-[8.5px]">ASSINATURA {customer.name?.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
