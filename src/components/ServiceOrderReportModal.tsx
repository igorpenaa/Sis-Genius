import React from 'react';
import { X, Printer, FileText, MessageCircle } from 'lucide-react';
import { ServiceOrder } from '../types/serviceOrder';
import { ServiceOrderReport } from './ServiceOrderReport';
import { generatePDF } from '../utils/pdfGenerator';

interface ServiceOrderReportModalProps {
  serviceOrder: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
  companyInfo: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
  };
}

export const ServiceOrderReportModal: React.FC<ServiceOrderReportModalProps> = ({
  serviceOrder,
  isOpen,
  onClose,
  companyInfo
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ordem de Serviço #${serviceOrder.id}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 1.6cm; }
              }
            </style>
          </head>
          <body>
            ${document.getElementById('report-content')?.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleGeneratePDF = async () => {
    const fileName = `OS_${serviceOrder.id}_${serviceOrder.customerName.replace(/\s+/g, '_')}.pdf`;
    await generatePDF(serviceOrder, companyInfo, fileName);
  };

  const handleWhatsAppShare = async () => {
    const fileName = `OS_${serviceOrder.id}_${serviceOrder.customerName.replace(/\s+/g, '_')}.pdf`;
    await generatePDF(serviceOrder, companyInfo, fileName);
    
    // Construir a mensagem para o WhatsApp
    const message = `Olá ${serviceOrder.customerName}, segue a Ordem de Serviço #${serviceOrder.id}`;
    const encodedMessage = encodeURIComponent(message);
    
    // Abrir o WhatsApp Web com a mensagem
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full m-4">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Ordem de Serviço #{serviceOrder.id}</h2>
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Imprimir"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleGeneratePDF}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Gerar PDF"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Enviar via WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[80vh]" id="report-content">
          <ServiceOrderReport serviceOrder={serviceOrder} companyInfo={companyInfo} />
        </div>
      </div>
    </div>
  );
};
