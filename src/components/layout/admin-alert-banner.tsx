'use client';

import { useEffect, useState } from 'react';

export function AdminAlertBanner() {
  const [count, setCount] = useState(0);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    fetch('/api/admin/email-failures')
      .then((res) => res.json())
      .then((data) => setCount(data.count ?? 0))
      .catch(() => {});
  }, []);

  if (count === 0) return null;

  async function handleDismiss() {
    setDismissing(true);
    try {
      await fetch('/api/admin/email-failures', { method: 'DELETE' });
      setCount(0);
    } catch {
      setDismissing(false);
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span>
        <strong>{count}</strong> email{count !== 1 ? 's' : ''} failed to send in the last 24 hours. Check your Resend dashboard.
      </span>
      <button
        onClick={handleDismiss}
        disabled={dismissing}
        className="ml-4 shrink-0 rounded bg-amber-200 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-300 disabled:opacity-50"
      >
        Dismiss
      </button>
    </div>
  );
}
