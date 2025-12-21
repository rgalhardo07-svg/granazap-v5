"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useInvestments } from "@/hooks/use-investments";
import { useInvestmentAssets } from "@/hooks/use-investment-assets";
import { useAccounts } from "@/hooks/use-accounts";
import { useAccountFilter } from "@/hooks/use-account-filter";
import { useCurrency } from "@/contexts/currency-context";
import { useLanguage } from "@/contexts/language-context";
import type { AssetType } from "@/types/investments";

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const ASSET_TYPES: { value: AssetType; label: string; description: string }[] = [
  { value: "acao", label: "Ação", description: "Ex: PETR4, VALE3, ITUB4" },
  { value: "fii", label: "FII (Fundo Imobiliário)", description: "Ex: MXRF11, HGLG11, KNRI11" },
  { value: "etf", label: "ETF (Fundo de Índice)", description: "Ex: BOVA11, IVVB11, SMAL11" },
  { value: "renda_fixa", label: "Renda Fixa", description: "Ex: CDB, Tesouro Direto, Caixinha Nubank" },
  { value: "cripto", label: "Criptomoeda", description: "Ex: BTC-BRL, ETH-BRL, SOL-BRL" },
  { value: "bdr", label: "BDR (Brazilian Depositary Receipt)", description: "Ex: AAPL34, MSFT34, GOGL34" },
];

// Tickers populares para autocomplete
const POPULAR_TICKERS: Record<AssetType, string[]> = {
  acao: [
    "PETR4", "VALE3", "ITUB4", "BBDC4", "BBAS3", "ABEV3", "WEGE3", "RENT3", "MGLU3", "B3SA3",
    "ELET3", "BPAC11", "SUZB3", "JBSS3", "RADL3", "PRIO3", "RDOR3", "CSAN3", "GGBR4", "HAPV3",
    "VBBR3", "RAIL3", "EQTL3", "LREN3", "ENEV3", "CMIG4", "UGPA3", "VIVT3", "CPLE6", "TIMS3"
  ],
  fii: [
    "MXRF11", "HGLG11", "KNRI11", "XPLG11", "VISC11", "BTLG11", "XPML11", "KNCR11", "PVBI11",
    "GGRC11", "HGRU11", "IRDM11", "BCFF11", "VGHF11", "CPTS11", "RECR11", "TRXF11", "ALZR11",
    "BRCO11", "MALL11", "LVBI11", "HGBS11", "HGLG11", "KNSC11", "TGAR11", "VILG11", "JSRE11",
    "RBRR11", "HGCR11", "DEVA11"
  ],
  etf: [
    "BOVA11", "IVVB11", "SMAL11", "DIVO11", "HASH11", "PIBB11", "MATB11", "FIND11", "SPXI11",
    "GOVE11", "XINA11", "NASD11", "GOLD11", "BRED11", "EURP11", "TECK11", "TRIG11", "XFIX11",
    "USTK11", "WRLD11"
  ],
  renda_fixa: ["CDB", "LCI", "LCA", "TESOURO-SELIC", "TESOURO-IPCA", "TESOURO-PREFIXADO", "CAIXINHA-NUBANK", "CRI", "CRA", "DEBENTURE"],
  cripto: [
    "BTC-BRL", "ETH-BRL", "SOL-BRL", "USDT-BRL", "BNB-BRL", "XRP-BRL", "ADA-BRL", "DOGE-BRL",
    "MATIC-BRL", "DOT-BRL", "LINK-BRL", "LTC-BRL", "BCH-BRL", "UNI-BRL", "XLM-BRL", "AVAX-BRL"
  ],
  bdr: [
    "AAPL34", "MSFT34", "GOGL34", "AMZO34", "TSLA34", "META34", "NVDC34", "NFLX34", "DISB34", "VISA34",
    "COCA34", "PETR34", "NIKE34", "STNE34", "BABA34", "MELI34", "PFE34", "JNJ34", "WMT34", "MBLY34"
  ],
};

export function AddPositionModal({ isOpen, onClose, onSuccess, onError }: AddPositionModalProps) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { filter: accountFilter } = useAccountFilter();
  const { createPosition } = useInvestments(accountFilter);
  const { assets, searchAssets, createAsset } = useInvestmentAssets();
  const { accounts } = useAccounts(accountFilter);

  const [step, setStep] = useState<"search" | "form">("search");
  const [searchTicker, setSearchTicker] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetType, setAssetType] = useState<AssetType>("acao");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const [quantidade, setQuantidade] = useState("");
  const [precoMedio, setPrecoMedio] = useState("");
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split("T")[0]);
  const [contaId, setContaId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [yieldPercentage, setYieldPercentage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTickerChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setSearchTicker(upperValue);

    // Filtrar sugestões
    if (upperValue.length > 0) {
      const popularSuggestions = POPULAR_TICKERS[assetType].filter(ticker =>
        ticker.includes(upperValue)
      );

      // Também buscar nos ativos já cadastrados no banco
      const dbSuggestions = assets
        .filter(a => a.type === assetType && a.ticker.includes(upperValue))
        .map(a => a.ticker);

      // Combinar e remover duplicatas
      const allSuggestions = Array.from(new Set([...popularSuggestions, ...dbSuggestions])).slice(0, 10);

      setFilteredSuggestions(allSuggestions);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions(POPULAR_TICKERS[assetType]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (ticker: string) => {
    setSearchTicker(ticker);
    setShowSuggestions(false);
    handleSearch(ticker);
  };

  const handleSearch = async (ticker?: string) => {
    const tickerToSearch = ticker || searchTicker;
    if (!tickerToSearch.trim()) return;

    setLoading(true);
    setShowSuggestions(false);
    try {
      const foundAsset = await searchAssets(tickerToSearch.toUpperCase().trim());

      // Se encontrou, selecionar
      if (foundAsset) {
        setSelectedAsset(foundAsset);
        setStep("form");
      } else {
        // Não encontrou, definir fonte baseada no tipo
        const source = assetType === 'cripto' ? 'binance' :
          ['acao', 'fii', 'etf'].includes(assetType) ? 'brapi' : 'manual';

        setSelectedAsset({
          ticker: tickerToSearch.toUpperCase().trim(),
          name: null,
          type: assetType,
          source: source,
        });
        setStep("form");
      }
    } catch (error: any) {
      onError(error.message || t('validation.errorFetchingAsset'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAsset || !quantidade || precoMedio === "") {
      onError(t('validation.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      // Se o ativo não existe, criar primeiro
      let assetId = selectedAsset.id;
      if (!assetId) {
        const newAsset = await createAsset({
          ticker: selectedAsset.ticker,
          name: selectedAsset.name || selectedAsset.ticker,
          type: assetType,
          source: selectedAsset.source || "manual",
        });
        assetId = newAsset.id;
      }

      // Criar posição
      await createPosition({
        asset_id: assetId,
        quantidade: Number(quantidade),
        preco_medio: Number(precoMedio),
        data_compra: dataCompra,
        tipo_conta: accountFilter,
        conta_id: contaId || undefined,
        observacao: observacao || undefined,
        is_manual_price: false,
        manual_price: undefined,
        yield_percentage: assetType === "renda_fixa" && yieldPercentage ? Number(yieldPercentage) : undefined,
      });

      handleClose();
      onSuccess();
    } catch (error: any) {
      onError(error.message || t('validation.errorAddingPosition'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("search");
    setSearchTicker("");
    setSelectedAsset(null);
    setQuantidade("");
    setPrecoMedio("");
    setDataCompra(new Date().toISOString().split("T")[0]);
    setContaId("");
    setObservacao("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "search" ? t('investments.modal.searchAsset') : t('investments.modal.newPosition')}
      className="max-w-lg"
    >
      {step === "search" ? (
        <div className="space-y-4">
          {/* Onboarding Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">
              {t('investments.modal.howWorks')}
            </h4>
            <ul className="text-xs text-zinc-300 space-y-1">
              <li>{t('investments.modal.step1')}</li>
              <li>{t('investments.modal.step2')}</li>
              <li>{t('investments.modal.step3')}</li>
              <li>{t('investments.modal.step4')}</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.assetType')}
            </label>
            <select
              value={assetType}
              onChange={(e) => {
                const newType = e.target.value as AssetType;
                setAssetType(newType);
                setSearchTicker("");
                setFilteredSuggestions(POPULAR_TICKERS[newType]);
              }}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ASSET_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">
              {ASSET_TYPES.find(t => t.value === assetType)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.tickerCode')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTicker}
                onChange={(e) => handleTickerChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={t('investments.modal.tickerPlaceholder')}
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => handleSearch()}
                disabled={loading || !searchTicker.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-zinc-500">
                💡 <strong>{t('investments.modal.tipStrong')}</strong> {t('investments.modal.tipText')}
              </p>
              {assetType === "renda_fixa" && (
                <p className="text-xs text-blue-400">
                  {t('investments.modal.fixedIncomeInfo')}
                </p>
              )}
            </div>
          </div>

          {/* Suggestions List - Separate Section */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="border-t border-zinc-700 pt-4 -mx-6 px-6">
              <p className="text-xs font-semibold text-zinc-400 mb-3">
                {t('investments.modal.popularSuggestions')}
              </p>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                {filteredSuggestions.slice(0, 15).map((ticker) => (
                  <button
                    key={ticker}
                    type="button"
                    onClick={() => handleSelectSuggestion(ticker)}
                    className="w-full px-4 py-3 text-left text-white bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 transition-colors rounded-lg flex items-center justify-between gap-3"
                  >
                    <span className="font-semibold text-sm">{ticker}</span>
                    <span className="text-xs text-zinc-500">{t('investments.modal.select')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Badge */}
          <div className={`px-4 py-2 rounded-lg border ${accountFilter === "pj"
            ? "bg-purple-500/10 border-purple-500/20"
            : "bg-blue-500/10 border-blue-500/20"
            }`}>
            <p className="text-sm text-center">
              <span className="text-zinc-400">{t('investments.modal.addingTo')} </span>
              <span className={`font-semibold ${accountFilter === "pj" ? "text-purple-400" : "text-blue-400"
                }`}>
                {accountFilter === "pj" ? t('investments.modal.companyAccount') : t('investments.modal.personalAccount')}
              </span>
            </p>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-white">{selectedAsset.ticker}</p>
                {selectedAsset.name && (
                  <p className="text-sm text-zinc-400">{selectedAsset.name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep("search")}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {t('investments.modal.change')}
              </button>
            </div>
          </div>

          {/* Help Banner for Renda Fixa */}
          {assetType === "renda_fixa" && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-yellow-400 mb-1">
                {t('investments.modal.fixedIncomeHelp')}
              </p>
              <ul className="text-xs text-zinc-300 space-y-1">
                <li>• <strong>{t('investments.modal.quantityLabel')}</strong> {t('investments.modal.quantityHelp')}</li>
                <li>• <strong>{t('investments.modal.avgPriceLabel')}</strong> {t('investments.modal.avgPriceHelp')}</li>
                <li>• <strong>{t('investments.modal.yieldLabel')}</strong> {t('investments.modal.yieldHelp')}</li>
                <li>• <strong>{t('investments.modal.exampleLabel')}</strong> {t('investments.modal.exampleText')}</li>
              </ul>
            </div>
          )}

          {/* Yield Percentage for Renda Fixa */}
          {assetType === "renda_fixa" && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('investments.modal.yieldPercentage')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={yieldPercentage}
                  onChange={(e) => setYieldPercentage(e.target.value)}
                  placeholder="Ex: 100"
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-zinc-400 text-sm">{t('investments.modal.cdiSuffix')}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {t('investments.modal.yieldNote')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('investments.modal.quantity')}
              </label>
              <input
                type="number"
                step="0.00000001"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
                placeholder={assetType === "renda_fixa" ? t('investments.modal.quantityPlaceholderFixed') : t('investments.modal.quantityPlaceholderStock')}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                {assetType === "renda_fixa"
                  ? t('investments.modal.quantityNoteFixed')
                  : t('investments.modal.quantityNoteStock')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('investments.modal.avgPrice')}
              </label>
              <input
                type="number"
                step="0.01"
                value={precoMedio}
                onChange={(e) => setPrecoMedio(e.target.value)}
                required
                placeholder={assetType === "renda_fixa" ? t('investments.modal.avgPricePlaceholderFixed') : t('investments.modal.avgPricePlaceholderStock')}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                {assetType === "renda_fixa"
                  ? t('investments.modal.avgPriceNoteFixed')
                  : t('investments.modal.avgPriceNoteStock')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.purchaseDate')}
            </label>
            <input
              type="date"
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {accounts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('investments.modal.account')}
              </label>
              <select
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('investments.modal.noAccountLinked')}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('investments.modal.observation')}
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={t('investments.modal.observationPlaceholder')}
            />
          </div>

          {quantidade && precoMedio && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">{t('investments.modal.totalInvested')}</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(Number(quantidade) * Number(precoMedio))}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? t('investments.modal.adding') : t('investments.modal.addPosition')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
