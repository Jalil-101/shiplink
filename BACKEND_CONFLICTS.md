# Backend Conflicts Documentation

## 🚨 Critical Issue: Role Validation Mismatch

### The Problem

There is a **fundamental conflict** between the backend controller validation and the database schema:

1. **Controller** (`backend/src/controllers/auth.controller.ts:80`) accepts: `"customer"` or `"driver"`
2. **Database** (`backend/src/models/user.model.ts:27`) only allows: `"user"` or `"driver"`

### Conflict Flow

```
Frontend sends: role = "customer"
         ↓
Controller validates: ✅ "customer" is accepted (line 80)
         ↓
Controller tries to save: new User({ role: "customer" })
         ↓
Mongoose validation: ❌ "customer" NOT in enum ['user', 'driver']
         ↓
Result: 500 Internal Server Error
```

### Code Locations

#### Backend Controller
**File:** `backend/src/controllers/auth.controller.ts`
```typescript
// Line 80-82: Accepts "customer"
if (role !== 'customer' && role !== 'driver') {
    return res.status(400).json({ error: "Role must be either customer or driver" });
}

// Line 90-95: Tries to save "customer" directly (WILL FAIL)
const new_user = new User({
    name,
    email,
    phone,
    password,
    role  // ❌ If role="customer", Mongoose will reject it
});
```

#### Backend Database Model
**File:** `backend/src/models/user.model.ts`
```typescript
// Line 27: Database enum only allows "user" or "driver"
role: { type: String, enum: ['user', 'driver'], required: true },
// ❌ "customer" is NOT in this enum!
```

### Frontend Workarounds

Since the backend cannot be changed (it's live), the frontend implements workarounds:

#### 1. Registration Transformation
**File:** `frontend/src/context/AuthContext.tsx:234`
```typescript
// Frontend sends "customer" to match controller validation
role: String(userData.role === "user" ? "customer" : userData.role) as "customer" | "driver",
```

**Problem:** This causes a 500 error because the database rejects "customer".

#### 2. Response Transformation
**File:** `frontend/src/context/AuthContext.tsx:259-260`
```typescript
// Handle backend response which may return "customer" or "user"
const backendRole = response.user.role;
const frontendRole = (backendRole === "customer" || backendRole === "user") ? "user" : backendRole;
```

#### 3. Type Definitions
**File:** `frontend/src/types/api.ts:23,36`
```typescript
// Types must accommodate all possible backend responses
role: "customer" | "user" | "driver"; // Backend inconsistency
```

### Required Backend Fix

The backend controller needs to transform `"customer"` → `"user"` before saving:

```typescript
// In auth.controller.ts, line 90-95 should be:
const new_user = new User({
    name,
    email,
    phone,
    password,
    role: role === 'customer' ? 'user' : role  // ✅ Transform "customer" to "user"
});
```

### Current Status

- ✅ Frontend correctly sends data matching controller expectations
- ❌ Backend controller doesn't transform "customer" → "user" before saving
- ❌ Database rejects "customer" causing 500 errors
- ✅ Frontend handles response transformation for consistency

### Impact

- **Registration fails** with 500 Internal Server Error when role="customer"
- **Login works** because it only reads from database (which has "user" or "driver")
- **Frontend code is complex** due to role transformations needed to work around backend issue




