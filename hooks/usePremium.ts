import { useCallback, useEffect, useState } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { ENTITLEMENT_ID } from '@/lib/revenuecat';

/**
 * Provides the current premium status and actions to subscribe or restore.
 *
 * - `isPremium`  — true when the "premium" entitlement is active.
 * - `subscribe`  — presents Google Play Billing for the given package.
 *                  Returns true on success, false if user cancelled.
 * - `restore`    — restores previous purchases and refreshes status.
 * - `loading`    — true while fetching initial CustomerInfo.
 * - `error`      — last error message, or empty string.
 *
 * Example:
 *   const { isPremium, subscribe, restore } = usePremium();
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function checkInfo(info: CustomerInfo) {
    setIsPremium(!!info.entitlements.active[ENTITLEMENT_ID]);
  }

  useEffect(() => {
    Purchases.getCustomerInfo()
      .then(checkInfo)
      .catch(() => {})
      .finally(() => setLoading(false));

    const listener = Purchases.addCustomerInfoUpdateListener(checkInfo);
    return () => listener.remove();
  }, []);

  const subscribe = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    setError('');
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
      setIsPremium(active);
      return active;
    } catch (e: unknown) {
      if ((e as { userCancelled?: boolean }).userCancelled) return false;
      setError(e instanceof Error ? e.message : 'Purchase failed. Please try again.');
      return false;
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    setError('');
    try {
      const info = await Purchases.restorePurchases();
      const active = !!info.entitlements.active[ENTITLEMENT_ID];
      setIsPremium(active);
      return active;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Restore failed. Please try again.');
      return false;
    }
  }, []);

  return { isPremium, loading, error, subscribe, restore };
}
