
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
