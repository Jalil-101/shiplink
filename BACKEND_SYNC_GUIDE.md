# 🔄 Backend Sync Guide

## Overview

Your monorepo is now set up to sync updates from the backend team's repository!

**Backend Team Repo:** `https://github.com/Anastasiaagyabeng25/Shilink_Backend.git`  
**Your Monorepo:** `https://github.com/Anastasiaagyabeng25/Shiplink_Frontend.git`

---

## 📋 Current Setup

```
Git Remotes:
├── origin (your monorepo)
│   └── https://github.com/Anastasiaagyabeng25/Shiplink_Frontend.git
│
└── backend-upstream (backend team's repo)
    └── https://github.com/Anastasiaagyabeng25/Shilink_Backend.git
```

**Structure:**
```
shiplink-fullstack/
├── backend/         # Syncs from backend team
├── frontend/        # Your frontend code
└── .git/           # Single Git repo (true monorepo)
```

---

## 🚀 How to Sync Backend Updates

### When Backend Team Pushes New Code:

**Option 1: Use the sync script (Easiest)**

```powershell
.\sync-backend.ps1
git push origin master
```

**Option 2: Manual sync (if you prefer)**

**Run these commands:**

```powershell
# Step 1: Remove old backend files temporarily
if (Test-Path temp-backend) { Remove-Item -Recurse -Force temp-backend }
if (Test-Path backend) { Remove-Item -Recurse -Force backend }

# Step 2: Clone latest backend code
git clone --depth 1 --branch main https://github.com/Anastasiaagyabeng25/Shilink_Backend.git temp-backend

# Step 3: Create backend folder and copy files
New-Item -ItemType Directory -Force -Path backend
Copy-Item -Recurse -Force temp-backend/* backend/
Remove-Item -Recurse -Force temp-backend\.git

# Step 4: Clean up temp folder and add to Git
Remove-Item -Recurse -Force temp-backend
git add backend/
git commit -m "Sync backend updates from backend team"
git push origin master
```

**What this does:**
1. ✅ Fetches latest code from backend team's `main` branch
2. ✅ Merges it into your `backend/` folder
3. ✅ Creates a single commit (squash) so your history stays clean
4. ✅ Automatically handles conflicts if any

---

### Step-by-Step Workflow

#### 1️⃣ Check for Backend Team Updates
```powershell
# Fetch latest info from backend team's repo
git fetch backend-upstream main
```

#### 2️⃣ Pull Backend Updates
```powershell
# Sync backend code
git subtree pull --prefix backend backend-upstream main --squash
```

**If there are conflicts:**
- Git will show which files have conflicts
- Open conflicting files in Cursor and resolve
- Then run:
  ```powershell
  git add .
  git commit -m "Merge backend team updates"
  ```

#### 3️⃣ Test Integration
```powershell
# Test that backend still works
cd backend
npm start

# In another terminal, test frontend
cd frontend
npx expo start
```

#### 4️⃣ Push to Your Monorepo
```powershell
# Push merged code to your repo
git push origin master
```

---

## 🎯 Complete Workflow Example

```powershell
# ========== START: Backend team just pushed updates ==========

# Step 1: Sync backend updates
git subtree pull --prefix backend backend-upstream main --squash

# Step 2: Test locally
cd backend
npm start
# ✅ Backend works

cd ../frontend
npx expo start
# ✅ Frontend connects to backend

# Step 3: Push to your monorepo
cd ..
git push origin master

# ========== DONE: Your monorepo now has latest backend code ==========
```

---

## ⚠️ Important Notes

### ✅ **DO:**
- Always pull backend updates using `git subtree pull`
- Test both backend and frontend after syncing
- Commit and push to your monorepo after merging

### ❌ **DON'T:**
- Don't directly clone backend repo inside your monorepo
- Don't create a `backend/.git` folder again
- Don't manually copy backend files

---

## 🔧 Troubleshooting

### Issue: "fatal: refusing to merge unrelated histories"

**Solution:**
```powershell
git subtree pull --prefix backend backend-upstream main --squash --allow-unrelated-histories
```

### Issue: Merge conflicts

**Solution:**
1. Open conflicting files in Cursor
2. Resolve conflicts (keep backend team's changes if unsure)
3. Run:
   ```powershell
   git add .
   git commit -m "Merge backend updates and resolve conflicts"
   git push origin master
   ```

### Issue: Want to see what changed in backend

**Before syncing:**
```powershell
# View backend team's latest commits
git fetch backend-upstream main
git log backend-upstream/main --oneline -10
```

**After syncing:**
```powershell
# View what changed in your backend folder
git log --oneline -- backend/
```

---

## 📊 Quick Reference

| Task | Command |
|------|---------|
| Sync backend updates | `git subtree pull --prefix backend backend-upstream main --squash` |
| Check backend team's commits | `git log backend-upstream/main --oneline -10` |
| View your monorepo remotes | `git remote -v` |
| Push to your monorepo | `git push origin master` |

---

## 💡 Pro Tips

1. **Sync regularly** - Pull backend updates daily or weekly to avoid large merge conflicts
2. **Communicate with backend team** - Ask them to notify you when they push major changes
3. **Test after every sync** - Always test integration after pulling backend updates
4. **Keep Cursor open** - Cursor AI can help resolve merge conflicts automatically

---

## 🆘 Need Help?

If you encounter issues:
1. Check this guide first
2. Ask Cursor AI to help resolve conflicts
3. Contact your project manager
4. Worst case: You can always re-pull from backend team's repo

---

## ✨ Summary

You now have a **true monorepo** with seamless backend sync!

```
Backend Team Updates → git subtree pull → Your Monorepo → Cursor AI sees everything
```

**One command to rule them all:**
```powershell
git subtree pull --prefix backend backend-upstream main --squash
```

Happy coding! 🚀

