"use client";

import { Modal } from "./modal";
import { FileSpreadsheet, Info } from "lucide-react";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isExporting: boolean;
}

export function ExportDataModal({ isOpen, onClose, onConfirm, isExporting }: ExportDataModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-6 py-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
            <FileSpreadsheet className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Exportar Dados?</h3>
          <p className="text-zinc-400 text-base">
            Você está prestes a baixar todos os seus dados financeiros.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-zinc-300">
              <p><strong>O arquivo Excel (.xlsx) incluirá 5 abas:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>📊 <strong>Receitas:</strong> Todas as receitas efetivadas</li>
                <li>📉 <strong>Despesas:</strong> Todas as despesas efetivadas</li>
                <li>📅 <strong>Lançamentos Futuros:</strong> Receitas e despesas agendadas</li>
                <li>🏦 <strong>Contas Bancárias:</strong> Saldos e informações das contas</li>
                <li>💳 <strong>Cartões de Crédito:</strong> Limites e informações dos cartões</li>
              </ul>
              <p className="mt-3 text-blue-400">
                <strong>💡 Dica:</strong> Abra no Excel ou Google Sheets para visualizar todas as abas organizadas!
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onConfirm}
            disabled={isExporting}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                Sim, Exportar Dados
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
