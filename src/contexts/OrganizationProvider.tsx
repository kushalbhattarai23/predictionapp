
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  isPersonalMode: boolean;
  setCurrentOrganization: (org: Organization | null) => void;
  togglePersonalMode: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganizationContext = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    // Return a default context for non-organizational features
    return {
      currentOrganization: null,
      isPersonalMode: true,
      setCurrentOrganization: () => {},
      togglePersonalMode: () => {}
    };
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isPersonalMode, setIsPersonalMode] = useState(true);

  const togglePersonalMode = () => {
    setIsPersonalMode(!isPersonalMode);
    if (!isPersonalMode) {
      setCurrentOrganization(null);
    }
  };

  // Updated setCurrentOrganization to properly handle organization switching
  const handleSetCurrentOrganization = (org: Organization | null) => {
    setCurrentOrganization(org);
    setIsPersonalMode(org === null);
  };

  useEffect(() => {
    // Reset to personal mode when user changes
    if (!user) {
      setIsPersonalMode(true);
      setCurrentOrganization(null);
    }
  }, [user]);

  const value = {
    currentOrganization,
    isPersonalMode,
    setCurrentOrganization: handleSetCurrentOrganization,
    togglePersonalMode
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
