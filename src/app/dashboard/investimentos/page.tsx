"use client";

import { useState } from "react";
import { TrendingUp, Plus, PieChart, DollarSign, Wallet } from "lucide-react";
import { useInvestmentSummary } from "@/hooks/use-investment-summary";
import { useInvestments } from "@/hooks/use-investments";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useCurrency } from "@/contexts/currency-context";
import { useLanguage } from "@/contexts/language-context";
import { AddPositionModal } from "@/components/dashboard/investments/add-position-modal";
import { EditPositionModal } from "@/components/dashboard/investments/edit-position-modal";
import { DeletePositionModal } from "@/components/dashboard/investments/delete-position-modal";
import { AddDividendModal } from "@/components/dashboard/investments/add-dividend-modal";
import { InvestmentSuccessModal } from "@/components/dashboard/investments/success-modal";
import { InvestmentErrorModal } from "@/components/dashboard/investments/error-modal";
import { PositionCard } from "@/components/dashboard/investments/position-card";
import type { PositionDetailed } from "@/types/investments";

const ASSET_TYPE_COLORS: Record<string, string> = {
  acao: "bg-blue-500",
  fii: "bg-green-500",
  etf: "bg-purple-500",
  renda_fixa: "bg-yellow-500",
  cripto: "bg-orange-500",
  bdr: "bg-cyan-500",
};

export default function InvestimentosPage() {
  const { filter: accountFilter } = useAccountFilter();
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const { summary, byType, totalDividends, loading: loadingSummary } = useInvestmentSummary(accountFilter);
  const { positions, loading: loadingPositions, refetch } = useInvestments(accountFilter);

  // Function to get asset type label from translations
  const getAssetTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      acao: t('investments.assetTypes.stock'),
      fii: t('investments.assetTypes.fii'),
      etf: t('investments.assetTypes.etf'),
      renda_fixa: t('investments.assetTypes.fixedIncome'),
      cripto: t('investments.assetTypes.crypto'),
      bdr: t('investments.assetTypes.bdr'),
    };
    return typeMap[type] || type.replace('_', ' ');
  };

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [dividendModalOpen, setDividendModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const [selectedPosition, setSelectedPosition] = useState<PositionDetailed | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Novos estados para filtro e ordenação
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "value" | "profit">("name");

  const handleAddSuccess = () => {
    setAddModalOpen(false);
    setSuccessMessage(t('investments.success.added'));
    setSuccessModalOpen(true);
    refetch();
  };

  const handleEditClick = (position: PositionDetailed) => {
    setSelectedPosition(position);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSuccessMessage(t('investments.success.updated'));
    setSuccessModalOpen(true);
    refetch();
  };

  const handleDeleteClick = (position: PositionDetailed) => {
    setSelectedPosition(position);
    setDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSuccessMessage(t('investments.success.deleted'));
    setSuccessModalOpen(true);
    refetch();
  };

  const handleDividendClick = (position: PositionDetailed) => {
    setSelectedPosition(position);
    setDividendModalOpen(true);
  };

  const handleDividendSuccess = () => {
    setDividendModalOpen(false);
    setSuccessMessage(t('investments.success.dividendAdded'));
    setSuccessModalOpen(true);
    refetch();
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setErrorModalOpen(true);
  };

  // Filtrar e ordenar posições
  const filteredPositions = positions.filter((position) => {
    if (assetTypeFilter === "all") return true;
    return position.asset_type === assetTypeFilter;
  });

  const sortedPositions = [...filteredPositions].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.ticker.localeCompare(b.ticker);
      case "value":
        return b.valor_atual - a.valor_atual;
      case "profit":
        return b.lucro_prejuizo - a.lucro_prejuizo;
      default:
        return 0;
    }
  });

  const loading = loadingSummary || loadingPositions;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
          <div className="h-10 w-40 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#111827] border border-white/5 rounded-xl p-6 animate-pulse">
              <div className="h-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasPositions = positions.length > 0;
  const hasFilteredPositions = sortedPositions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{t('investments.title')}</h1>
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${accountFilter === "pj"
              ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
              }`}>
              {accountFilter === "pj" ? t('investments.accountPJ') : t('investments.accountPersonal')}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            {t('investments.subtitle')}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {t('investments.priceUpdate')}
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('investments.newPosition')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Investido */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-1">{t('investments.summary.investedValue')}</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(summary?.valor_investido || 0)}
          </p>
        </div>

        {/* Valor Atual */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-1">{t('investments.summary.currentValue')}</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(summary?.valor_atual || 0)}
          </p>
        </div>

        {/* Lucro/Prejuízo */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${(summary?.lucro_prejuizo || 0) >= 0
              ? 'bg-green-500/10'
              : 'bg-red-500/10'
              }`}>
              <TrendingUp className={`w-5 h-5 ${(summary?.lucro_prejuizo || 0) >= 0
                ? 'text-green-500'
                : 'text-red-500'
                }`} />
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-1">{t('investments.summary.profitLoss')}</p>
          <p className={`text-2xl font-bold ${(summary?.lucro_prejuizo || 0) >= 0
            ? 'text-green-500'
            : 'text-red-500'
            }`}>
            {formatCurrency(summary?.lucro_prejuizo || 0)}
          </p>
          <p className={`text-sm mt-1 ${(summary?.rentabilidade_percentual || 0) >= 0
            ? 'text-green-500'
            : 'text-red-500'
            }`}>
            {(summary?.rentabilidade_percentual || 0) >= 0 ? '+' : ''}
            {(summary?.rentabilidade_percentual || 0).toFixed(2)}%
          </p>
        </div>

        {/* Total Ativos */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <PieChart className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-1">{t('investments.summary.totalAssets')}</p>
          <p className="text-2xl font-bold text-white">
            {summary?.total_ativos || 0}
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            {t('investments.summary.dividends')}: {formatCurrency(totalDividends)}
          </p>
        </div>
      </div>

      {/* Distribuição por Tipo */}
      {byType.length > 0 && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t('investments.distribution.title')}
          </h2>
          <div className="space-y-3">
            {byType.map((item: any) => (
              <div key={item.type} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white font-medium">
                      {getAssetTypeLabel(item.type)}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {item.count} {item.count === 1 ? t('investments.distribution.asset') : t('investments.distribution.assets')}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${ASSET_TYPE_COLORS[item.type] || 'bg-blue-500'}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {formatCurrency(item.currentValue)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posições */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {t('investments.positions.title')}
          </h2>

          {/* Ordenação */}
          {hasPositions && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{t('investments.positions.sortBy')}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "value" | "profit")}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">{t('investments.positions.sortName')}</option>
                <option value="value">{t('investments.positions.sortValue')}</option>
                <option value="profit">{t('investments.positions.sortProfit')}</option>
              </select>
            </div>
          )}
        </div>

        {/* Filtros por tipo */}
        {hasPositions && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setAssetTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${assetTypeFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
            >
              {t('investments.positions.all')} ({positions.length})
            </button>
            {["acao", "fii", "etf", "renda_fixa", "cripto", "bdr"].map((type) => {
              const count = positions.filter((p) => p.asset_type === type).length;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setAssetTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${assetTypeFilter === type
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                >
                  {getAssetTypeLabel(type)} ({count})
                </button>
              );
            })}
          </div>
        )}

        {hasFilteredPositions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPositions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onAddDividend={handleDividendClick}
              />
            ))}
          </div>
        ) : hasPositions && !hasFilteredPositions ? (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
            <p className="text-zinc-400">
              {t('investments.emptyStates.noFilteredPositions')} <strong>{getAssetTypeLabel(assetTypeFilter)}</strong>.
            </p>
            <button
              onClick={() => setAssetTypeFilter("all")}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {t('investments.emptyStates.viewAll')}
            </button>
          </div>
        ) : (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
            <div className="max-w-lg mx-auto">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('investments.emptyStates.noPositions')}
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                {t('investments.emptyStates.subtitle')}
              </p>

              {/* Onboarding Tips */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6 text-left">
                <h4 className="text-sm font-semibold text-white mb-3">
                  {t('investments.emptyStates.whatToAdd')}
                </h4>
                <ul className="text-xs text-zinc-400 space-y-2">
                  <li>📈 <strong>{t('investments.assetDescriptions.stock')}</strong> {t('investments.assetDescriptions.stockExamples')}</li>
                  <li>🏢 <strong>{t('investments.assetDescriptions.fii')}</strong> {t('investments.assetDescriptions.fiiExamples')}</li>
                  <li>💰 <strong>{t('investments.assetDescriptions.fixedIncome')}</strong> {t('investments.assetDescriptions.fixedIncomeExamples')}</li>
                  <li>₿ <strong>{t('investments.assetDescriptions.crypto')}</strong> {t('investments.assetDescriptions.cryptoExamples')}</li>
                  <li>📊 <strong>{t('investments.assetDescriptions.etf')}</strong> {t('investments.assetDescriptions.etfExamples')}</li>
                  <li>🌎 <strong>{t('investments.assetDescriptions.bdr')}</strong> {t('investments.assetDescriptions.bdrExamples')}</li>
                </ul>
              </div>

              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('investments.emptyStates.addFirst')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPositionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        onError={handleError}
      />

      {selectedPosition && (
        <>
          <EditPositionModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedPosition(null);
            }}
            position={selectedPosition}
            onSuccess={handleEditSuccess}
            onError={handleError}
          />

          <DeletePositionModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedPosition(null);
            }}
            position={selectedPosition}
            onSuccess={handleDeleteSuccess}
            onError={handleError}
          />

          <AddDividendModal
            isOpen={dividendModalOpen}
            onClose={() => {
              setDividendModalOpen(false);
              setSelectedPosition(null);
            }}
            position={selectedPosition}
            onSuccess={handleDividendSuccess}
            onError={handleError}
          />
        </>
      )}

      <InvestmentSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message={successMessage}
      />

      <InvestmentErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
}
