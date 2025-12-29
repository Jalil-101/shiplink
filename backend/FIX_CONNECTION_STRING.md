# Fix MongoDB Connection String

## 🔍 The Problem

Your original connection string had: `:@Ridwan2106`

This suggests your password might be `@Ridwan2106` (with the @ symbol), not just `Ridwan2106`.

## ✅ Solution: URL-Encode the Password

If your password is `@Ridwan2106`, the `@` symbol needs to be encoded as `%40`.

## 📝 Update Your .env File

Open `backend/.env` and change the MONGODB_URI line to one of these:

### Option 1: If password is `Ridwan2106` (no @)
```env
MONGODB_URI=mongodb+srv://abdulmahama30_db_user:Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority
```

### Option 2: If password is `@Ridwan2106` (with @)
```env
MONGODB_URI=mongodb+srv://abdulmahama30_db_user:%40Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority
```

**Note:** `%40` is the URL-encoded version of `@`

## 🔍 How to Know Which One?

1. **Check MongoDB Atlas:**
   - Go to: https://cloud.mongodb.com
   - Click "Database Access"
   - Find user: `abdulmahama30_db_user`
   - Click "Edit" to see/reset password
   - **Use the exact password shown there**

2. **Or get a fresh connection string:**
   - Go to MongoDB Atlas → Database → Connect
   - Choose "Connect your application"
   - Copy the string
   - Replace `<password>` with your actual password
   - Add `/shiplink` before the `?`

## 🚀 After Updating

1. **Save the .env file**
2. **Restart backend** (the nodemon should auto-restart, or press `Ctrl+C` and run `npm run dev` again)
3. **Look for**: `✅ Connected to MongoDB`

## 🆘 Still Not Working?

If it still fails, try:

1. **Reset the database user password** in MongoDB Atlas
2. **Get a fresh connection string** from Atlas
3. **Make sure Network Access** allows your IP (or "Allow from anywhere")

