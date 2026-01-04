# ShipLink User Flow Documentation

## Overview
This document explains the complete user authentication and onboarding flow in the ShipLink mobile app.

## Key Principles
1. **First-time users**: See onboarding → role selection → register → home
2. **Existing users**: Go directly to login → home based on their role
3. **Default role**: All new users start as "user" (buyer/importer)
4. **Role expansion**: Users can apply for additional roles later (seller, driver, coach, sourcing agent)
5. **Admin portal**: NOT part of the mobile app - admins use a separate web dashboard

## Authentication Flow

### 1. App Launch (`frontend/app/index.tsx`)
When the app starts, the `index.tsx` screen determines where to route the user:

```typescript
// Check auth state (loading)
if (isLoading) {
  return <LoadingScreen />; // Show spinner while checking storage
}

// First-time users (no onboarding complete)
if (!hasCompletedOnboarding) {
  return <Redirect href="/(onboarding)/splash" />;
}

// Users who completed onboarding but not logged in
if (!isAuthenticated) {
  return <Redirect href="/(auth)/login" />;
}

// Logged-in users - route based on active role
const activeRole = user?.activeRole || user?.role || "user";

if (activeRole === "driver") {
  return <Redirect href="/(driver)/(tabs)/dashboard" />;
}

// All other roles go to user layout
return <Redirect href="/(user)/(tabs)/home" />;
```

### 2. Auth State Check (`frontend/src/context/AuthContext.tsx`)
On app launch, the `AuthContext` checks:
- ✅ Is there an auth token? (user was logged in before)
- ✅ Is there user data? (cached user info)
- ✅ Has onboarding been completed?

```typescript
const checkAuthState = async () => {
  const token = await secureStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
  const userData = await storage.getItem(STORAGE_KEYS.USER_DATA);
  const onboardingComplete = await storage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  
  // Restore session if found
  if (token && userData) {
    dispatch({ type: "LOGIN_SUCCESS", payload: JSON.parse(userData) });
  }
  
  // Set onboarding status (false by default for new users)
  dispatch({ 
    type: "SET_ONBOARDING_COMPLETE", 
    payload: onboardingComplete === "true" 
  });
};
```

## Onboarding Flow (First-Time Users)

### Step 1: Splash Screen (`/(onboarding)/splash`)
- Shows ShipLink logo and brand
- Auto-redirects to features after 3 seconds

### Step 2: Features Screen (`/(onboarding)/features`)
- Shows 3 feature slides:
  1. Find trusted logistics companies
  2. Track shipments in real-time
  3. Get last-mile delivery
- User can skip or go through all slides
- Redirects to role selection

### Step 3: Role Selection (`/(onboarding)/role-selection`)
- Shows 2 initial roles:
  - **Importer/User** (default) - For buyers
  - **Driver** - For delivery service providers
- User selects their primary role
- Redirects to register screen with selected role

### Step 4: Registration (`/(auth)/register`)
- User fills in:
  - Name
  - Email
  - Phone
  - Password
  - Confirm Password
- Role is pre-filled from previous screen
- On successful registration:
  - User account created with selected role
  - Auth token stored securely
  - User data cached
  - Onboarding marked as complete
  - Redirect to appropriate home screen

## Login Flow (Returning Users)

### Login Screen (`/(auth)/login`)
- User enters email and password
- On successful login:
  - Backend returns user data with activeRole
  - Token stored securely
  - User data cached
  - Redirect based on activeRole:
    - `driver` → Driver dashboard
    - All others → User home

## Role System

### Default Role: "user"
- All new accounts start as "user" (buyer/importer)
- This role gives access to:
  - Home tab (find logistics, drivers, sourcing agents, coaches)
  - Track tab (track shipments)
  - Orders tab (view order history)
  - Profile tab (account settings, apply for more roles)

### Additional Roles
Users can apply for additional roles from the Profile tab:
- **Seller** - Sell products in marketplace
- **Driver** - Provide delivery services
- **Importation Coach** - Offer consulting services
- **Sourcing Agent** - Help with product sourcing

### Active Role
- Users can hold multiple roles simultaneously
- Only ONE role is active at a time
- Users can switch between approved roles
- The app adapts based on active role

### Role Application Process
1. User navigates to Profile → "Become a [Role]"
2. Fills out role-specific application form
3. Uploads verification documents
4. Submits application
5. Admin reviews and approves/rejects
6. Once approved, role appears in user's available roles
7. User can switch to that role from Profile

## Route Protection

### User Layout (`frontend/app/(user)/_layout.tsx`)
- Accessible to roles: user, seller, logistics-company, sourcing-agent, import-coach
- NOT accessible to driver (driver has its own layout)
- If not authenticated → redirect to login

### Driver Layout (`frontend/app/(driver)/_layout.tsx`)
- Only accessible to users with activeRole="driver"
- If not driver → redirect to home

## Storage Keys

### Secure Storage (expo-secure-store)
- `AUTH_TOKEN` - JWT authentication token

### Async Storage (@react-native-async-storage/async-storage)
- `USER_DATA` - Cached user profile data
- `ONBOARDING_COMPLETE` - "true" if user completed onboarding

## Admin Portal (NOT in Mobile App)
- Admins do NOT use the mobile app
- Admin portal is a separate web-based dashboard
- Admin routes exist in `frontend/app/(admin)/*` but are disabled
- The `(admin)/_layout.tsx` returns `null` to prevent rendering
- Admin authentication is handled separately via web dashboard

## Backend Integration

### Registration Endpoint
```
POST /api/auth/register
Body: { name, email, phone, password, role: "customer" | "driver" }
Returns: { user, token }
```

### Login Endpoint
```
POST /api/auth/login
Body: { email, password }
Returns: { user, token }
```

### Get Profile Endpoint
```
GET /api/users/profile
Headers: { Authorization: "Bearer <token>" }
Returns: { user: { id, name, email, activeRole, roles: [...] } }
```

## User Data Structure

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "user" | "driver" | "seller" | ...;  // Legacy field
  activeRole: string;  // Current active role
  roles: Array<{
    role: string;
    verified: boolean;
    verifiedAt?: string;
    requestedAt?: string;
  }>;
  avatar?: string;
  isSuspended?: boolean;
}
```

## Common Scenarios

### Scenario 1: Brand New User
1. Opens app for first time
2. `isLoading=true` → Shows loading spinner
3. No storage data found
4. `hasCompletedOnboarding=false` → Redirect to onboarding
5. Goes through: Splash → Features → Role Selection
6. Selects "Importer" role
7. Fills registration form
8. Creates account with role="user", activeRole="user"
9. Token + data stored
10. Onboarding marked complete
11. Redirected to `/(user)/(tabs)/home`

### Scenario 2: Returning User
1. Opens app
2. `isLoading=true` → Shows loading spinner
3. Finds token + user data in storage
4. `hasCompletedOnboarding=true`, `isAuthenticated=true`
5. activeRole="user"
6. Redirected directly to `/(user)/(tabs)/home`

### Scenario 3: User Who Cleared App Data
1. Opens app
2. No storage data found
3. `hasCompletedOnboarding=false`
4. Back to onboarding flow
5. At role selection, taps "Already have an account? Login"
6. Logs in with existing credentials
7. Account data restored from backend

### Scenario 4: User Applying for Driver Role
1. Logged in as "user"
2. Goes to Profile tab
3. Taps "Become a Driver"
4. Fills out driver application form
5. Submits for approval
6. Admin approves via web dashboard
7. User receives notification
8. In Profile, sees "Driver" role as available
9. Switches activeRole to "driver"
10. App refreshes and redirects to `/(driver)/(tabs)/dashboard`

## Troubleshooting

### Blank White Screen
Causes:
1. JavaScript error on initial render
2. Infinite redirect loop
3. Missing/corrupted storage data
4. Network error when checking auth

Solutions:
- Check Metro bundler console for errors
- Enable remote debugging
- Clear app storage and reinstall
- Check network connectivity

### Stuck on Loading Screen
Causes:
1. Auth check taking too long
2. Storage API not responding
3. Context not updating state

Solutions:
- Ensure `isLoading` is set to `false` in finally block
- Check AsyncStorage and SecureStore permissions
- Verify `checkAuthState` completes

### User Logged Out Unexpectedly
Causes:
1. Token expired
2. Backend returned 401
3. Storage cleared by OS

Solutions:
- Implement token refresh logic
- Handle 401 gracefully by redirecting to login
- User will need to log in again

## Summary

✅ **First-time users**: Onboarding → Role Selection → Register → User Home
✅ **Returning users**: Direct to login → User Home (or Driver Dashboard)
✅ **Default role**: Everyone starts as "user" (buyer)
✅ **Role expansion**: Apply from Profile tab after initial setup
✅ **No admin in mobile app**: Admin portal is web-only
✅ **Clean separation**: Mobile app is for end-users only

This flow ensures a smooth, intuitive experience for all user types while maintaining proper authentication and role-based access control.

