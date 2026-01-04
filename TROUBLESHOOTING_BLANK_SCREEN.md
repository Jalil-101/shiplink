# Troubleshooting: Blank White Screen

## Current Status
You're experiencing a blank white screen after scanning the QR code. This guide will help diagnose and fix the issue.

## Implemented Fixes
✅ Enhanced auth state checking with comprehensive logging
✅ Added logging to index.tsx for routing debugging  
✅ Ensured proper default role handling for new users
✅ Fixed registration flow to set activeRole and roles
✅ Disabled admin portal in mobile app (returns null)

## Diagnostic Steps

### Step 1: Check Metro Bundler Console
The Metro bundler is running in your terminal. Look for:
- ❌ Red error messages
- ⚠️ Yellow warnings
- 🔍 `[Auth]` and `[Index]` log messages we just added

**What to look for:**
```
[Auth] Checking auth state { hasToken: false, hasUserData: false, onboardingComplete: null }
[Auth] Onboarding status { isOnboardingComplete: false }
[Index] Render state { isLoading: false, isAuthenticated: false, hasCompletedOnboarding: false }
[Index] Redirecting to onboarding
```

### Step 2: Enable Remote Debugging
1. Shake your device (or Cmd+D in iOS Simulator / Cmd+M in Android Emulator)
2. Tap "Debug Remote JS"
3. Chrome DevTools will open
4. Check the **Console** tab for errors
5. Look for React errors, navigation errors, or component crashes

### Step 3: Clear All App Data
The blank screen might be caused by corrupted storage:

**iOS:**
```bash
# In your terminal, frontend directory:
npx expo start --clear

# Then on device:
# Long-press the app icon → Delete App → Reinstall
```

**Android:**
```bash
# In your terminal, frontend directory:
npx expo start --clear

# Then on device:
# Settings → Apps → Expo Go → Storage → Clear Data
```

### Step 4: Check for Specific Errors

#### A. Component Rendering Error
Look for messages like:
- "Cannot read property 'X' of undefined"
- "X is not a function"
- "Invariant Violation"

**Fix:** These usually point to a specific file. Share the error message.

#### B. Navigation Error
Look for messages like:
- "The action 'NAVIGATE' was not handled"
- "Couldn't find a 'Stack' navigator"
- "The screen 'X' is not in the navigator"

**Fix:** Verify all route definitions match between layouts and screens.

#### C. Storage/Permission Error
Look for messages like:
- "Unable to access SecureStore"
- "AsyncStorage is null"

**Fix:** Ensure the app has proper permissions.

### Step 5: Verify App Structure
Run these commands to ensure all files exist:

```bash
# In project root
cd frontend

# Check if key files exist
ls app/index.tsx
ls app/_layout.tsx
ls app/(onboarding)/splash.tsx
ls app/(auth)/login.tsx
ls src/context/AuthContext.tsx
ls components/LoadingScreen.tsx
```

All should exist without errors.

### Step 6: Test Specific Screens
Instead of relying on auto-routing, manually navigate to test each screen:

1. **Test LoadingScreen:**
   - Temporarily modify `app/index.tsx` to return `<LoadingScreen />` directly
   - See if loading spinner appears

2. **Test Onboarding:**
   - Temporarily modify `app/index.tsx` to return `<Redirect href="/(onboarding)/splash" />`
   - See if splash screen appears

3. **Test Login:**
   - Temporarily modify `app/index.tsx` to return `<Redirect href="/(auth)/login" />`
   - See if login screen appears

## Common Causes & Solutions

### Cause 1: Infinite Redirect Loop
**Symptoms:**
- Blank screen
- No logs appear
- High CPU usage

**Solution:**
- Check Metro logs for repeated `[Index] Render state` messages
- If looping, there's a condition causing constant re-renders
- We've already fixed known loops, but verify:
  - AuthContext isn't re-rendering infinitely
  - index.tsx isn't stuck in a condition

**Test:**
```bash
# Clear everything and start fresh
rm -rf node_modules .expo
npm install
npx expo start --clear
```

### Cause 2: Submodule Issue
**Symptoms:**
- Changes not reflecting
- Old code running

**Solution:**
```bash
# From project root
cd frontend
git pull origin master
npm install
cd ..
git add frontend
git commit -m "Update frontend submodule"
```

### Cause 3: Image Loading Error
**Symptoms:**
- Screen loads but images don't
- SVG errors in console

**Solution:**
- Verify all image paths in splash.tsx and features.tsx exist
- Check `assets/images/` directory has all SVG files

### Cause 4: Theme Context Error
**Symptoms:**
- Error about "useTheme must be used within ThemeProvider"

**Solution:**
- Verify `app/_layout.tsx` has ThemeProvider wrapping everything
- We already have this, but double-check it wasn't modified

## Debug Mode - Add More Logging

If none of the above helps, add temporary logging to narrow down the issue:

### 1. Add console logs to _layout.tsx:
```typescript
// In app/_layout.tsx, top of RootLayout function:
console.log("[RootLayout] Rendering");

// In AppContent function:
console.log("[AppContent] Rendering");
```

### 2. Add console logs to AuthContext:
```typescript
// In AuthProvider, after useReducer:
console.log("[AuthContext] Provider rendering", state);
```

### 3. Add console logs to index.tsx:
```typescript
// Top of Index function:
console.log("[Index] START - Rendering index screen");
```

## Expected Log Sequence (Fresh Install)

On first app open, you should see:
```
[RootLayout] Rendering
[AppContent] Rendering
[AuthContext] Provider rendering { isLoading: true, ... }
[Auth] Checking auth state { hasToken: false, hasUserData: false, onboardingComplete: null }
[Auth] Onboarding status { isOnboardingComplete: false }
[Index] START - Rendering index screen
[Index] Render state { isLoading: false, isAuthenticated: false, hasCompletedOnboarding: false, activeRole: undefined }
[Index] Redirecting to onboarding
```

Then splash screen should appear.

## If Still Blank After All Steps

Please capture and share:

1. **Metro bundler output** (full terminal output)
2. **Remote debugger console** (if any errors)
3. **Device logs** (if accessible)
4. **What you tried** from the steps above

With this information, we can pinpoint the exact issue.

## Quick Test Command

Run this all-in-one diagnostic:

```bash
cd frontend
rm -rf node_modules .expo .expo-shared
npm install
npx expo start --clear
```

Then:
1. Scan QR code
2. Immediately check terminal for logs
3. If blank, open remote debugger (shake device → Debug Remote JS)
4. Share any error messages you see

## Next Steps After Fix

Once the app loads correctly:
1. ✅ Verify onboarding flow works
2. ✅ Test registration with "Importer" role
3. ✅ Verify login works
4. ✅ Test profile → apply for additional roles
5. ✅ Test role switching

---

**Remember:** The auth flow is now properly configured. The blank screen is likely a:
- Component crash (check remote debugger)
- Image loading issue (check asset paths)
- Storage permission issue (reinstall app)
- Or cached old code (clear cache)

Let me know what you find! 🚀

