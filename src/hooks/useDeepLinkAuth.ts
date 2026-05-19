import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export const useDeepLinkAuth = () => {
  const navigate = useNavigate();

  const handleDeepLink = useCallback(async (url: string) => {
    console.log('Deep link received:', url);

    try {
      const urlObj = new URL(url);
      
      // Handle OAuth callback (yourappname://auth or yourappname://callback)
      if (urlObj.pathname.includes('auth') || urlObj.pathname.includes('callback')) {
        const hashParams = new URLSearchParams(urlObj.hash.substring(1));
        const queryParams = new URLSearchParams(urlObj.search);
        
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

        if (errorDescription) {
          console.error('OAuth error:', errorDescription);
          navigate('/login?error=' + encodeURIComponent(errorDescription));
          return;
        }

        if (accessToken && refreshToken) {
          console.log('Setting session from deep link tokens');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session from deep link:', error);
            navigate('/login?error=' + encodeURIComponent(error.message));
          } else if (data.session) {
            console.log('Session set successfully from deep link');
            navigate('/');
          }
        }
        return;
      }

      // Handle other deep links (navigation)
      const path = urlObj.pathname;
      if (path && path !== '/') {
        navigate(path);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }, [navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let mounted = true;

    const setupDeepLinkListener = async () => {
      // Handle app opened via deep link
      const urlListener = await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        if (mounted) {
          handleDeepLink(event.url);
        }
      });

      // Check if app was launched with a URL
      const launchUrl = await App.getLaunchUrl();
      if (launchUrl && launchUrl.url && mounted) {
        handleDeepLink(launchUrl.url);
      }

      return () => {
        urlListener.remove();
      };
    };

    setupDeepLinkListener();

    return () => {
      mounted = false;
    };
  }, [handleDeepLink]);

  return { handleDeepLink };
};
