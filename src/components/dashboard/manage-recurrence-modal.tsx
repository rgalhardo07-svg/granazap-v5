"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format, addMonths, addDays, addWeeks, parseISO } from "date-fns";
import { useLanguage } from "@/contexts/language-context";

interface ManageRecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: any;
}

export function ManageRecurrenceModal({
  isOpen,
  onClose,
  onSuccess,
  transaction
}: ManageRecurrenceModalProps) {
  const { t } = useLanguage();
  const [periodicidade, setPeriodicidade] = useState('mensal');
  const [dataFinal, setDataFinal] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [impactMessage, setImpactMessage] = useState('');
  const [impactType, setImpactType] = useState<'add' | 'remove' | 'none'>('none');

  useEffect(() => {
    if (transaction) {
      setPeriodicidade(transaction.periodicidade || 'mensal');
      setDataFinal(transaction.data_final || '');
    }
  }, [transaction]);

  const generateRecurrentDates = (startDate: string, endDate: string, period: string) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      
      switch (period) {
        case 'diario':
          currentDate = addDays(currentDate, 1);
          break;
        case 'semanal':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'quinzenal':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'mensal':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'bimestral':
          currentDate = addMonths(currentDate, 2);
          break;
        case 'trimestral':
          currentDate = addMonths(currentDate, 3);
          break;
        case 'semestral':
          currentDate = addMonths(currentDate, 6);
          break;
        case 'anual':
          currentDate = addMonths(currentDate, 12);
          break;
        default:
          currentDate = addMonths(currentDate, 1);
      }
    }

    return dates;
  };

  const calculateImpact = async () => {
    if (!transaction || !dataFinal) return;

    try {
      const supabase = createClient();
      
      // Buscar lançamentos existentes desta recorrência
      const { data: existingTransactions } = await supabase
        .from('lancamentos_futuros')
        .select('data_prevista')
        .eq('usuario_id', transaction.usuario_id)
        .eq('recorrente', true)
        .eq('periodicidade', transaction.periodicidade)
        .gte('data_prevista', transaction.data_prevista)
        .eq('tipo', transaction.tipo)
        .eq('categoria_id', transaction.categoria_id)
        .order('data_prevista');

      if (!existingTransactions) return;

      const existingDates = existingTransactions.map(t => t.data_prevista);
      
      // Encontrar a última data existente
      const ultimaDataExistente = existingDates.length > 0 
        ? existingDates[existingDates.length - 1] 
        : transaction.data_prevista;

      // Calcular quantos lançamentos serão criados a partir da última data
      const proximaData = addMonths(parseISO(ultimaDataExistente + 'T12:00:00'), 1);
      const dataFinalDate = parseISO(dataFinal + 'T12:00:00');
      
      const datesToAdd = [];
      let currentDate = proximaData;
      
      while (currentDate <= dataFinalDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (!existingDates.includes(dateStr)) {
          datesToAdd.push(dateStr);
        }
        
        switch (periodicidade) {
          case 'diario':
            currentDate = addDays(currentDate, 1);
            break;
          case 'semanal':
            currentDate = addWeeks(currentDate, 1);
            break;
          case 'quinzenal':
            currentDate = addWeeks(currentDate, 2);
            break;
          case 'mensal':
            currentDate = addMonths(currentDate, 1);
            break;
          case 'bimestral':
            currentDate = addMonths(currentDate, 2);
            break;
          case 'trimestral':
            currentDate = addMonths(currentDate, 3);
            break;
          case 'semestral':
            currentDate = addMonths(currentDate, 6);
            break;
          case 'anual':
            currentDate = addMonths(currentDate, 12);
            break;
          default:
            currentDate = addMonths(currentDate, 1);
        }
      }
      
      // Calcular quantos serão removidos (após a data final)
      const datesToRemove = existingDates.filter(d => d > dataFinal);

      if (datesToAdd.length > 0) {
        setImpactType('add');
        setImpactMessage(`Serão criados ${datesToAdd.length} novos lançamentos até ${format(parseISO(dataFinal + 'T12:00:00'), 'dd/MM/yyyy')}.`);
        setShowConfirmation(true);
      } else if (datesToRemove.length > 0) {
        setImpactType('remove');
        setImpactMessage(`Serão removidos ${datesToRemove.length} lançamentos após ${format(parseISO(dataFinal + 'T12:00:00'), 'dd/MM/yyyy')}.`);
        setShowConfirmation(true);
      } else {
        // Sem mudanças significativas, atualizar direto
        await performUpdate();
      }
    } catch (error) {
      // Silenciosamente ignora erro no cálculo de impacto
    }
  };

  const performUpdate = async () => {
    if (!transaction || !dataFinal) {
      alert('Preencha a data final');
      return;
    }

    setUpdating(true);
    setShowConfirmation(false);
    
    try {
      const supabase = createClient();

      // Buscar lançamentos existentes
      const { data: existingTransactions } = await supabase
        .from('lancamentos_futuros')
        .select('*')
        .eq('usuario_id', transaction.usuario_id)
        .eq('recorrente', true)
        .eq('periodicidade', transaction.periodicidade)
        .gte('data_prevista', transaction.data_prevista)
        .eq('tipo', transaction.tipo)
        .eq('categoria_id', transaction.categoria_id)
        .order('data_prevista');

      if (!existingTransactions) throw new Error('Erro ao buscar lançamentos');

      const existingDates = existingTransactions.map(t => t.data_prevista);
      
      // Encontrar a última data existente
      const ultimaDataExistente = existingDates.length > 0 
        ? existingDates[existingDates.length - 1] 
        : transaction.data_prevista;

      // Gerar datas esperadas a partir da próxima data após a última existente
      const proximaData = addMonths(parseISO(ultimaDataExistente + 'T12:00:00'), 1);
      const dataFinalDate = parseISO(dataFinal + 'T12:00:00');
      
      // Gerar apenas datas futuras que ainda não existem
      const datesToAdd = [];
      let currentDate = proximaData;
      
      while (currentDate <= dataFinalDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (!existingDates.includes(dateStr)) {
          datesToAdd.push(dateStr);
        }
        
        switch (periodicidade) {
          case 'diario':
            currentDate = addDays(currentDate, 1);
            break;
          case 'semanal':
            currentDate = addWeeks(currentDate, 1);
            break;
          case 'quinzenal':
            currentDate = addWeeks(currentDate, 2);
            break;
          case 'mensal':
            currentDate = addMonths(currentDate, 1);
            break;
          case 'bimestral':
            currentDate = addMonths(currentDate, 2);
            break;
          case 'trimestral':
            currentDate = addMonths(currentDate, 3);
            break;
          case 'semestral':
            currentDate = addMonths(currentDate, 6);
            break;
          case 'anual':
            currentDate = addMonths(currentDate, 12);
            break;
          default:
            currentDate = addMonths(currentDate, 1);
        }
      }
      
      // Datas para remover (lançamentos após a nova data final)
      const datesToRemove = existingDates.filter(d => d > dataFinal);

      // Criar novos lançamentos
      if (datesToAdd.length > 0) {
        const newTransactions = datesToAdd.map(date => ({
          usuario_id: transaction.usuario_id,
          tipo: transaction.tipo,
          valor: transaction.valor,
          descricao: transaction.descricao,
          categoria_id: transaction.categoria_id,
          data_prevista: date,
          recorrente: true,
          periodicidade,
          data_final: dataFinal,
          status: 'pendente',
          pagador_recebedor: transaction.pagador_recebedor,
          tipo_conta: transaction.tipo_conta,
        }));

        const { error: insertError } = await supabase
          .from('lancamentos_futuros')
          .insert(newTransactions);

        if (insertError) throw insertError;
      }

      // Remover lançamentos excedentes
      if (datesToRemove.length > 0) {
        const idsToRemove = existingTransactions
          .filter(t => datesToRemove.includes(t.data_prevista))
          .map(t => t.id);

        const { error: deleteError } = await supabase
          .from('lancamentos_futuros')
          .delete()
          .in('id', idsToRemove);

        if (deleteError) throw deleteError;
      }

      // Atualizar lançamentos existentes com nova periodicidade e data final
      const { error: updateError } = await supabase
        .from('lancamentos_futuros')
        .update({
          periodicidade,
          data_final: dataFinal,
        })
        .eq('usuario_id', transaction.usuario_id)
        .eq('recorrente', true)
        .gte('data_prevista', transaction.data_prevista)
        .eq('tipo', transaction.tipo)
        .eq('categoria_id', transaction.categoria_id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (error) {
      alert('Erro ao atualizar. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdate = () => {
    calculateImpact();
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('future.manageRecurrence')}
      className="max-w-md max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-4">
        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {impactType === 'add' ? (
                <Plus className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-2">
                  {impactType === 'add' ? '➕ ' + t('common.add') : '🗑️ ' + t('common.delete')}
                </p>
                <p className="text-sm text-zinc-300 mb-3">{impactMessage}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 text-sm"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={performUpdate}
                    disabled={updating}
                    className={`px-4 py-2 text-white font-medium text-sm ${
                      impactType === 'add' 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t('common.confirm')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert */}
        {!showConfirmation && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              <span className="font-semibold">ℹ️ Informação:</span> Ao alterar a data final ou periodicidade, o sistema irá automaticamente criar ou remover lançamentos futuros conforme necessário. A recorrência irá até a data final definida.
            </p>
          </div>
        )}

        {/* Current Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-blue-400">
                  📋 {transaction.descricao}
                </p>
                {transaction.tipo_conta === 'pj' ? (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30 font-medium">
                    💼 PJ
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/30 font-medium">
                    👤 Pessoal
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-400/80">
                Data inicial: {format(new Date(transaction.data_prevista), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-white">{t('common.description')}</label>
            <Input
              value={transaction.descricao}
              disabled
              className="mt-1 bg-[#0A0F1C] border-white/10 text-zinc-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white">
              🔄 Periodicidade
            </label>
            <select
              value={periodicidade}
              onChange={(e) => setPeriodicidade(e.target.value)}
              className="mt-1 w-full h-10 px-3 bg-[#0A0F1C] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#22C55E]"
            >
              <option value="diario">{t('common.daily')}</option>
              <option value="semanal">{t('common.weekly')}</option>
              <option value="quinzenal">{t('common.biweekly')}</option>
              <option value="mensal">{t('common.monthly')}</option>
              <option value="bimestral">{t('common.bimonthly')}</option>
              <option value="trimestral">{t('common.quarterly')}</option>
              <option value="semestral">{t('common.semiannual')}</option>
              <option value="anual">{t('common.annual')}</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white">
              📅 Data Final <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="mt-1 w-full h-10 px-3 bg-[#0A0F1C] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
              style={{ colorScheme: 'dark' }}
            />
            <p className="text-xs text-zinc-500 mt-1">
              Defina até quando o lançamento deve se repetir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
          <Button
            onClick={onClose}
            disabled={updating}
            className="px-6 bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updating || !dataFinal}
            className="px-6 bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium"
          >
            {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('common.update')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
