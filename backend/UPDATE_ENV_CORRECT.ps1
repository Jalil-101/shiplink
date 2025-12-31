# PowerShell script to update .env with correct MongoDB connection string
# Password: @Ridwan2106 (needs to be URL-encoded as %40Ridwan2106)

$envContent = @"
# Server Configuration
PORT=5444
NODE_ENV=development

# MongoDB Connection
# Password @Ridwan2106 is URL-encoded as %40Ridwan2106
MONGODB_URI=mongodb+srv://abdulmahama30_db_user:%40Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority

# JWT Secret (IMPORTANT: Change this to a random string for production!)
JWT_SECRET=shiplink-super-secret-jwt-key-2024-change-this-in-production
JWT_EXPIRE=7d

# API Configuration
API_BASE_URL=http://localhost:5444/api
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8
Write-Host "✅ .env file updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Password @Ridwan2106 has been URL-encoded as %40Ridwan2106" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Change JWT_SECRET to a random string before production!" -ForegroundColor Yellow





