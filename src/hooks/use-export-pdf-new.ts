import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  stats: {
    income: number;
    expenses: number;
    balance: number;
    savingsRate: number;
    incomeCount: number;
    expensesCount: number;
  };
  forecastData: {
    pendingIncome: number;
    pendingExpense: number;
    projectedBalance: number;
    incomes: any[];
    expenses: any[];
  };
  incomeCategories: Array<{ name: string; value: number }>;
  expenseCategories: Array<{ name: string; value: number }>;
  topExpenses: any[];
  evolutionData: Array<{ name: string; Receitas: number; Despesas: number; Saldo: number }>;
  period: string;
  customRange?: { start: string; end: string };
  accountFilter: 'pessoal' | 'pj';
  formatCurrency: (value: number) => string;
}

export function useExportPDFNew() {
  const exportReportToPDF = useCallback(async (
    data: ReportData,
    filename: string = 'relatorio.pdf'
  ) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Cores
      const colors = {
        primary: '#22C55E',
        danger: '#EF4444',
        info: '#3B82F6',
        dark: '#111827',
        gray: '#6B7280',
        lightGray: '#9CA3AF'
      };

      // Helper para adicionar fundo escuro na página
      const addPageBackground = () => {
        pdf.setFillColor(10, 15, 28); // #0A0F1C
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      };

      // Helper para adicionar nova página se necessário
      const checkAddPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          addPageBackground();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Adicionar fundo escuro na primeira página
      addPageBackground();

      // Helper para formatar período
      const getPeriodLabel = () => {
        if (data.period === 'custom' && data.customRange) {
          return `${format(new Date(data.customRange.start), 'dd/MM/yyyy')} - ${format(new Date(data.customRange.end), 'dd/MM/yyyy')}`;
        }
        if (data.period === 'month') return format(new Date(), 'MMMM yyyy', { locale: ptBR });
        if (data.period === 'year') return format(new Date(), 'yyyy');
        return format(new Date(), 'dd/MM/yyyy');
      };

      // ===== HEADER =====
      pdf.setFillColor(17, 24, 39);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório Financeiro', margin, 20);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(156, 163, 175);
      pdf.text(getPeriodLabel(), margin, 30);
      
      // Badge de conta
      const accountText = data.accountFilter === 'pessoal' ? 'Conta Pessoal' : 'Conta PJ';
      const badgeColor = data.accountFilter === 'pessoal' ? [59, 130, 246] : [168, 85, 247];
      pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2], 0.1);
      pdf.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      pdf.setFontSize(10);
      const badgeWidth = pdf.getTextWidth(accountText) + 8;
      pdf.roundedRect(pageWidth - margin - badgeWidth, 15, badgeWidth, 8, 2, 2, 'F');
      pdf.text(accountText, pageWidth - margin - badgeWidth + 4, 20);
      
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, 40);

      yPosition = 60;

      // ===== RESUMO DO PERÍODO =====
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo do Período', margin, yPosition);
      yPosition += 10;

      // Cards de resumo
      const cardHeight = 35;
      const cardWidth = (contentWidth - 10) / 3;
      
      // Card Receitas
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(margin, yPosition, cardWidth, cardHeight, 3, 3, 'F');
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(10);
      pdf.text('Total de Receitas', margin + 5, yPosition + 8);
      pdf.setTextColor(34, 197, 94);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.formatCurrency(data.stats.income), margin + 5, yPosition + 20);
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${data.stats.incomeCount} transações`, margin + 5, yPosition + 28);

      // Card Despesas
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(margin + cardWidth + 5, yPosition, cardWidth, cardHeight, 3, 3, 'F');
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(10);
      pdf.text('Total de Despesas', margin + cardWidth + 10, yPosition + 8);
      pdf.setTextColor(239, 68, 68);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.formatCurrency(data.stats.expenses), margin + cardWidth + 10, yPosition + 20);
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${data.stats.expensesCount} transações`, margin + cardWidth + 10, yPosition + 28);

      // Card Saldo
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(margin + (cardWidth + 5) * 2, yPosition, cardWidth, cardHeight, 3, 3, 'F');
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(10);
      pdf.text('Saldo do Período', margin + (cardWidth + 5) * 2 + 5, yPosition + 8);
      const balanceColor = data.stats.balance >= 0 ? [34, 197, 94] : [239, 68, 68];
      pdf.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.formatCurrency(data.stats.balance), margin + (cardWidth + 5) * 2 + 5, yPosition + 20);
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Economia: ${data.stats.savingsRate.toFixed(1)}%`, margin + (cardWidth + 5) * 2 + 5, yPosition + 28);

      yPosition += cardHeight + 15;

      // ===== EVOLUÇÃO FINANCEIRA =====
      checkAddPage(60);
      
      // Fundo para a seção
      const evolutionSectionStart = yPosition - 5;
      pdf.setFillColor(10, 15, 28);
      pdf.rect(0, evolutionSectionStart, pageWidth, 70, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Evolução Financeira', margin, yPosition);
      yPosition += 8;

      if (data.evolutionData.length > 0) {
        const tableData = data.evolutionData.slice(0, 10).map(item => [
          item.name,
          data.formatCurrency(item.Receitas),
          data.formatCurrency(item.Despesas),
          data.formatCurrency(item.Saldo)
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Período', 'Receitas', 'Despesas', 'Saldo']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [17, 24, 39],
            textColor: [156, 163, 175],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fillColor: [17, 24, 39],
            textColor: [255, 255, 255],
            fontSize: 8
          },
          alternateRowStyles: {
            fillColor: [26, 32, 44]
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 15;
      }

      // ===== ANÁLISE POR CATEGORIA =====
      checkAddPage(80);
      
      // Fundo para a seção
      const categorySectionStart = yPosition - 5;
      pdf.setFillColor(10, 15, 28);
      pdf.rect(0, categorySectionStart, pageWidth, 80, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Análise por Categoria', margin, yPosition);
      yPosition += 8;

      const categoryCardWidth = (contentWidth - 5) / 2;

      // Receitas por Categoria
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(margin, yPosition, categoryCardWidth, 60, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Receitas por Categoria', margin + 5, yPosition + 8);
      
      let catY = yPosition + 15;
      data.incomeCategories.slice(0, 5).forEach((cat, idx) => {
        pdf.setTextColor(156, 163, 175);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(cat.name, margin + 5, catY);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        const percentage = data.stats.income > 0 ? ((cat.value / data.stats.income) * 100).toFixed(1) : '0.0';
        pdf.text(`${data.formatCurrency(cat.value)} (${percentage}%)`, margin + 5, catY + 4);
        catY += 9;
      });

      // Despesas por Categoria
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(margin + categoryCardWidth + 5, yPosition, categoryCardWidth, 60, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Despesas por Categoria', margin + categoryCardWidth + 10, yPosition + 8);
      
      catY = yPosition + 15;
      data.expenseCategories.slice(0, 5).forEach((cat, idx) => {
        pdf.setTextColor(156, 163, 175);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(cat.name, margin + categoryCardWidth + 10, catY);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        const percentage = data.stats.expenses > 0 ? ((cat.value / data.stats.expenses) * 100).toFixed(1) : '0.0';
        pdf.text(`${data.formatCurrency(cat.value)} (${percentage}%)`, margin + categoryCardWidth + 10, catY + 4);
        catY += 9;
      });

      yPosition += 70;

      // ===== MAIORES DESPESAS =====
      if (data.topExpenses.length > 0) {
        checkAddPage(60);
        
        // Fundo para a seção
        const expensesSectionStart = yPosition - 5;
        pdf.setFillColor(10, 15, 28);
        pdf.rect(0, expensesSectionStart, pageWidth, 70, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Maiores Despesas', margin, yPosition);
        yPosition += 8;

        const expenseTableData = data.topExpenses.map(exp => [
          exp.descricao,
          format(new Date(exp.data), 'dd/MM/yyyy'),
          exp.categoria?.descricao || 'Outros',
          data.formatCurrency(exp.valor)
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Descrição', 'Data', 'Categoria', 'Valor']],
          body: expenseTableData,
          theme: 'grid',
          headStyles: {
            fillColor: [17, 24, 39],
            textColor: [156, 163, 175],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fillColor: [17, 24, 39],
            textColor: [255, 255, 255],
            fontSize: 8
          },
          alternateRowStyles: {
            fillColor: [26, 32, 44]
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 15;
      }

      // ===== PREVISÃO FINANCEIRA =====
      checkAddPage(50);
      
      // Fundo para a seção
      const forecastSectionStart = yPosition - 5;
      pdf.setFillColor(10, 15, 28);
      pdf.rect(0, forecastSectionStart, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Previsão Financeira', margin, yPosition);
      yPosition += 10;

      // Cards de previsão
      const forecastCardWidth = (contentWidth - 10) / 3;
      
      // A Receber
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(margin, yPosition, forecastCardWidth, 25, 3, 3, 'F');
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(9);
      pdf.text('Total a Receber', margin + 5, yPosition + 7);
      pdf.setTextColor(34, 197, 94);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.formatCurrency(data.forecastData.pendingIncome), margin + 5, yPosition + 16);
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${data.forecastData.incomes.length} pendentes`, margin + 5, yPosition + 22);

      // A Pagar
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(margin + forecastCardWidth + 5, yPosition, forecastCardWidth, 25, 3, 3, 'F');
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(9);
      pdf.text('Total a Pagar', margin + forecastCardWidth + 10, yPosition + 7);
      pdf.setTextColor(239, 68, 68);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.formatCurrency(data.forecastData.pendingExpense), margin + forecastCardWidth + 10, yPosition + 16);
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${data.forecastData.expenses.length} pendentes`, margin + forecastCardWidth + 10, yPosition + 22);

      // Saldo Previsto
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(margin + (forecastCardWidth + 5) * 2, yPosition, forecastCardWidth, 25, 3, 3, 'F');
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(9);
      pdf.text('Saldo Previsto', margin + (forecastCardWidth + 5) * 2 + 5, yPosition + 7);
      const projectedColor = data.forecastData.projectedBalance >= 0 ? [59, 130, 246] : [239, 68, 68];
      pdf.setTextColor(projectedColor[0], projectedColor[1], projectedColor[2]);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.formatCurrency(data.forecastData.projectedBalance), margin + (forecastCardWidth + 5) * 2 + 5, yPosition + 16);
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Saldo atual + pendentes', margin + (forecastCardWidth + 5) * 2 + 5, yPosition + 22);

      yPosition += 35;

      // ===== FOOTER =====
      const finalPage = pdf.getNumberOfPages();
      for (let i = 1; i <= finalPage; i++) {
        pdf.setPage(i);
        
        // Adicionar footer
        pdf.setFillColor(17, 24, 39);
        pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Este relatório foi gerado automaticamente pelo sistema GranaZap', pageWidth / 2, pageHeight - 12, { align: 'center' });
        pdf.setFontSize(7);
        pdf.text(`© ${new Date().getFullYear()} GranaZap - Gestão Financeira Inteligente`, pageWidth / 2, pageHeight - 7, { align: 'center' });
        pdf.text(`Página ${i} de ${finalPage}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      }

      // Salvar PDF
      pdf.save(filename);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      return false;
    }
  }, []);

  return { exportReportToPDF };
}
