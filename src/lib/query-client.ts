import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Dados sempre "frescos" - só atualiza manualmente
      gcTime: 1000 * 60 * 60 * 24, // 24 horas - tempo no cache (muito longo!)
      refetchOnWindowFocus: false, // Não recarrega ao voltar para a aba
      refetchOnMount: false, // Não recarrega ao montar se tem cache
      refetchOnReconnect: false, // Não recarrega ao reconectar
      retry: 1, // Tenta 1 vez se falhar
      retryDelay: 1000, // Espera 1s antes de tentar novamente
      networkMode: 'offlineFirst', // Usa cache primeiro, depois rede
      structuralSharing: true, // Compartilha estrutura de dados entre queries
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});
