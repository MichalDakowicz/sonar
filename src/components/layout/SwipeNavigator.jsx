import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MIN_SWIPE_DISTANCE = 50;

export default function SwipeNavigator() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    // We need to keep track of whether the touch movement looks like a scroll
    // If it's a scroll, we shouldn't trigger navigation
    let isScrolling = false;

    const onTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      touchStartTime = Date.now();
      isScrolling = false;
    };

    const onTouchMove = (e) => {
        if (isScrolling) return;

        const currentX = e.changedTouches[0].screenX;
        const currentY = e.changedTouches[0].screenY;
        const diffX = Math.abs(currentX - touchStartX);
        const diffY = Math.abs(currentY - touchStartY);

        // If vertical movement is significant, assume scrolling and ignore the rest of the gesture
        if (diffY > diffX && diffY > 10) {
            isScrolling = true;
        }
    };

    const onTouchEnd = (e) => {
      if (isScrolling) return;

      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const touchEndTime = Date.now();
      
      const distanceX = touchStartX - touchEndX;
      const distanceY = touchStartY - touchEndY;
      const duration = touchEndTime - touchStartTime;

      // Check if horizontal swipe is dominant and long enough
      if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > MIN_SWIPE_DISTANCE) {
         // Prevent triggering if swipe took too long (slow drag)
         if (duration > 1000) return;

        const appRoutes = ['/', '/stats', '/history', '/settings'];
        const appIndex = appRoutes.indexOf(location.pathname);
        
        // Check for public shelf routes: /u/:userId or /u/:userId/stats
        const publicMatch = location.pathname.match(/^\/u\/([^/]+)(\/stats)?$/);

        if (appIndex !== -1) {
            if (distanceX > 0) {
                // Swiped Left -> Go Next
                if (appIndex < appRoutes.length - 1) {
                    navigate(appRoutes[appIndex + 1]);
                }
            } else {
                // Swiped Right -> Go Prev
                if (appIndex > 0) {
                    navigate(appRoutes[appIndex - 1]);
                }
            }
        } else if (publicMatch) {
            const userId = publicMatch[1];
            const isStats = !!publicMatch[2]; // true if /stats is present

            if (distanceX > 0 && !isStats) {
                // On Public Home, Swipe Left -> Go to Stats
                navigate(`/u/${userId}/stats`);
            } else if (distanceX < 0 && isStats) {
                // On Public Stats, Swipe Right -> Go to Home
                navigate(`/u/${userId}`);
            }
        }
      }
    };

    // Use capture: false (bubble phase) so we don't interfere with other handlers immediately
    // Or maybe check start/move to determine intent.
    
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [location.pathname, navigate]);

  return null;
}
