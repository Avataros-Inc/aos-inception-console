import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useBilling } from '../contexts/BillingContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../Components/Card';
import PaymentForm from '../Components/PaymentForm';

// Initialize Stripe with publishable key from env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const BillingPage = () => {
  const { products: plans, usage, userPlan, loading, refetch } = useBilling();
  const [isCreditsVisible, setIsCreditsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const toggleCreditsVisibility = () => {
    setIsCreditsVisible(!isCreditsVisible);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading billing information...</p>
      </div>
    );
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
    // Refresh billing data after successful payment
    await refetch();
    setSelectedPlan(null);
    // You can add additional success handling here, like showing a success message
    // or redirecting to a success page
  };

  const handlePaymentCancel = () => {
    setSelectedPlan(null);
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        </div>

        {selectedPlan ? (
          <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Complete Your Purchase</h2>
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold">{selectedPlan.name}</h3>
              <p className="text-2xl font-bold">
                ${(selectedPlan.default_price.unit_amount / 100).toFixed(2)}{' '}
                <span className="text-sm font-normal text-gray-400">/month</span>
              </p>
            </div>
            <PaymentForm plan={selectedPlan} onSuccess={handlePaymentSuccess} onCancel={handlePaymentCancel} />
          </div>
        ) : (
          <>
            {/* Subscription Plans */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Choose a Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...plans].reverse().map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onSelect={handlePlanSelect} userPlan={userPlan} />
                ))}
              </div>
            </div>
            <Features plans={plans} />
          </>
        )}
      </div>
    </Elements>
  );
};

const PlanCard = ({ plan, onSelect, userPlan }) => {
  const price = plan.default_price?.unit_amount / 100 || 0;
  const currency = plan.default_price?.currency?.toUpperCase() || 'USD';
  const features = plan.metadata || {};
  const name = plan.name || '';
  const isCurrentPlan = userPlan?.PlanID === plan.default_price?.id;
  const currentPlanAmount = userPlan?.PriceUnitAmount || 0;
  const isUpgrade = userPlan && !isCurrentPlan && plan.default_price?.unit_amount > currentPlanAmount;
  const isDowngrade = userPlan && !isCurrentPlan && plan.default_price?.unit_amount < currentPlanAmount;

  // Check if subscription is canceled
  const isCanceled = userPlan?.Status === 'canceled';
  const cutoffDate = userPlan?.CurrentPeriodEnd ? new Date(userPlan.CurrentPeriodEnd * 1000) : null;

  // Format the cutoff date
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleClick = () => {
    // Allow selecting plan if it's not current, or if it's current but canceled (to resubscribe)
    if (!isCurrentPlan || (isCurrentPlan && isCanceled)) {
      onSelect(plan);
    }
  };

  return (
    <div
      className={`flex flex-col group h-full border-2 ${
        isCurrentPlan && !isCanceled ? 'border-[#74ecc8]' : 'border-gray-600 hover:border-[#74ecc8]'
      } relative rounded-lg`}
    >
      {isCurrentPlan && !isCanceled && (
        <div className="absolute -top-3 right-4 bg-[#74ecc8] text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
          Current Plan
        </div>
      )}

      {isCurrentPlan && isCanceled && cutoffDate && (
        <div className="absolute -top-3 right-4 bg-orange-400 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
          Active until {formatDate(cutoffDate)}
        </div>
      )}

      {!isCurrentPlan && isUpgrade && (
        <div className="absolute -top-3 right-4 bg-yellow-400 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
          Upgrade
        </div>
      )}
      {!isCurrentPlan && isDowngrade && (
        <div className="absolute -top-3 right-4 bg-blue-400 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">
          Downgrade
        </div>
      )}

      <button
        onClick={handleClick}
        className={`text-xl font-[500] w-full px-4 py-5 rounded-lg transition-colors
          ${
            isCurrentPlan && !isCanceled
              ? 'bg-[#74ecc8] text-gray-800 cursor-default'
              : 'bg-slate-800/50 text-white group-hover:bg-[#74ecc8] group-hover:text-gray-800'
          }`}
      >
        {name}
      </button>
      <div className="flex  justify-around mt-10 mb-10">
        <div>
          <p className="text-5xl font-bold">
            {currency == 'USD' ? '$' : ''}
            {price}
          </p>
          <p className="text-gray-500">/mo</p>
        </div>
        <div>
          <ul className="list-disc">
            {Object.keys(features).map((feature, index) => (
              <li key={index}>{features[feature]}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const Features = ({ plans }) => {
  // Sort plans by price (lowest to highest)
  const sortedPlans = [...plans].sort((a, b) => a.default_price.unit_amount - b.default_price.unit_amount);

  // Helper function to get plan type from name
  const getPlanType = (name) => {
    if (name.includes('Creator')) return 'Creator';
    if (name.includes('Pro')) return 'Pro';
    if (name.includes('Scale')) return 'Scale';
    return name;
  };

  return (
    <div className="text-white p-8 mt-20">
      <div className="max-w-6xl mx-auto space-y-16">
        <div>
          <h1 className="text-5xl font-bold text-center mb-8">Credits Breakdown</h1>
          <div className="overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800/50  border ">
                  <th className="border text-white border-[#74ecc8] p-4 text-left font-bold text-lg"></th>
                  <th className="border text-white border-[#74ecc8] p-4 text-center font-bold text-lg">SD</th>
                  <th className="border text-white border-[#74ecc8] p-4 text-center font-bold text-lg">HD</th>
                  <th className="border text-white border-[#74ecc8] p-4 text-center font-bold text-lg">4K</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border text-white border-[#74ecc8] bg-slate-800/50   p-4 font-bold text-center">
                    Generative
                    <br />
                    (Video)
                  </td>
                  <td className="border text-white border-[#74ecc8] p-4 text-center text-lg">1 credit/minute</td>
                  <td className="border text-white border-[#74ecc8] p-4 text-center text-lg">2 credits/minute</td>
                  <td className="border text-white border-[#74ecc8] p-4 text-center text-lg">4 credits/minute</td>
                </tr>
                <tr>
                  <td className="border text-white border-[#74ecc8] bg-slate-800/50   p-4 font-bold text-center">
                    Interactive
                    <br />
                    (LIVE)
                  </td>
                  <td className="border text-white border-[#74ecc8] p-4 text-center text-lg">2 credits/white</td>
                  <td className="border text-white border-[#74ecc8] p-4 text-center text-lg">4 credits/minute</td>
                  <td className="border text-white border-[#74ecc8] p-4 text-center text-lg">8 credits/minute</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Plan Breakdown Section */}
        <div>
          <h1 className="text-5xl font-bold text-center mb-8">Pricing Plan Breakdown</h1>
          <div className="overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800/50  ">
                  <th className="border text-white border-[#74ecc8] p-4 text-left font-bold text-lg"></th>
                  {sortedPlans.map((plan) => (
                    <th key={plan.id} className="border text-white border-[#74ecc8] p-4 text-center font-bold text-lg">
                      {getPlanType(plan.name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border text-white border-[#74ecc8] bg-slate-800/50   p-4 font-bold text-center">
                    Credits
                  </td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="border border-[#74ecc8] p-4 text-center text-lg">
                      {parseInt(plan.metadata.monthly_credits).toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border text-white border-[#74ecc8] bg-slate-800/50   p-4 font-bold text-center">
                    Avatars
                  </td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="border border-[#74ecc8] p-4 text-center text-lg">
                      {plan.metadata.avatars}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border text-white border-[#74ecc8] bg-slate-800/50   p-4 font-bold text-center">
                    Branding &<br />
                    Customizations
                  </td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="border border-[#74ecc8] p-4 text-center text-lg">
                      {plan.metadata.customization}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border text-white border-[#74ecc8] bg-slate-800/50   p-4 font-bold text-center">
                    Resolution
                  </td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="border border-[#74ecc8] p-4 text-center text-lg">
                      {plan.metadata.Resolution}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border text-white border-[#74ecc8] bg-slate-800/50   p-4 font-bold text-center">
                    Support
                  </td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="border border-[#74ecc8] p-4 text-center text-lg">
                      {plan.metadata.Support}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border text-white border-[#74ecc8] bg-slate-800/50   p-4 font-bold text-center">
                    Price
                  </td>
                  {sortedPlans.map((plan) => (
                    <td key={plan.id} className="border border-[#74ecc8] p-4 text-center text-lg">
                      ${(plan.default_price.unit_amount / 100).toFixed(2)}/mo
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
