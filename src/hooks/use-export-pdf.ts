import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function useExportPDF() {
  const exportToPDF = useCallback(async (
    elementId: string,
    filename: string = 'relatorio.pdf',
    options?: {
      orientation?: 'portrait' | 'landscape';
      format?: 'a4' | 'letter';
    }
  ) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Mostrar elemento temporariamente se estiver escondido
      const wasHidden = element.style.display === 'none';
      if (wasHidden) {
        element.style.display = 'block';
      }

      // Aguardar um frame para garantir renderização
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Criar PDF
      const pdf = new jsPDF({
        orientation: options?.orientation || 'portrait',
        unit: 'px',
        format: options?.format || 'a4',
        compress: true,
        hotfixes: ['px_scaling']
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Capturar o elemento como imagem com altura controlada
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0A0F1C',
        width: 1200,
        windowWidth: 1200,
        allowTaint: true,
        foreignObjectRendering: false,
        ignoreElements: (element) => {
          return element.classList?.contains('no-pdf') || false;
        },
        onclone: (clonedDoc, clonedElement) => {
          // Remover TODAS as folhas de estilo para evitar cores lab
          const allStyles = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
          allStyles.forEach(style => style.remove());
          
          // Adicionar CSS mínimo necessário
          const minimalStyle = clonedDoc.createElement('style');
          minimalStyle.textContent = `
            * { 
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              background-color: #0A0F1C;
            }
          `;
          clonedDoc.head.appendChild(minimalStyle);
        }
      });

      // Esconder novamente se estava escondido
      if (wasHidden) {
        element.style.display = 'none';
      }

      // Calcular quantas páginas são necessárias
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdfHeight;
      const totalPages = Math.ceil(imgHeight / pageHeight);

      // Converter canvas para imagem
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Adicionar páginas
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        // Calcular a posição Y para esta página
        const yPosition = -(page * pageHeight);
        
        // Adicionar a imagem completa, mas posicionada para mostrar apenas a parte desta página
        pdf.addImage(
          imgData,
          'PNG',
          0,
          yPosition,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
      }

      // Salvar PDF
      pdf.save(filename);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      return false;
    }
  }, []);

  return { exportToPDF };
}
