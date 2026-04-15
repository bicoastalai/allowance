import Purchases, { LOG_LEVEL } from 'react-native-purchases';

/**
 * The RevenueCat entitlement identifier configured in the RC dashboard.
 * Must match exactly what you create under Product Catalog → Entitlements.
 */
export const ENTITLEMENT_ID = 'premium';

/**
 * Configure the RevenueCat SDK. Call once at app startup.
 *
 * Pass the authenticated Supabase user ID so RevenueCat links purchases
 * to your users. On logout pass undefined to revert to an anonymous ID.
 *
 * Example:
 *   configureRevenueCat(session?.user.id);
 */
export function configureRevenueCat(userId?: string) {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? '';
  if (!apiKey) {
    // Skip configuration in development when no key is set.
    // The app will work normally; premium features will show as locked.
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey, appUserID: userId ?? null });
}
