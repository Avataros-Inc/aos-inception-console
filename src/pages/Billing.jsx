import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { getProducts, getUsage } from '../services/billingService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../Components/Card';
import PaymentForm from '../Components/PaymentForm';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('your_publishable_key_here');

const BillingPage = () => {
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreditsVisible, setIsCreditsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  const toggleCreditsVisibility = () => {
    setIsCreditsVisible(!isCreditsVisible);
  };

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

  const handlePaymentSuccess = (paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
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
                  <PlanCard key={plan.id} plan={plan} onSelect={handlePlanSelect} />
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

const PlanCard = ({ plan, onSelect }) => {
  const price = plan.default_price?.unit_amount / 100 || 0;
  const currency = plan.default_price?.currency?.toUpperCase() || 'USD';
  const features = plan.metadata || {};
  const name = plan.name || '';

  const handleClick = () => {
    onSelect(plan);
  };

  return (
    <div className="flex flex-col group h-full border-2 border-gray-600 rounded-lg hover:border-[#74ecc8]">
      <button
        onClick={handleClick}
        className="bg-slate-800/50 text-xl font-[500] group-hover:bg-[#74ecc8] group-hover:border-[#74ecc8] w-full text-white px-4 py-5 rounded-lg hover:text-gray-800 transition-colors"
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

// function CreditsCard({ usage, isVisible }) {
//   // Calculate total usage from the API data
//   const calculateTotalUsage = () => {
//     if (!usage || !Array.isArray(usage)) return { totalJobs: 0, totalMinutes: 0 };

//     return usage.reduce(
//       (acc, item) => ({
//         totalJobs: acc.totalJobs + (item.total_jobs || 0),
//         totalMinutes: acc.totalMinutes + (item.billed_minutes || 0),
//       }),
//       { totalJobs: 0, totalMinutes: 0 }
//     );
//   };

//   const { totalJobs, totalMinutes } = calculateTotalUsage();

//   // For now, using placeholder values for credits until we get the multiplier
//   const totalCredits = 1000; // Will be updated with actual value
//   const usedCredits = totalMinutes * 2; // Simple multiplier for now
//   const remainingCredits = Math.max(0, totalCredits - usedCredits);
//   const percentage = Math.min(100, Math.max(0, (usedCredits / totalCredits) * 100));

//   const circumference = 2 * Math.PI * 8;
//   const strokeDashoffset = circumference - (percentage / 100) * circumference;

//   // Format date for display
//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
//   };

//   return (
//     <div
//       className={`max-w-md rounded-lg mb-8 border  border-gray-500 hover:border-[#74ecc8] transition-all duration-300 ${
//         isVisible ? 'block' : 'hidden'
//       }`}
//     >
//       <div className="shadow-sm  p-6">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-2">
//             {/* Circular Progress Chart */}
//             <div className="relative w-5 h-5">
//               <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
//                 <circle cx="10" cy="10" r="8" stroke="#74ecc8" strokeWidth="2.5" fill="none" />
//                 <circle
//                   cx="10"
//                   cy="10"
//                   r="8"
//                   stroke="#74ecc8"
//                   strokeWidth="2.5"
//                   fill="none"
//                   strokeDasharray={circumference}
//                   strokeDashoffset={strokeDashoffset}
//                   strokeLinecap="round"
//                   className="transition-all duration-300"
//                 />
//               </svg>
//             </div>
//             <span className="text-white font-medium">Monthly Usage</span>
//           </div>
//           <button
//             className="bg-slate-800/50   text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
//             onClick={() => document.getElementById('billing-plans').scrollIntoView({ behavior: 'smooth' })}
//           >
//             Upgrade
//           </button>
//         </div>

//         {/* Usage Summary */}
//         <div className="space-y-4">
//           <div className="space-y-2">
//             <div className="flex justify-between items-center">
//               <span className="text-white text-sm">Billed Minutes</span>
//               <span className="text-white font-semibold">{totalMinutes.toLocaleString()} min</span>
//             </div>
//             <div className="flex justify-between items-center">
//               <span className="text-white text-sm">Total Jobs</span>
//               <span className="text-white font-semibold">{totalJobs.toLocaleString()}</span>
//             </div>
//           </div>

//           <div className="border-t border-gray-100 pt-4">
//             <div className="flex justify-between items-center mb-2">
//               <span className="text-white text-sm">Credits Used</span>
//               <span className="text-white font-semibold">
//                 {usedCredits.toLocaleString()} / {totalCredits.toLocaleString()}
//               </span>
//             </div>
//             <div className="w-full bg-gray-100 rounded-full h-2">
//               <div
//                 className="bg-[#74ecc8] h-2 rounded-full transition-all duration-500"
//                 style={{ width: `${percentage}%` }}
//               />
//             </div>
//           </div>

//           {/* Recent Activity */}
//           {usage && usage.length > 0 && (
//             <div className="mt-4">
//               <h4 className="text-sm font-medium text-white mb-2">Recent Activity</h4>
//               <div className="space-y-2">
//                 {usage.slice(0, 3).map((item, index) => (
//                   <div key={index} className="flex justify-between text-sm">
//                     <span className="text-white">{formatDate(item.day)}</span>
//                     <span className="font-medium text-white">{item.billed_minutes} min</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

export default BillingPage;
