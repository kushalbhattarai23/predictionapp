import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const RedirectIfAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RedirectIfAuth;
