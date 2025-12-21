"use client";

import dynamic from "next/dynamic";

const AllTransactionsPage = dynamic(
  () => import("@/components/dashboard/all-transactions-page").then(mod => ({ default: mod.AllTransactionsPage })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-800 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-800 rounded-xl h-24"></div>
          <div className="bg-zinc-800 rounded-xl h-24"></div>
          <div className="bg-zinc-800 rounded-xl h-24"></div>
        </div>
        <div className="bg-zinc-800 rounded-xl h-96"></div>
      </div>
    ),
  }
);

export default function TransacoesPage() {
  return <AllTransactionsPage />;
}
