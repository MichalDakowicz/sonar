import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFriendVisibility } from '../../hooks/useFriendVisibility';

const MIN_SWIPE_DISTANCE = 50;
const SWIPE_TIMEOUT = 500; // ms

export default function SwipeNavigator() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract userId if we are on a public route to check visibility
  const publicPathMatch = location.pathname.match(/^\/u\/([^/]+)/);
  const userId = publicPathMatch ? publicPathMatch[1] : null;
  const { showFriends } = useFriendVisibility(userId);

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
         if (duration > SWIPE_TIMEOUT) return;

        // Internal app routes matching Navbar order
        const appRoutes = ['/', '/stats', '/history', '/friends', '/settings'];
        const appIndex = appRoutes.indexOf(location.pathname);
        
        // Public routes configuration
        // Pages: Library -> Stats -> Friends (if enabled)
        const publicMatch = location.pathname.match(/^\/u\/([^/]+)(\/(stats|friends))?$/);

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
            const currentId = publicMatch[1]; // Should match userId from outer scope, but safe to use
            const subPage = publicMatch[3] || 'library'; // 'stats', 'friends' or undefined ('library')

            // Define order
            const pages = ['library', 'stats'];
            if (showFriends) {
                pages.push('friends');
            }

            const currentIndex = pages.indexOf(subPage);
            
            if (currentIndex !== -1) {
                if (distanceX > 0) {
                    // Next
                    if (currentIndex < pages.length - 1) {
                        const nextPage = pages[currentIndex + 1];
                        navigate(nextPage === 'library' ? `/u/${currentId}` : `/u/${currentId}/${nextPage}`);
                    }
                } else {
                    // Prev
                    if (currentIndex > 0) {
                        const prevPage = pages[currentIndex - 1];
                        navigate(prevPage === 'library' ? `/u/${currentId}` : `/u/${currentId}/${prevPage}`);
                    }
                }
            }
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [location.pathname, navigate, showFriends]); // Add showFriends to dependency

  return null;
}
