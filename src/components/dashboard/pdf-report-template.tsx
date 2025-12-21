"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  BarChart3,
  PieChart as PieChartIcon,
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface PDFReportTemplateProps {
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
    currentBalance: number;
    incomes: any[];
    expenses: any[];
  };
  incomeCategories: Array<{ name: string; value: number; color: string }>;
  expenseCategories: Array<{ name: string; value: number; color: string }>;
  topExpenses: any[];
  evolutionData: Array<{ name: string; Receitas: number; Despesas: number; Saldo: number }>;
  period: string;
  customRange?: { start: string; end: string };
  accountFilter: 'pessoal' | 'pj';
  formatCurrency: (value: number) => string;
  dateRange: { start: Date; end: Date };
}

export function PDFReportTemplate({
  stats,
  forecastData,
  incomeCategories,
  expenseCategories,
  topExpenses,
  evolutionData,
  period,
  customRange,
  accountFilter,
  formatCurrency,
  dateRange
}: PDFReportTemplateProps) {
  const getPeriodLabel = () => {
    if (period === 'custom' && customRange) {
      return `${format(new Date(customRange.start), 'dd/MM/yyyy')} - ${format(new Date(customRange.end), 'dd/MM/yyyy')}`;
    }
    if (period === 'month') return format(new Date(), 'MMMM yyyy', { locale: ptBR });
    if (period === 'year') return format(new Date(), 'yyyy');
    return format(new Date(), 'dd/MM/yyyy');
  };

  return (
    <div id="pdf-report-content" style={{ display: 'none' }}>
      <div style={{
        width: '1200px',
        padding: '40px 40px 80px 40px',
        backgroundColor: '#0A0F1C',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#fff' }}>
                Relatório Financeiro
              </h1>
              <p style={{ fontSize: '16px', color: '#9CA3AF', margin: 0 }}>
                {getPeriodLabel()}
              </p>
            </div>
            <div style={{
              padding: '12px 24px',
              borderRadius: '12px',
              backgroundColor: accountFilter === 'pessoal' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
              border: `1px solid ${accountFilter === 'pessoal' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
              fontSize: '14px',
              fontWeight: '600',
              color: accountFilter === 'pessoal' ? '#60A5FA' : '#C084FC'
            }}>
              {accountFilter === 'pessoal' ? '👤 Conta Pessoal' : '🏢 Conta PJ'}
            </div>
          </div>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#6B7280' }}>
            Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#fff' }}>
            Resumo do Período
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {/* Receitas */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#22C55E', fontSize: '18px' }}>↗</span>
                </div>
                <span style={{ fontSize: '14px', color: '#9CA3AF' }}>Total de Receitas</span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#22C55E' }}>
                {formatCurrency(stats.income)}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                {stats.incomeCount} transações registradas
              </p>
            </div>

            {/* Despesas */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#EF4444', fontSize: '18px' }}>↘</span>
                </div>
                <span style={{ fontSize: '14px', color: '#9CA3AF' }}>Total de Despesas</span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#EF4444' }}>
                {formatCurrency(stats.expenses)}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                {stats.expensesCount} transações registradas
              </p>
            </div>

            {/* Saldo */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#3B82F6', fontSize: '18px' }}>💰</span>
                </div>
                <span style={{ fontSize: '14px', color: '#9CA3AF' }}>Saldo do Período</span>
              </div>
              <p style={{
                fontSize: '32px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: stats.balance >= 0 ? '#22C55E' : '#EF4444'
              }}>
                {formatCurrency(stats.balance)}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                Taxa de economia: {stats.savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Evolution Table */}
        {evolutionData.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#fff' }}>
              Evolução Financeira
            </h2>
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      Período
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      Receitas
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      Despesas
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {evolutionData.slice(0, 10).map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#fff' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#22C55E', fontWeight: '600' }}>
                        {formatCurrency(item.Receitas)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#EF4444', fontWeight: '600' }}>
                        {formatCurrency(item.Despesas)}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: item.Saldo >= 0 ? '#22C55E' : '#EF4444'
                      }}>
                        {formatCurrency(item.Saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Analysis */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#fff' }}>
            Análise por Categoria
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Income Categories */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>
                Receitas por Categoria
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incomeCategories.slice(0, 8).map((cat, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: cat.color
                      }} />
                      <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{cat.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 2px 0' }}>
                        {formatCurrency(cat.value)}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                        {stats.income > 0 ? ((cat.value / stats.income) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Categories */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>
                Despesas por Categoria
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {expenseCategories.slice(0, 8).map((cat, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: cat.color
                      }} />
                      <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{cat.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 2px 0' }}>
                        {formatCurrency(cat.value)}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                        {stats.expenses > 0 ? ((cat.value / stats.expenses) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Expenses */}
        {topExpenses.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#fff' }}>
              Maiores Despesas
            </h2>
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topExpenses.map((expense, index) => (
                  <div key={expense.id} style={{
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                        {expense.descricao}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#EF4444' }}>
                        {formatCurrency(expense.valor)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        {format(new Date(expense.data), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        {expense.categoria?.descricao || 'Outros'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Forecast Section */}
        <div style={{ marginBottom: '40px', paddingTop: '40px', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#fff' }}>
            Previsão Financeira
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* A Receber */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '12px' }}>
                Total a Receber
              </div>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#22C55E' }}>
                {formatCurrency(forecastData.pendingIncome)}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                {forecastData.incomes.length} lançamentos pendentes
              </p>
            </div>

            {/* A Pagar */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '12px' }}>
                Total a Pagar
              </div>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#EF4444' }}>
                {formatCurrency(forecastData.pendingExpense)}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                {forecastData.expenses.length} lançamentos pendentes
              </p>
            </div>

            {/* Saldo Previsto */}
            <div style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '12px' }}>
                Saldo Previsto
              </div>
              <p style={{
                fontSize: '28px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: forecastData.projectedBalance >= 0 ? '#3B82F6' : '#EF4444'
              }}>
                {formatCurrency(forecastData.projectedBalance)}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                Saldo atual + pendentes
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '80px',
          paddingTop: '30px',
          paddingBottom: '20px',
          borderTop: '2px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          color: '#6B7280',
          fontSize: '12px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
            Este relatório foi gerado automaticamente pelo sistema GranaZap
          </p>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.7 }}>
            © {new Date().getFullYear()} GranaZap - Gestão Financeira Inteligente
          </p>
        </div>
      </div>
    </div>
  );
}
