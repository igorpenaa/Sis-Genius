import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ServiceOrder } from '../types/serviceOrder';

interface CompanyInfo {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
}

export const generatePDF = async (
  serviceOrder: ServiceOrder,
  companyInfo: CompanyInfo,
  fileName: string
): Promise<void> => {
  try {
    try {
      // Criar um elemento temporário para renderizar o relatório
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // Largura A4
      tempDiv.style.minHeight = '297mm'; // Altura mínima A4
      tempDiv.style.padding = '10mm'; // Margem interna
      tempDiv.style.backgroundColor = 'white';
      document.body.appendChild(tempDiv);

      // Renderizar o conteúdo do relatório no elemento temporário
      const reportContent = document.getElementById('report-content');
      if (reportContent) {
        tempDiv.innerHTML = reportContent.innerHTML;
      }

      // Converter o HTML para canvas com configurações otimizadas
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Melhor qualidade
        useCORS: true,
        logging: false,
        windowWidth: 793.7, // Largura A4 em pixels (210mm)
        windowHeight: 1122.5, // Altura A4 em pixels (297mm)
        backgroundColor: '#ffffff'
      });

      // Criar o PDF com configurações A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calcular dimensões para ajuste perfeito em A4
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Adicionar a imagem mantendo as proporções A4
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

      // Salvar o PDF
      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      // Limpar o elemento temporário
      const tempDiv = document.querySelector('div[style="position: absolute; left: -9999px;"]');
      if (tempDiv) {
        document.body.removeChild(tempDiv);
      }
    }
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
  }
};
