# Firebase Google Sign-In Production Fix - Template

## Problem
Google Sign-in works locally but fails in production with redirect authentication.

## Root Cause
The production domain is not authorized in Firebase Console for OAuth redirects.

## Solution Steps

### 1. Get Your Production URL
Find your App Runner service URL:
```bash
aws apprunner describe-service \
  --service-arn <YOUR_SERVICE_ARN> \
  --query 'Service.ServiceUrl' \
  --output text
```

Example output: `xxxxx.us-east-1.awsapprunner.com`

### 2. Add Domain to Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Navigate to: **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your App Runner domain (without `https://`)
6. Click **Save**

### 3. Configure OAuth Redirect URI in Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (for Web application)
5. Click **Edit**
6. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-PROJECT.firebaseapp.com/__/auth/handler
   https://YOUR-APPRUNNER-DOMAIN.us-east-1.awsapprunner.com/__/auth/handler
   ```
7. Under **Authorized JavaScript origins**, add:
   ```
   https://YOUR-APPRUNNER-DOMAIN.us-east-1.awsapprunner.com
   ```
8. Click **Save**

### 4. Verify Firebase Config in Production

Check that environment variables are set in App Runner:
```bash
aws apprunner describe-service \
  --service-arn <YOUR_SERVICE_ARN> \
  --query 'Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables' \
  --output json
```

Required variables:
- `PROJECT_ID`
- `AUTH_DOMAIN` (usually `your-project.firebaseapp.com`)
- `API_KEY`
- `DATABASE_URL`

### 5. Test the Fix

After making the changes:
1. Wait 1-2 minutes for Firebase/Google to propagate changes
2. Go to your production forum page
3. Click "Sign in with Google"
4. Should redirect to Google sign-in
5. After signing in, should redirect back to your site

## Common Issues

### "unauthorized-domain" Error
- **Cause**: Domain not added to Firebase authorized domains
- **Fix**: Complete Step 2 above

### "redirect_uri_mismatch" Error
- **Cause**: OAuth redirect URI not configured
- **Fix**: Complete Step 3 above

### Sign-in Works But User Not Saved
- **Cause**: Session persistence issue
- **Fix**: Check browser console for errors

### Popup Blocked in Production
- **Cause**: Code trying to use popup in production
- **Fix**: The code should automatically use redirect. Verify:
  ```javascript
  // In forum.js - should return false in production
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  ```

## Architecture Notes

- **Local Development**: Uses popup authentication (ports not allowed in Firebase)
- **Production**: Uses redirect authentication (more reliable for mobile/browsers)
- **Session Duration**: 2 weeks with automatic activity tracking
- **Session Storage**: localStorage with key `wavelength_last_activity`

## Verification Commands

### Check domain reachability:
```bash
curl -I https://YOUR-DOMAIN/forum
```

### Check Firebase config in browser console:
```javascript
console.log(window.firebaseAuth);
console.log(window.location.hostname);
```

Should show Firebase auth object and production domain (not "localhost").

---

**Note**: Create a local copy named `FIREBASE_AUTH_PRODUCTION_FIX.md` with your actual values. 
This template file is safe to commit.
