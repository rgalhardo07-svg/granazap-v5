"use client";

import { useAccountFilterContext } from "@/contexts/account-filter-context";

export type { AccountFilter } from "@/contexts/account-filter-context";

export function useAccountFilter() {
  return useAccountFilterContext();
}
