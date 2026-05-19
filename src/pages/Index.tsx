
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
    // When user is not logged in, show all apps but redirect to login for protected routes
    switch (appId) {
      case 'tv-shows':
        if (user) {
          if (settings.enabledApps.tvShows) {
            navigate('/tv-shows');
          }
        } else {
          navigate('/login');
        }
        break;
      case 'finance':
        if (user) {
          if (settings.enabledApps.finance) {
            navigate('/finance');
          }
        } else {
          navigate('/login');
        }
        break;
      case 'movies':
        if (user) {
          if (settings.enabledApps.movies) {
            navigate('/movies');
          }
        } else {
          navigate('/login');
        }
        break;
      case 'settlebill':
        if (user) {
          if (settings.enabledApps.settlebill) {
            navigate('/settlebill');
          }
        } else {
          navigate('/login');
        }
        break;
      case 'household':
        if (user) {
          if (settings.enabledApps.household) {
            navigate('/household');
          }
        } else {
          navigate('/login');
        }
        break;
      case 'inventory':
        if (user) {
          if (settings.enabledApps.inventory) {
            navigate('/inventory');
          }
        } else {
          navigate('/login');
        }
        break;
      case 'images':
        if (user) {
          if (settings.enabledApps.images) {
            navigate('/images');
          }
        } else {
          navigate('/login');
        }
        break;
      case 'prediction':
        if (user) { if (settings.enabledApps.prediction) navigate('/prediction'); }
        else navigate('/login');
        break;
      case 'qa':
        if (user) {
          navigate('/qa');
        } else {
          navigate('/login');
        }
        break;
      case 'public':
        if (user ? settings.enabledApps.public : true) {
          navigate('/public/shows');
        }
        break;
      case 'admin':
        if (user && settings.enabledApps.admin) {
          navigate('/admin');
        } else if (!user) {
          navigate('/login');
        }
        break;
      default:
        console.log('Unknown app selected:', appId);
    }
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
