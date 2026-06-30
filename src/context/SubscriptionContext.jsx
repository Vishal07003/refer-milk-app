import React, { createContext, useContext, useMemo, useState } from 'react';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [hasSubscription, setHasSubscription] = useState(false);

  const value = useMemo(
    () => ({ hasSubscription, setHasSubscription }),
    [hasSubscription],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
}
