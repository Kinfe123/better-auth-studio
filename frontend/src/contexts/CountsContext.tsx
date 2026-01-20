import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface Counts {
  users: number;
  organizations: number;
  sessions: number;
  teams?: number;
  events?: number;
}

interface CountsContextType {
  counts: Counts;
  loading: boolean;
  refetchCounts: () => Promise<void>;
}

const CountsContext = createContext<CountsContextType | undefined>(undefined);

interface CountsProviderProps {
  children: ReactNode;
}

export function CountsProvider({ children }: CountsProviderProps) {
  const [counts, setCounts] = useState<Counts>({
    users: 0,
    organizations: 0,
    sessions: 0,
    teams: 0,
    events: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/counts');
      const data = await response.json();
      setCounts(data);
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchCounts = useCallback(async () => {
    setLoading(true);
    await fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <CountsContext.Provider value={{ counts, loading, refetchCounts }}>
      {children}
    </CountsContext.Provider>
  );
}

export function useCounts() {
  const context = useContext(CountsContext);
  if (context === undefined) {
    throw new Error('useCounts must be used within a CountsProvider');
  }
  return context;
}
