# Role-Based Access Control Solution

## Problem
When users switch roles (e.g., from "user" to "import-coach"), they lose access to features that require their previous role. This creates a poor user experience where users must constantly switch roles to access different features.

## Root Cause
The `restrictTo` middleware in `backend/middleware/auth.js` only checked the user's `activeRole`, not whether the user HAS the required role in their `roles` array.

## Solution

### Backend Changes (`backend/middleware/auth.js`)

**Modified `restrictTo` middleware:**
- Now checks if user has ANY of the required roles in their `roles` array (verified)
- Allows access if user has the role, regardless of which role is currently active
- Still validates that the role is verified before allowing access
- Provides helpful error messages with hints

**Key Logic:**
1. Fast path: Check if `activeRole` matches (and is verified)
2. Fallback: Check if user has any required role in their `roles` array (verified)
3. Error handling: Provide detailed error info for frontend

### Frontend Changes

**New Utility (`frontend/src/utils/roleAccess.ts`):**
- `hasRole()`: Check if user has a verified role
- `canAccess()`: Check if user can access a feature
- `getBestRoleForAccess()`: Find the best role to switch to
- `handleRoleAccessError()`: Gracefully handle role access errors with user-friendly prompts
- `withRoleAccessHandling()`: Wrapper for API calls that handles role errors automatically

**Updated Screens:**
- `frontend/app/(user)/(tabs)/profile.tsx`: Uses role access handling for shipment stats
- `frontend/app/(user)/(tabs)/track.tsx`: Uses role access handling for shipment tracking
- `frontend/src/services/api.ts`: Enhanced 403 error handling to detect role access errors

## How It Works

### Example Scenario:
User has roles: `[user (verified), import-coach (verified)]`
- Active role: `import-coach`
- Tries to access: Shipment tracking (requires `user` role)

**Before Fix:**
- ❌ Error: "You don't have permission. Required role: user. Your active role: import-coach"
- User cannot access feature

**After Fix:**
- ✅ Backend checks: Does user have `user` role? Yes (verified)
- ✅ Access granted
- ✅ Feature works normally

**If user doesn't have the role:**
- Shows helpful prompt: "To access this feature, you need the 'user' role. Would you like to apply for it?"
- Or: "You have this role but it's not active. Switch roles to access this feature."

## Benefits

1. **Seamless Role Switching**: Users can switch roles without losing access to features
2. **Better UX**: Helpful prompts guide users to switch roles or apply for roles
3. **Flexible Access**: Users with multiple roles can access all their features
4. **Graceful Degradation**: App continues to work even when role access fails
5. **Clear Messaging**: Users understand what they need to do

## Implementation Status

✅ **Backend**: Complete
- `restrictTo` middleware updated
- Error messages enhanced
- Role verification checks in place

✅ **Frontend Utilities**: Complete
- `roleAccess.ts` utility created
- Error handling functions implemented
- Role checking helpers available

✅ **Frontend Integration**: Partial
- Profile screen: ✅ Updated
- Track screen: ✅ Updated
- Other screens: ⚠️ May need updates as issues arise

## Next Steps

1. **Monitor**: Watch for similar errors in other parts of the app
2. **Update**: Apply `withRoleAccessHandling` to other API calls that might need it
3. **Test**: Verify role switching works smoothly across all features
4. **Document**: Update API documentation to reflect this behavior

## Files Changed

### Backend
- `backend/middleware/auth.js` - Updated `restrictTo` middleware

### Frontend
- `frontend/src/utils/roleAccess.ts` - New utility (needs to be committed)
- `frontend/src/services/api.ts` - Enhanced 403 error handling (needs to be committed)
- `frontend/app/(user)/(tabs)/profile.tsx` - Added role access handling (needs to be committed)
- `frontend/app/(user)/(tabs)/track.tsx` - Added role access handling (needs to be committed)

## Testing

To test the fix:
1. Create a user with multiple roles (e.g., user + import-coach)
2. Switch to import-coach role
3. Try to access user features (shipment tracking, profile stats)
4. Should work seamlessly or show helpful prompt to switch roles


