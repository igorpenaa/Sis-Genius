import React, { useEffect, useState, useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProductSaleReceipt } from './ProductSaleReceipt';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ProductSaleReceiptModalProps {
  sale: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductSaleReceiptModal: React.FC<ProductSaleReceiptModalProps> = ({
  sale,
  isOpen,
  onClose
}) => {
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadCompanyInfo();
    }
  }, [isOpen]);

  const loadCompanyInfo = async () => {
    try {
      const companiesRef = collection(db, 'companies');
      const snapshot = await getDocs(companiesRef);
      if (!snapshot.empty) {
        setCompanyInfo(snapshot.docs[0].data());
      }
    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error);
    }
  };

  const handlePrint = () => {
    if (!companyInfo || !sale) return;

    // Criar uma nova janela
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Adicionar o conteúdo HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante de Venda #${sale.saleNumber}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body {
                padding: 0;
                margin: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                margin: 0;
                size: auto;
              }
              #print-content {
                padding: 0 !important;
              }
              button, .print-hide {
                display: none !important;
              }
            }
            body {
              background: white;
            }
            #print-content {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
          </style>
        </head>
        <body class="bg-white">
          <div id="print-content">
            ${reportRef.current?.innerHTML || ''}
          </div>
          <script>
            window.onload = () => {
              // Pequeno delay para garantir que os estilos foram carregados
              setTimeout(() => {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgWidth = 190; // A4 width in mm - 20mm para margens
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > pageHeight ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Adicionar a imagem com margem de 10mm em cada lado
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        10, // Margem esquerda
        10, // Margem superior
        imgWidth,
        imgHeight,
        '',
        'FAST'
      );

      // Gerar nome do arquivo
      const fileName = `Comprovante de Venda ${sale.saleNumber} - ${sale.customerName}`
        .replace(/[<>:"/\\|?*]/g, '') // Remove caracteres inválidos para nome de arquivo
        .trim();

      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho do Modal - Escondido na Impressão */}
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white print:hidden">
          <h2 className="text-lg font-semibold">Comprovante de Venda</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Imprimir"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Baixar PDF"
            >
              <Download className="w-5 h-5" />
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
        
        {/* Conteúdo do Recibo */}
        <div ref={reportRef}>
          {companyInfo && (
            <ProductSaleReceipt
              sale={sale}
              companyInfo={companyInfo}
            />
          )}
        </div>
      </div>
    </div>
  );
};
