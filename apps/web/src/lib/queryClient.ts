import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client with sensible defaults.
 * - 5 minute stale time to reduce unnecessary refetches
 * - Single retry on failure
 * - No refetch on window focus (avoids jarring UX)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
