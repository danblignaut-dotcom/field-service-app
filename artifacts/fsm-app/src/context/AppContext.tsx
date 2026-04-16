import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '@workspace/api-client-react/src/generated/api.schemas';

interface AppContextType {
  tenantId: number;
  user: Partial<User> | null;
  login: (role: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Partial<User> | null>(null);

  // Hardcode tenantId=1 for demo purposes
  const tenantId = 1;

  const login = (role: string) => {
    setUser({
      id: 1,
      tenantId,
      name: `Demo ${role.replace('_', ' ')}`,
      email: `${role}@demo.com`,
      role,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ tenantId, user, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
