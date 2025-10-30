import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsage } from '../services/billingService';

const LOW_CREDITS_THRESHOLD = 200;

export default function CreditsBanner() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchUsage = async () => {
      try {
        setLoading(true);
        const usageData = await getUsage();
        if (!isMounted) return;
        setUsage(usageData);
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load usage');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUsage();
    return () => {
      isMounted = false;
    };
  }, []);

  const { remainingCredits, isLow } = useMemo(() => {
    if (!usage) return { remainingCredits: null, isLow: false };

    // Try common shapes where backend provides credit balances directly
    const tryExtract = (u) => {
      if (u == null) return null;
      const asNumber = (v) => {
        if (typeof v === 'number' && !Number.isNaN(v)) return v;
        if (typeof v === 'string') {
          const n = Number(v.replace(/,/g, ''));
          if (!Number.isNaN(n)) return n;
        }
        return null;
      };
      const nDirect = asNumber(u);
      if (nDirect !== null) return nDirect;
      if (Array.isArray(u)) {
        // Some APIs might include a summary item or top-level summary-like fields per day; try common fields on any item
        for (const item of u) {
          const v = tryExtract(item);
          if (typeof v === 'number') return v;
        }
        return null;
      }
      if (typeof u === 'object') {
        const fields = ['remaining_credits', 'credits_remaining', 'available_credits', 'remaining'];
        for (const f of fields) {
          const val = asNumber(u[f]);
          if (val !== null) return val;
        }
        // nested objects
        if (u.credits) {
          const val = tryExtract(u.credits);
          if (typeof val === 'number') return val;
        }
        if (u.balance) {
          const val = tryExtract(u.balance);
          if (typeof val === 'number') return val;
        }
        const total = asNumber(u.total_credits);
        const used = asNumber(u.used_credits);
        if (total !== null && used !== null) return total - used;
        // Sometimes summary nested
        if (u.summary) return tryExtract(u.summary);
        if (u.meta) return tryExtract(u.meta);
      }
      return null;
    };

    const remaining = tryExtract(usage);
    if (typeof remaining === 'number') {
      return { remainingCredits: remaining, isLow: remaining < LOW_CREDITS_THRESHOLD };
    }
    // If we cannot confidently determine remaining credits, don't show banner
    return { remainingCredits: null, isLow: false };
  }, [usage]);

  if (loading || error || dismissed || !isLow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[10000] max-w-sm w-[22rem] bg-bg-secondary border border-border-subtle text-white shadow-xl rounded-lg">
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
          <div className="flex flex-col">
            <span className="font-semibold">Low credits</span>
            Please upgrade your plan to continue using the console.
            {typeof remainingCredits === 'number' ? (
              <span className="text-white/80 text-sm">{remainingCredits.toLocaleString()} credits left</span>
            ) : null}
            <div className="mt-2">
              <button
                className="px-3 py-1 rounded-md bg-gradient-to-r from-accent-mint to-emerald-600 text-bg-primary text-sm font-semibold hover:from-emerald-600 hover:to-accent-mint transition"
                onClick={() => navigate('/console/billing')}
              >
                Upgrade plan
              </button>
            </div>
          </div>
        </div>
        <button
          className="px-2 py-1 text-white/70 hover:text-white"
          aria-label="Dismiss low credits box"
          onClick={() => setDismissed(true)}
        >
          ×
        </button>
      </div>
    </div>
  );
}
