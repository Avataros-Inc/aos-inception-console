import React, { useState, useEffect } from 'react';
import { getProducts, getUsage } from '../services/billingService';
import CreditsCard from './CreditsCard';

function CreditsCardCred() {
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, usageData] = await Promise.all([getProducts(), getUsage()]);
        setPlans(productsData);
        setUsage(usageData);
      } catch (err) {
        console.error('Error fetching billing data:', err);
        setError('Failed to load billing information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate total usage from the API data
  const calculateTotalUsage = () => {
    if (!usage || !Array.isArray(usage)) return { totalJobs: 0, totalMinutes: 0 };

    return usage.reduce(
      (acc, item) => ({
        totalJobs: acc.totalJobs + (item.total_jobs || 0),
        totalMinutes: acc.totalMinutes + (item.billed_minutes || 0),
      }),
      { totalJobs: 0, totalMinutes: 0 }
    );
  };

  const { totalJobs, totalMinutes } = calculateTotalUsage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading billing information...</p>
      </div>
    );
  }

  return (
    <div
      onClick={() => setShowCreditsModal(true)}
      className={`max-w-sm mx-3 rounded-lg mb-8 border  border-gray-500 hover:border-[#74ecc8] transition-all duration-300 ${'block '}`}
    >
      <div className="shadow-sm  p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">Usage/Mon</span>
          </div>
          <button
            className="justify-center rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-mint focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-accent-mint to-emerald-600 text-bg-primary hover:from-emerald-600 hover:to-accent-mint hover:shadow-lg hover:shadow-accent-mint/20 px-2 py-1 flex items-center text-sm gap-2"
            onClick={(e) => {
              e.stopPropagation();
              const el = document.getElementById('billing-plans');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Upgrade
          </button>
        </div>

        {/* Usage Summary */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white text-sm">Credits</span>
              <span className="text-white font-semibold">{totalMinutes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white text-sm">Total Jobs</span>
              <span className="text-white font-semibold">{totalJobs.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      <CreditsCard isOpen={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </div>
  );
}

export default CreditsCardCred;
