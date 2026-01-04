# Blank Screen Fix - Testing Instructions

## Changes Made

### 1. Fixed Navigation Method in `index.tsx`
- **Changed from:** `<Redirect>` components (unreliable)
- **Changed to:** `router.replace()` in `useEffect` with small delay
- **Why:** The `<Redirect>` component wasn't properly triggering navigation to the login screen

### 2. Enhanced Logging
- Added detailed logs to track navigation flow
- Added logs to `AuthLayout` to verify it's being mounted
- You should now see logs like:
  - `[Index] → Navigating to Login`
  - `[AuthLayout] 🔵 RENDERING AUTH LAYOUT`
  - `[AuthLayout] ✅ AUTH LAYOUT MOUNTED`
  - `[Login] ✅ LOGIN SCREEN RENDERED SUCCESSFULLY`

### 3. Removed Duplicate Files
- Deleted `login-simple.tsx` (duplicate)
- Deleted `login-original.tsx.bak` (backup)
- Only `login.tsx` remains (the correct one)

## Testing Steps

### On Your Phone:

1. **Stop the current Expo server** (Press Ctrl+C in the terminal)

2. **Restart with cache clear:**
   ```bash
   cd frontend
   npx expo start --clear
   ```

3. **Scan the QR code** from your phone

4. **Watch the Metro console** for these logs (in order):
   ```
   [Index] Render
   [Index] → Navigating to Login
   [AuthLayout] 🔵 RENDERING AUTH LAYOUT
   [AuthLayout] ✅ AUTH LAYOUT MOUNTED
   [Login] 📄 Login module loaded
   [Login] 🎬 LoginScreen function called
   [Login] ✅ LOGIN SCREEN RENDERED SUCCESSFULLY
   ```

5. **You should see:**
   - ✅ The login screen with purple header
   - ✅ Email and password input fields
   - ✅ "Sign Up" link at the bottom
   - ✅ "View Onboarding" button

## If You Still See Blank Screen:

### Check Console Logs:
Look for any error messages or stack traces in the Metro console.

### Try This Workaround:
If the screen is still blank, **shake your phone** to open the Expo menu, then:
1. Tap "Reload"
2. If that doesn't work, tap "Go home"
3. Re-open Expo and scan the QR code again

### Nuclear Option - Clear Everything:
If still blank, clear all app data:

1. **Close Expo on your phone completely**
2. **On the computer:**
   ```bash
   cd frontend
   npx expo start --clear --reset-cache
   ```
3. **On your phone:**
   - Close and reopen Expo Go app
   - Scan QR code again

## Expected Behavior for First-Time User:

Since you already have `onboardingComplete: true` in storage, you'll see:
- ✅ App loads → Goes to login screen

To test the **full first-time flow** (Onboarding → Register → Login):
- Use the "Reset App" button (if visible on login screen), OR
- Manually clear app data from phone settings

## Why Was This Happening?

The `<Redirect>` component in Expo Router has known issues with reliability. When you used:
```tsx
return <Redirect href="/(auth)/login" />;
```

Expo Router was:
1. ✅ Logging that it should redirect
2. ❌ But never actually rendering the login screen

By switching to `router.replace()` in a `useEffect` with a small delay, we give Expo Router time to properly process the navigation.

## Next Steps After This Works:

Once you confirm the login screen appears:
1. Test login with existing account (if you have one)
2. Test registration flow
3. Test role switching
4. Test order creation

Let me know what you see in the console logs!

