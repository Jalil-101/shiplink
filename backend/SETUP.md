# Quick Setup Guide

## Step 1: Install Dependencies
```bash
cd backend
npm install
```

## Step 2: Setup Environment Variables
1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and configure:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Generate a secure random string
   - `PORT` - Server port (default: 5444)

## Step 3: Start MongoDB
Make sure MongoDB is running:
- **Local**: `mongod` (if installed locally)
- **MongoDB Atlas**: Use your connection string in `.env`

## Step 4: Start the Server
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

## Step 5: Test the API
Visit: `http://localhost:5444/health`

You should see:
```json
{
  "status": "OK",
  "message": "ShipLink API is running",
  "timestamp": "..."
}
```

## Testing Registration
```bash
curl -X POST http://localhost:5444/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "password123",
    "role": "customer"
  }'
```

## Testing Login
```bash
curl -X POST http://localhost:5444/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Common Issues

### MongoDB Connection Error
- Check if MongoDB is running
- Verify connection string in `.env`
- For Atlas: Check IP whitelist and credentials

### Port Already in Use
- Change `PORT` in `.env`
- Or kill the process using port 5444

### Module Not Found
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

## Next Steps
1. Update frontend API URL to point to this backend
2. Test all endpoints
3. Deploy to production (Render, Heroku, etc.)


