import React, { useState, useEffect } from 'react';
import { getProducts, getUsage } from '../services/billingService';

function CreditsCard() {
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // For now, using placeholder values for credits until we get the multiplier
  const totalCredits = 1000; // Will be updated with actual value
  const usedCredits = totalMinutes * 2; // Simple multiplier for now
  const remainingCredits = Math.max(0, totalCredits - usedCredits);
  const percentage = Math.min(100, Math.max(0, (usedCredits / totalCredits) * 100));

  const circumference = 2 * Math.PI * 8;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading billing information...</p>
      </div>
    );
  }

  return (
    <div
      className={`max-w-md rounded-lg mb-8 border  border-gray-500 hover:border-[#74ecc8] transition-all duration-300 ${'block '}`}
    >
      <div className="shadow-sm  p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {/* Circular Progress Chart */}
            <div className="relative w-5 h-5">
              <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" stroke="#74ecc8" strokeWidth="2.5" fill="none" />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="#74ecc8"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
            </div>
            <span className="text-white font-medium">Monthly Usage</span>
          </div>
          <button
            className="justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-mint focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-accent-mint to-emerald-600 text-bg-primary hover:from-emerald-600 hover:to-accent-mint hover:shadow-lg hover:shadow-accent-mint/20 px-4 py-2 flex items-center gap-2"
            onClick={() => document.getElementById('billing-plans').scrollIntoView({ behavior: 'smooth' })}
          >
            Upgrade
          </button>
        </div>

        {/* Usage Summary */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white text-sm">Billed Minutes</span>
              <span className="text-white font-semibold">{totalMinutes.toLocaleString()} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white text-sm">Total Jobs</span>
              <span className="text-white font-semibold">{totalJobs.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-sm">Credits Used</span>
              <span className="text-white font-semibold">
                {usedCredits.toLocaleString()} / {totalCredits.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#74ecc8] h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Recent Activity */}
          {usage && usage.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2">Recent Activity</h4>
              <div className="space-y-2">
                {usage.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-white">{formatDate(item.day)}</span>
                    <span className="font-medium text-white">{item.billed_minutes} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreditsCard;
