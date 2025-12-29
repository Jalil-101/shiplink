# Setup Your .env File

## ✅ Your MongoDB Connection String

I've formatted your connection string correctly. Here's what you need to do:

## 📝 Create .env File

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Create .env file:**
   - Copy `env.example` to `.env`
   - Or create a new file named `.env`

3. **Paste this content into .env:**

```env
# Server Configuration
PORT=5444
NODE_ENV=development

# MongoDB Connection
# Your connection string (formatted correctly)
MONGODB_URI=mongodb+srv://abdulmahama30_db_user:Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority

# JWT Secret (IMPORTANT: Change this to a random string!)
JWT_SECRET=shiplink-super-secret-jwt-key-2024-change-this-in-production
JWT_EXPIRE=7d

# API Configuration
API_BASE_URL=http://localhost:5444/api
```

## 🔍 What I Fixed

Your original string had:
```
mongodb+srv://abdulmahama30_db_user:@Ridwan2106@shiplink.c85onnm.mongodb.net/?appName=shiplink
```

**Fixed version:**
```
mongodb+srv://abdulmahama30_db_user:Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority
```

**Changes made:**
1. ✅ Removed extra `@` before password
2. ✅ Added database name: `/shiplink`
3. ✅ Added proper query parameters
4. ✅ Removed `appName` (not needed)

## 🔐 Generate a Better JWT Secret

**Important:** The JWT_SECRET should be a random string for security.

1. Go to: https://randomkeygen.com/
2. Copy a "CodeIgniter Encryption Keys" value
3. Replace `JWT_SECRET` in your `.env` file

Example:
```env
JWT_SECRET=8f7a3b2c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
```

## ✅ Test Your Setup

1. **Save the .env file**

2. **Start the backend:**
   ```bash
   cd backend
   npm install  # If you haven't already
   npm run dev
   ```

3. **You should see:**
   ```
   ✅ Connected to MongoDB
   🚀 Server running on port 5444
   📡 API available at http://localhost:5444/api
   🏥 Health check: http://localhost:5444/health
   ```

4. **Test in browser:**
   - Open: http://localhost:5444/health
   - Should see: `{"status":"OK","message":"ShipLink API is running",...}`

## 🚨 If Connection Fails

### Check MongoDB Atlas Settings:

1. **Network Access:**
   - Go to MongoDB Atlas → Network Access
   - Make sure your IP is allowed (or "Allow Access from Anywhere" for development)

2. **Database User:**
   - Go to MongoDB Atlas → Database Access
   - Verify user `abdulmahama30_db_user` exists
   - Verify password is correct

3. **Connection String:**
   - Double-check username and password in the connection string
   - Make sure there are no extra spaces

## ✅ Next Steps

Once backend is running:
1. ✅ Test registration: http://localhost:5444/api/auth/register
2. ✅ Test login: http://localhost:5444/api/auth/login
3. ✅ Start frontend and test the full app

## 🔒 Security Reminder

- ✅ `.env` is already in `.gitignore` (don't commit it!)
- ✅ Never share your connection string publicly
- ✅ Change JWT_SECRET before production
- ✅ Use environment variables in production hosting

---

**You're all set! Create the .env file with the content above and start your backend!** 🚀

