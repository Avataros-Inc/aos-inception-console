import React, { useState } from 'react';
import { useBilling } from '../contexts/BillingContext';
import CreditsCard from './CreditsCard';

function CreditsCardCred() {
  const { products: plans, usage, userPlan, loading } = useBilling();
  const [showCreditsModal, setShowCreditsModal] = useState(false);

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

  const { totalMinutes } = calculateTotalUsage();

  // Get monthly credits from user's plan
  const getMonthlyCredits = () => {
    if (!userPlan || !plans || plans.length === 0) return 1000; // Default fallback

    // Find the product that matches the user's plan
    const userProduct = plans.find((product) => product.id === userPlan.ProductID);

    if (userProduct && userProduct.metadata && userProduct.metadata.monthly_credits) {
      return parseInt(userProduct.metadata.monthly_credits, 10);
    }

    return 1000; // Default fallback
  };

  const totalCredits = getMonthlyCredits();
  const usedCredits = totalMinutes;
  const percentage = Math.min(100, Math.max(0, (usedCredits / totalCredits) * 100));

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
      className={`max-w-sm mx-3 rounded-lg mb-8 border  border-gray-500 hover:border-[#74ecc8] transition-all duration-300 cursor-pointer ${'block '}`}
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
              window.location.hash = '#/console/billing';
            }}
          >
            Upgrade
          </button>
        </div>

        {/* Usage Summary */}
        <div className="space-y-2">
          {/* Credits Used with Progress Bar */}
          <div className="space-y-1">
            <span className="text-white text-sm">Credits Used</span>
            <div className="text-white font-semibold text-lg">
              {usedCredits.toLocaleString()} / {totalCredits.toLocaleString()}
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-[#74ecc8] h-2 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <CreditsCard
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        plans={plans}
        usage={usage}
      />
    </div>
  );
}

export default CreditsCardCred;
