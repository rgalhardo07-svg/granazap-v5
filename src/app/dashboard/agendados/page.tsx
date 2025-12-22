"use client";

import dynamic from "next/dynamic";

const FutureTransactionsPage = dynamic(
  () => import("@/components/dashboard/future-transactions-page").then(mod => ({ default: mod.FutureTransactionsPage })),
  { ssr: false }
);

export default function AgendadosPage() {
  return <FutureTransactionsPage />;
}
