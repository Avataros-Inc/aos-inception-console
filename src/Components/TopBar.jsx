import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { Header } from './Header';
import { CreditWarningBanner } from './CreditWarningBanner';
import { Sidebar } from './Sidebar';

const TopBarContext = createContext({ topOffset: 0 });

export const useTopBarOffset = () => useContext(TopBarContext);

export function TopBar({ children }) {
  const [bannerHeight, setBannerHeight] = useState(0);
  const bannerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const mutationObserverRef = useRef(null);

  const updateBannerHeight = useCallback(() => {
    const banner = document.querySelector('[data-credit-banner]');
    if (banner) {
      const height = banner.offsetHeight;
      setBannerHeight(height);
    } else {
      setBannerHeight(0);
    }
  }, []);

  useEffect(() => {
    // Initial check
    updateBannerHeight();

    // Set up ResizeObserver to detect size changes
    resizeObserverRef.current = new ResizeObserver(() => {
      updateBannerHeight();
    });

    // Set up MutationObserver to detect DOM changes (banner appearing/disappearing)
    mutationObserverRef.current = new MutationObserver(() => {
      updateBannerHeight();
    });

    // Observe the body for child list changes to detect when banner is added/removed
    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Start observing the banner if it exists
    const banner = document.querySelector('[data-credit-banner]');
    if (banner) {
      resizeObserverRef.current.observe(banner);
    }

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [updateBannerHeight]);

  // Header height is 64px (h-16)
  const headerHeight = 64;
  const totalTopOffset = bannerHeight + headerHeight;

  return (
    <TopBarContext.Provider value={{ topOffset: totalTopOffset }}>
      <CreditWarningBanner />
      <Header topOffset={bannerHeight} />
      <Sidebar topOffset={totalTopOffset} />
      {children}
    </TopBarContext.Provider>
  );
}
