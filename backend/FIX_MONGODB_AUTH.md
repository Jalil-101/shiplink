# Fix MongoDB Authentication Error

## ❌ Error: "bad auth : authentication failed"

This means the username or password in your connection string is incorrect.

## 🔍 Your Original Connection String

```
mongodb+srv://abdulmahama30_db_user:@Ridwan2106@shiplink.c85onnm.mongodb.net/?appName=shiplink
```

## 🔧 Possible Issues

### Issue 1: Password Has Special Characters
If your password contains special characters (like `@`, `#`, `%`, etc.), they need to be URL-encoded.

### Issue 2: Wrong Username/Password
The credentials might not match what's in MongoDB Atlas.

## ✅ Solution Steps

### Step 1: Verify MongoDB Atlas Credentials

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Click "Database Access"** (left sidebar)
3. **Find your user**: `abdulmahama30_db_user`
4. **Check the password** - Make sure it matches `Ridwan2106`
5. **If password is different**, you have two options:
   - **Option A**: Use the correct password in connection string
   - **Option B**: Reset the password (click "Edit" → "Edit Password")

### Step 2: URL-Encode Password (If Needed)

If your password has special characters, encode them:

- `@` becomes `%40`
- `#` becomes `%23`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `=` becomes `%3D`

**Example:**
- Password: `@Ridwan2106`
- Encoded: `%40Ridwan2106`
- Connection string: `mongodb+srv://abdulmahama30_db_user:%40Ridwan2106@shiplink...`

### Step 3: Update .env File

Open `backend/.env` and update the connection string:

**If password is `Ridwan2106` (no special chars):**
```env
MONGODB_URI=mongodb+srv://abdulmahama30_db_user:Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority
```

**If password is `@Ridwan2106` (with @ symbol):**
```env
MONGODB_URI=mongodb+srv://abdulmahama30_db_user:%40Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority
```

**If password is different:**
```env
MONGODB_URI=mongodb+srv://abdulmahama30_db_user:YOUR_ACTUAL_PASSWORD@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority
```

### Step 4: Test Connection

1. **Save the .env file**
2. **Restart backend** (press `Ctrl+C` then `npm run dev`)
3. **Check for**: `✅ Connected to MongoDB`

## 🔍 Quick Check: Get New Connection String

The easiest way is to get a fresh connection string from MongoDB Atlas:

1. Go to MongoDB Atlas → **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. **Replace `<password>`** with your actual password
6. **Add database name**: Change `?retryWrites...` to `/shiplink?retryWrites...`

## 🚨 Common Mistakes

1. ❌ Forgetting to replace `<password>` placeholder
2. ❌ Not URL-encoding special characters in password
3. ❌ Using wrong username
4. ❌ Missing database name in connection string
5. ❌ Extra spaces in connection string

## ✅ Correct Format

```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
```

**Your format should be:**
```
mongodb+srv://abdulmahama30_db_user:PASSWORD@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority
```

## 🎯 Next Steps

1. Verify password in MongoDB Atlas
2. Update `.env` file with correct password (URL-encoded if needed)
3. Restart backend
4. Should see: `✅ Connected to MongoDB`

