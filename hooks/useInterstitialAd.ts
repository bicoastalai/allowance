import { useEffect, useRef, useCallback } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? TestIds.INTERSTITIAL;

/**
 * Loads a Google AdMob interstitial ad and exposes a `showIfReady` function.
 *
 * The ad is shown at most once every `minIntervalMs` (default 3 minutes) so
 * it never fires on every single action. Call `showIfReady()` at natural
 * break points — e.g. after logging an expense — for free users only.
 *
 * Example:
 *   const { showIfReady } = useInterstitialAd();
 *   // after saving an expense:
 *   if (!isPremium) showIfReady();
 */
export function useInterstitialAd(minIntervalMs = 3 * 60 * 1000) {
  const adRef = useRef<InterstitialAd | null>(null);
  const loadedRef = useRef(false);
  const lastShownRef = useRef(0);

  const load = useCallback(() => {
    const ad = InterstitialAd.createForAdRequest(UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      unsubscribeLoaded();
      unsubscribeClosed();
      load();
    });

    ad.load();
    adRef.current = ad;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showIfReady = useCallback(() => {
    const now = Date.now();
    if (!loadedRef.current) return;
    if (now - lastShownRef.current < minIntervalMs) return;
    lastShownRef.current = now;
    adRef.current?.show();
  }, [minIntervalMs]);

  return { showIfReady };
}
