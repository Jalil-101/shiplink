# Building Android APK for Testing

## Prerequisites

1. **Expo Account** (free)

   - Sign up at: https://expo.dev
   - You'll need this to use EAS Build

2. **EAS CLI** (Expo Application Services)

   - Install globally: `npm install -g eas-cli`
   - Login: `eas login`

3. **Verify API URL**
   - Your production API is already set: `https://shiplink-q4hu.onrender.com/api`
   - This is configured in `frontend/src/services/api.ts`

---

## Step-by-Step Build Process

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

Enter your Expo account credentials (create one at expo.dev if needed).

### Step 3: Configure EAS Build (Already Done ✅)

The `eas.json` file has been created with the correct configuration:

- **Preview build**: Builds APK for internal testing
- **Production build**: Builds APK for production

### Step 4: Build APK

Navigate to the frontend directory:

```bash
cd frontend
```

**For Preview/Testing Build:**

```bash
eas build --platform android --profile preview
```

**For Production Build:**

```bash
eas build --platform android --profile production
```

### Step 5: Wait for Build

- Build takes 10-20 minutes
- You'll see progress in the terminal
- You can also check status at: https://expo.dev/accounts/[your-username]/projects/shiplink/builds

### Step 6: Download APK

Once build completes:

- You'll get a download link in the terminal
- Or download from: https://expo.dev/accounts/[your-username]/projects/shiplink/builds
- Click "Download" to get the APK file

### Step 7: Install on Android Device

1. Transfer APK to your Android device
2. Enable "Install from Unknown Sources" in Android settings
3. Tap the APK file to install
4. Open the app and test!

---

## Build Profiles Explained

### Preview Profile

- **Purpose**: Internal testing
- **Output**: APK file
- **Distribution**: Internal (not for Play Store)
- **Best for**: Testing with team/beta testers

### Production Profile

- **Purpose**: Production release
- **Output**: APK file
- **Distribution**: Can be submitted to Play Store
- **Best for**: Final release

---

## Important Notes

### API Configuration

- ✅ Production API URL is already set: `https://shiplink-q4hu.onrender.com/api`
- The app will automatically use this in production builds
- No additional configuration needed

### Build Time

- First build: ~15-20 minutes (downloads dependencies)
- Subsequent builds: ~10-15 minutes

### Build Costs

- **Free tier**: Limited builds per month
- **Paid tier**: Unlimited builds
- For MVP testing, free tier should be sufficient

### APK Size

- Expected size: ~30-50 MB
- Includes all dependencies and assets

---

## Troubleshooting

### "EAS CLI not found"

```bash
npm install -g eas-cli
```

### "Not logged in"

```bash
eas login
```

### "Build failed"

- Check the build logs at expo.dev
- Common issues:
  - Missing dependencies
  - Configuration errors
  - Network issues

### "APK won't install"

- Enable "Install from Unknown Sources" in Android settings
- Make sure APK is for the correct architecture (arm64-v8a, armeabi-v7a, x86_64)

---

## Alternative: Local Build (Advanced)

If you want to build locally (requires Android Studio):

```bash
cd frontend
npx expo prebuild
npx expo run:android
```

This generates native Android project and builds locally.

---

## Next Steps After Building

1. **Test on Real Devices**

   - Install APK on multiple Android devices
   - Test all features
   - Check performance

2. **Gather Feedback**

   - Share with beta testers
   - Document bugs/issues
   - Collect user feedback

3. **Iterate**
   - Fix any issues found
   - Rebuild with fixes
   - Continue testing cycle

---

## Quick Command Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build preview APK
cd frontend
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Check build status
eas build:list

# View build details
eas build:view [build-id]
```

---

**Ready to build? Start with Step 1!** 🚀
