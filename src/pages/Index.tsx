
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSelector from '@/components/AppSelector';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { NewUserAppSelectionModal } from '@/components/NewUserAppSelectionModal';
import { useQueryClient } from '@tanstack/react-query';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, isLoading } = useAppSettings();
  const queryClient = useQueryClient();

  // Show modal if user is logged in and has no app preferences set yet
  // We detect "new user" by checking if the query returned empty data
  const prefsQueryData = queryClient.getQueryData(['user-app-preferences', user?.id]);
  const isNewUser = user && !isLoading && Array.isArray(prefsQueryData) && prefsQueryData.length === 0;
  const [showFirstTimeModal, setShowFirstTimeModal] = useState<boolean | null>(null);

  // Initialize modal state once we know the user status
  React.useEffect(() => {
    if (isNewUser && showFirstTimeModal === null) {
      setShowFirstTimeModal(true);
    }
  }, [isNewUser, showFirstTimeModal]);

  const handleModalClose = () => {
    setShowFirstTimeModal(false);
    queryClient.invalidateQueries({ queryKey: ['user-app-preferences', user?.id] });
  };

  const handleAppSelect = (appId: string) => {
    if (appId !== 'prediction') return;

    if (user) {
      if (settings.enabledApps.prediction) {
        navigate('/prediction');
      }
      return;
    }

    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <AppSelector onAppSelect={handleAppSelect} />
      {showFirstTimeModal && (
        <NewUserAppSelectionModal open={true} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default Index;
