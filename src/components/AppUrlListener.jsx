import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

let isLaunchUrlHandled = false;

const AppUrlListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
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

    const setupListener = async () => {
       const listener = await CapacitorApp.addListener('appUrlOpen', handleUrlOpen);
       return listener;
    };

    const listenerPromise = setupListener();

    // Check if app was launched with a URL
    // Only check if we haven't handled it yet in this session
    if (!isLaunchUrlHandled) {
        CapacitorApp.getLaunchUrl().then((launchUrl) => {
            if (launchUrl && launchUrl.url) {
                // Verify it is a relevant URL before claiming we handled it/navigating
                 try {
                     const url = new URL(launchUrl.url);
                     if (url.pathname.startsWith('/u/')) {
                         console.log("Handling launch URL:", launchUrl.url);
                         handleUrlOpen(launchUrl);
                     }
                 } catch (e) {
                     // ignore invalid urls
                 }
            }
            isLaunchUrlHandled = true;
        });
    }

    return () => {
        listenerPromise.then(item => item.remove());
    };
  }, [navigate]);

  return null;
};

export default AppUrlListener;
