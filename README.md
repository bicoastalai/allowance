# Allowance

An Android expense-tracking app built with Expo (managed workflow), TypeScript, and Supabase.

## Tech Stack

- **Expo** (managed workflow, SDK 54)
- **expo-router** — file-based navigation with tab layout
- **Supabase** — backend (auth, database)
- **NativeWind** — Tailwind CSS styling for React Native
- **Stripe** — in-app payments
- **Google Mobile Ads (AdMob)** — ad monetisation

## Environment Variables

Copy `.env.local` and fill in the values before running the app.

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL (found in Project Settings → API) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key |
| `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` | AdMob Android App ID from the Google AdMob console (format: `ca-app-pub-XXXXXXXX~XXXXXXXXXX`) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key from the Stripe Dashboard |

## Project Structure

```
app/
  _layout.tsx          # Root layout (Stack navigator)
  (auth)/
    _layout.tsx        # Auth stack layout
    login.tsx          # Login screen
    signup.tsx         # Sign-up screen
  (tabs)/
    _layout.tsx        # Tab bar layout
    index.tsx          # Home tab
    history.tsx        # History tab
    stats.tsx          # Stats tab
    settings.tsx       # Settings tab
components/            # Shared presentational components
hooks/                 # Shared hooks
lib/
  supabase.ts          # Supabase client (uses expo-secure-store for session)
constants/
  categories.ts        # Default expense categories
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Fill in `.env.local` with your credentials.

3. Run on Android:
   ```bash
   npm run android
   ```

## Notes

- Android only. The `ios` and `web` targets have been intentionally excluded from `app.json`.
- Session tokens are stored securely via `expo-secure-store`.
- AdMob requires a real `google-services.json` file in the project root for a production build.
