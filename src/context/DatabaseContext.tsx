'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DatabaseConfig {
  connectionString: string;
}

interface DatabaseContextType {
  config: DatabaseConfig | null;
  setConfig: (config: DatabaseConfig) => void;
  clearConfig: () => void;
  isConfigured: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const STORAGE_KEY = 'rdb-view-db-config';

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<DatabaseConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setConfigState(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setConfig = (newConfig: DatabaseConfig) => {
    setConfigState(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  const clearConfig = () => {
    setConfigState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!mounted) {
    return null;
  }

  return (
    <DatabaseContext.Provider
      value={{
        config,
        setConfig,
        clearConfig,
        isConfigured: !!config?.connectionString,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
