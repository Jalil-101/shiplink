# Backend Sync Script
# Run this script whenever backend team pushes updates

Write-Host "🔄 Syncing backend updates from backend team..." -ForegroundColor Cyan

# Step 1: Clean up old temp files
if (Test-Path temp-backend) {
    Remove-Item -Recurse -Force temp-backend
    Write-Host "✓ Removed old temp-backend folder" -ForegroundColor Green
}

if (Test-Path backend) {
    Remove-Item -Recurse -Force backend
    Write-Host "✓ Removed old backend folder" -ForegroundColor Green
}

# Step 2: Clone latest backend code
Write-Host "📥 Cloning latest backend code..." -ForegroundColor Yellow
git clone --depth 1 --branch main https://github.com/Anastasiaagyabeng25/Shilink_Backend.git temp-backend

# Step 3: Create backend folder and copy files
Write-Host "📁 Copying files to backend folder..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path backend | Out-Null
Copy-Item -Recurse -Force temp-backend/* backend/
Remove-Item -Recurse -Force backend\.git -ErrorAction SilentlyContinue

# Step 4: Clean up temp folder
Remove-Item -Recurse -Force temp-backend
Write-Host "✓ Cleaned up temp folder" -ForegroundColor Green

# Step 5: Add to Git
Write-Host "📝 Staging backend files..." -ForegroundColor Yellow
git add backend/

# Step 6: Show what changed
Write-Host "`n📊 Changes to be committed:" -ForegroundColor Cyan
git status --short

# Step 7: Commit
Write-Host "`n💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Sync backend updates from backend team"

Write-Host "`n✅ Backend sync complete!" -ForegroundColor Green
Write-Host "📤 Push to your repo with: git push origin master" -ForegroundColor Cyan

