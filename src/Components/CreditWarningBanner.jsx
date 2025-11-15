import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { getProducts, getUsage, getUserPlan } from '../services/billingService';

export function CreditWarningBanner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);
  const [credits, setCredits] = useState({ used: 0, total: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);

  // Check if banner is closed via query param (memoized to prevent recreating on every render)
  const isClosed = useMemo(() => searchParams.get('hideCreditWarning') === 'true', [searchParams]);

  useEffect(() => {
    // Only fetch if banner is not already closed
    if (isClosed) {
      setLoading(false);
      setShowBanner(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        setLoading(true);
        const [productsData, usageData, userPlanData] = await Promise.all([
          getProducts(),
          getUsage(),
          getUserPlan(),
        ]);

        // Calculate total usage
        const totalMinutes = usageData?.reduce(
          (acc, item) => acc + (item.billed_minutes || 0),
          0
        ) || 0;

        // Get monthly credits from user's plan
        let totalCredits = 1000; // Default fallback
        if (userPlanData && productsData && productsData.length > 0) {
          const userProduct = productsData.find(
            (product) => product.id === userPlanData.ProductID
          );

          if (userProduct?.metadata?.monthly_credits) {
            totalCredits = parseInt(userProduct.metadata.monthly_credits, 10);
          }
        }

        const usedCredits = totalMinutes;
        const remainingCredits = Math.max(0, totalCredits - usedCredits);

        setCredits({
          used: usedCredits,
          total: totalCredits,
          remaining: remainingCredits,
        });

        // Show banner if credits are exhausted or very low (less than 5%)
        const shouldShow = remainingCredits <= 0 || remainingCredits < totalCredits * 0.05;
        setShowBanner(shouldShow);
      } catch (err) {
        console.error('Error fetching credits:', err);
        // Don't show banner if we can't fetch data
        setShowBanner(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
    // Only depend on isClosed - fetch when component mounts or when banner is reopened
  }, [isClosed]);

  const handleClose = useCallback(() => {
    // Set query param to hide the banner
    const newParams = new URLSearchParams(searchParams);
    newParams.set('hideCreditWarning', 'true');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleUpgrade = useCallback(() => {
    navigate('/console/billing');
  }, [navigate]);

  if (loading || !showBanner || isClosed) {
    return null;
  }

  return (
    <div data-credit-banner className="fixed top-0 left-0 right-0 z-[60] bg-orange-500 text-white px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <div>
            {credits.remaining <= 0 ? (
              <span className="font-semibold">
                You're out of credits! Upgrade your plan to continue using AvatarOS.
              </span>
            ) : (
              <span className="font-semibold">
                Low credits warning: Only {credits.remaining.toLocaleString()} credits remaining out of{' '}
                {credits.total.toLocaleString()}.
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpgrade}
            className="bg-white text-orange-500 px-4 py-1.5 rounded font-medium hover:bg-orange-50 transition-colors flex-shrink-0"
          >
            Upgrade Now
          </button>
          <button
            onClick={handleClose}
            className="text-white hover:text-orange-100 transition-colors p-1 flex-shrink-0"
            aria-label="Close banner"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
