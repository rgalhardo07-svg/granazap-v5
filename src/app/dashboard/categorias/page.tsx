"use client";

import dynamic from 'next/dynamic';

// Importar com SSR desabilitado para evitar hydration mismatch
const CategoriesPageDynamic = dynamic(
  () => import('@/components/dashboard/categories-page').then(m => ({ default: m.CategoriesPage })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-800/50 rounded" />
          <div className="h-4 w-32 bg-zinc-800/50 rounded" />
        </div>
      </div>
    )
  }
);

export default function CategoriasPage() {
  return <CategoriesPageDynamic />;
}
