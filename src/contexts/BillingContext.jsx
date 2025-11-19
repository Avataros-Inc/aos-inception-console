import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProducts, getUsage, getUserPlan } from '../services/billingService';

const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  const [products, setProducts] = useState(null);
  const [usage, setUsage] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsData, usageData, userPlanData] = await Promise.all([
        getProducts(),
        getUsage(),
        getUserPlan(),
      ]);

      setProducts(productsData);
      setUsage(usageData);
      setUserPlan(userPlanData);
    } catch (err) {
      console.error('Failed to fetch billing data:', err);

      // Check if this is an email verification error
      if (err.status === 401 && err.message === 'email verification required') {
        // Redirect to email verification pending page
        window.location.hash = '#/email-verification-pending';
        return;
      }

      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const value = {
    products,
    usage,
    userPlan,
    loading,
    error,
    refetch: fetchBillingData,
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
