"use client";

import { useEffect, useState } from "react";

export type PeriodFilter = "day" | "week" | "month" | "year" | "custom";

interface CustomDateRange {
  start: string;
  end: string;
}

export function usePeriodFilter() {
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [customRange, setCustomRange] = useState<CustomDateRange | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Carregar período do localStorage
    const saved = localStorage.getItem('period_filter') as PeriodFilter;
    if (saved && ['day', 'week', 'month', 'year', 'custom'].includes(saved)) {
      setPeriod(saved);
    } else {
      // Se não tem salvo, definir como 'month' por padrão
      setPeriod('month');
      localStorage.setItem('period_filter', 'month');
    }
    
    // Carregar range customizado se existir
    const savedRange = localStorage.getItem('custom_date_range');
    if (savedRange) {
      try {
        setCustomRange(JSON.parse(savedRange));
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    setIsInitialized(true);

    // Listener para mudanças no período
    const handlePeriodChange = (event: CustomEvent<PeriodFilter>) => {
      setPeriod(event.detail);
    };

    const handleCustomRangeChange = (event: CustomEvent<CustomDateRange>) => {
      setCustomRange(event.detail);
    };

    window.addEventListener('periodFilterChange', handlePeriodChange as EventListener);
    window.addEventListener('customRangeChange', handleCustomRangeChange as EventListener);

    return () => {
      window.removeEventListener('periodFilterChange', handlePeriodChange as EventListener);
      window.removeEventListener('customRangeChange', handleCustomRangeChange as EventListener);
    };
  }, []);

  const changePeriod = (newPeriod: PeriodFilter) => {
    setPeriod(newPeriod);
    localStorage.setItem('period_filter', newPeriod);
    window.dispatchEvent(new CustomEvent('periodFilterChange', { detail: newPeriod }));
  };

  const setCustomDateRange = (range: CustomDateRange) => {
    setCustomRange(range);
    localStorage.setItem('custom_date_range', JSON.stringify(range));
    setPeriod('custom');
    localStorage.setItem('period_filter', 'custom');
    window.dispatchEvent(new CustomEvent('customRangeChange', { detail: range }));
    window.dispatchEvent(new CustomEvent('periodFilterChange', { detail: 'custom' }));
  };

  return {
    period,
    customRange,
    changePeriod,
    setCustomDateRange,
    isInitialized,
  };
}
