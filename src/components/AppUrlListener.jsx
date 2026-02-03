import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

const AppUrlListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AppUrlListener mounted');
    const handleUrlOpen = (data) => {
      console.log('App URL opened:', data.url);
      try {
        const url = new URL(data.url);
        // Handle both https://domain/u/id and custom schemes if you add them later
        if (url.pathname.startsWith('/u/')) {
          const path = url.pathname + url.search + url.hash;
          console.log('Navigating to:', path);
          navigate(path);
        }
      } catch (e) {
        console.error('Error parsing URL', e);
      }
    };

    CapacitorApp.addListener('appUrlOpen', handleUrlOpen);

    // Check if app was launched with a URL
    CapacitorApp.getLaunchUrl().then((launchUrl) => {
      if (launchUrl && launchUrl.url) {
        handleUrlOpen(launchUrl);
      }
    });

    // Clean up listener? Capacitor listeners are usually global but for a component it's good practice
    // although removing it might be tricky if the function reference changes. 
    // For this singleton component, it's fine.
  }, [navigate]);

  return null;
};

export default AppUrlListener;
