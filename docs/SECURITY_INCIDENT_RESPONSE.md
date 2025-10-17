# 🚨 SECURITY INCIDENT RESPONSE GUIDE 🚨

## IMMEDIATE ACTIONS REQUIRED

### 1. **ROTATE ALL EXPOSED CREDENTIALS IMMEDIATELY**

The following credentials were exposed in your GitHub repository and must be rotated:

#### Firebase Credentials:
- **API Key**: `YOUR_FIREBASE_API_KEY` ⚠️ EXPOSED (but cannot be changed)
- **Project ID**: `wavelength-lore` 
- **App ID**: `YOUR_FIREBASE_APP_ID` ❌ COMPROMISED (this CAN be changed)

#### AWS Credentials:
- **Access Key ID**: `AKIASPFRQ6WB5DS[REDACTED]` ❌ COMPROMISED  
- **Secret Access Key**: `Oh5MSAmKb7NUyJ9v[REDACTED]` ❌ COMPROMISED

#### YouTube API Key:
- **API Key**: `AIzaSyDEsAFgYaBlttBdjh[REDACTED]` ❌ COMPROMISED

### 2. **IMMEDIATE STEPS TO TAKE**

#### A. Firebase Security - DETAILED STEPS:

**Step 1: Access Firebase Console**
1. Go to https://console.firebase.google.com/
2. Login with your Google account
3. Click on your "wavelength-lore" project

**Step 2: Find Your Web App**
1. Once in your project, look for a **gear icon ⚙️** in the left sidebar (next to "Project Overview")
2. Click the gear icon and select **"Project settings"**
3. In the Project Settings page, scroll down to **"Your apps"** section
4. You should see a web app with an icon that looks like **`</>`** 

**Step 3: Get Current Config (BEFORE deleting)**
1. Click on the web app (the `</>` icon)
2. Scroll down and click **"Config"** 
3. **COPY the config object** - you'll need the structure but with NEW values
4. It should look like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "wavelength-lore.firebaseapp.com",
     databaseURL: "https://wavelength-lore-default-rtdb.firebaseio.com",
     projectId: "wavelength-lore",
     storageBucket: "wavelength-lore.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcd1234"
   };
   ```

**Step 4: Delete the Compromised Web App**
1. Still in the web app settings, scroll down
2. Look for **"Delete app"** button (usually at the bottom)
3. Click **"Delete app"**
4. Type the app name to confirm deletion
5. Click **"Delete app"** to confirm

**Step 5: Create New Web App**
1. Back in Project Settings, in the "Your apps" section
2. Click **"Add app"** button
3. Select the **Web platform** (the `</>` icon)
4. Enter an app nickname (like "Wavelength Lore Forum")
5. **Check the box** "Also set up Firebase Hosting" (optional)
6. Click **"Register app"**

**Step 6: Get New Config**
1. Firebase will show you the new config object
2. **COPY this entire config** - these are your NEW safe credentials
3. **IMPORTANT**: The `apiKey` will be the SAME (it's project-level), but `appId` will be different
4. The NEW `appId` is what makes this secure - it's a new app registration
5. Click **"Continue to console"**

**⚠️ CLARIFICATION: Why API Key Stays the Same**
- The `apiKey` is **project-level** - it doesn't change when you create new apps
- The `appId` is **app-specific** - this is what changes and provides security
- Think of it like: same building (project/apiKey), new apartment number (appId)

**🚨 IMPORTANT: You CANNOT Change the Firebase Project API Key**
- Firebase API keys are **permanent** and tied to the project
- If you need a completely new API key, you would need to create a **new Firebase project**
- **However, this is NOT necessary for security!** Here's why:

**Alternative Security Approaches (RECOMMENDED):**

**Option 1: Firebase App Check (Recommended)**
1. Go to Firebase Console → Project Settings → App Check
2. Enable App Check for your web app
3. This adds an additional security layer beyond the API key
4. Prevents unauthorized apps from using your Firebase resources

**Option 2: Restrict API Key Usage**
1. Go to Google Cloud Console → APIs & Services → Credentials  
2. Click on your Firebase API key
3. Add **Application restrictions**:
   - HTTP referrers: `*.wavelength-lore.com`, `localhost:*`
   - This prevents the key from being used on other domains

**Option 3: Firebase Security Rules**
1. Strengthen your Firebase Database security rules
2. Require authentication for all operations
3. Limit read/write access based on user authentication

**Why the current approach IS secure:**
- ✅ Old `appId` deleted (this is the main security benefit)
- ✅ API key restrictions can be added (Google Cloud Console)
- ✅ Firebase App Check provides additional protection
- ✅ Database security rules control access

**Step 7: Update Your .env File**
Replace your .env values with the NEW ones:
```bash
API_KEY="same_as_before_this_is_normal"  # ✅ This stays the same - it's project-level
AUTH_DOMAIN="wavelength-lore.firebaseapp.com"  # This stays the same
DATABASE_URL="https://wavelength-lore-default-rtdb.firebaseio.com"  # This stays the same
PROJECT_ID="wavelength-lore"  # This stays the same
STORAGE_BUCKET="wavelength-lore.firebasestorage.app"  # This stays the same
MESSAGING_SENDER_ID="your_new_sender_id"  # This might change
APP_ID="your_new_app_id"  # ✅ This WILL be different - this is the key security change
```

**🔑 SECURITY EXPLANATION:**
- **API Key staying the same is NORMAL** - it's tied to your Firebase project
- **APP_ID changing is what provides security** - it's a new app registration
- The compromised config had both the API key AND the specific App ID
- By changing the App ID, you've invalidated the old configuration

**Step 8: Test Your Application**
1. Save your updated `.env` file
2. Restart your Node.js application
3. Test that Firebase connection still works
4. **NO FIREBASE CLI COMMANDS NEEDED** - just update .env and restart app

**IMPORTANT: What you DON'T need to do:**
- ❌ `firebase login` - Not needed for web app config changes
- ❌ `firebase init` - Not needed, your project is already initialized  
- ❌ `firebase deploy` - Not needed unless you're using Firebase Hosting
- ❌ Any Firebase CLI commands - The web app config is just client credentials

**What you ARE doing:**
- ✅ Just replacing client-side configuration values
- ✅ Your database, hosting, and functions stay exactly the same
- ✅ Only the frontend connection credentials change

#### B. AWS Security - DETAILED BEST PRACTICES:

**Step 1: Access AWS Console**
1. Go to https://console.aws.amazon.com/
2. Login to your AWS account
3. Navigate to **IAM (Identity and Access Management)** service

**Step 2: Delete Compromised Key IMMEDIATELY**
1. In IAM, click **"Users"** in left sidebar
2. Find and click on the user that owns key: **AKIASPFRQ6WB5DS[REDACTED]**
3. Click **"Security credentials"** tab
4. Find the access key **AKIASPFRQ6WB5DS[REDACTED]**
5. Click **"Delete"** and confirm deletion
6. **DO THIS FIRST** - Don't create new key until old one is deleted

**Step 3: Review What Permissions You Actually Need**
Before creating a new key, determine minimal permissions needed:
- **S3 bucket access?** (for file uploads)
- **CloudFront distributions?** (for CDN)
- **SES email sending?** (for notifications)
- **Lambda functions?** (for serverless)

**Step 4: Create New Access Key with MINIMAL Permissions**

**Option A: Create IAM User with Limited Permissions (RECOMMENDED)**
1. In IAM, click **"Users"** → **"Create user"**
2. Username: `wavelength-lore-app-user`
3. **Attach policies directly** → Click **"Create policy"**
4. Use **Visual Editor** and add ONLY what you need:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:ListBucket"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name"
       }
     ]
   }
   ```
5. Name the policy: `WavelengthLoreMinimalPolicy`
6. Attach this policy to your new user
7. Create access key for this user

**Step 5: Security Best Practices for New Key**
1. **Enable MFA** on the AWS account (not the key, but the root account)
2. **Set up CloudTrail** to log all API calls
3. **Enable AWS Config** to monitor configuration changes
4. **Use least privilege** - only grant permissions you actually use
5. **Rotate keys every 90 days** (set calendar reminder)
6. **Never commit keys to code** (you already learned this!)

**Step 6: Additional Security Measures**
1. **IP Restrictions**: In IAM policy, add IP restrictions if possible:
   ```json
   {
     "Condition": {
       "IpAddress": {
         "aws:SourceIp": ["YOUR.SERVER.IP.HERE/32"]
       }
     }
   }
   ```
2. **Time-based Access**: Restrict access to business hours if appropriate
3. **Resource Restrictions**: Lock down to specific S3 buckets/resources only

**Step 7: Test New Credentials**
1. Update your `.env` file:
   ```bash
   AWS_ACCESS_KEY_ID="your_new_access_key"
   AWS_SECRET_ACCESS_KEY="your_new_secret_key"
   AWS_REGION="us-east-1"  # or your preferred region
   ```
2. Test AWS functionality in your app
3. Monitor CloudTrail for the first few API calls to ensure they work

**Step 8: Monitor for Unauthorized Usage**
1. Check **CloudTrail Event History** for the old compromised key
2. Look for any API calls you didn't make
3. Check your **AWS Billing** for unexpected charges
4. Set up **AWS Budgets** alerts for unusual spending

#### C. YouTube/Google API Security - DETAILED NAVIGATION:

**Step 1: Access Google Cloud Console (NOT Firebase Console)**
1. Go to https://console.cloud.google.com/ (different from Firebase!)
2. Login with your Google account
3. **Select the correct project** - look for "wavelength-lore" or similar in the project dropdown at the top

**Step 2: Navigate to API Credentials**
1. In the left sidebar, look for **"APIs & Services"** 
2. Click **"APIs & Services"** → **"Credentials"**
3. OR use the search bar at top and search for "credentials"

**Step 3: Find Your Compromised API Key**
1. On the Credentials page, look for **"API Keys"** section
2. You should see a list of API keys
3. Look for key: **AIzaSyDEsAFgYaBlttBdjh[REDACTED]**
4. It might be named something like:
   - "Browser key"
   - "Server key" 
   - "YouTube API Key"
   - Or just "API Key" with creation date

**Step 4: Check What Services This Key Accesses**
1. Click on the key name or the edit icon (pencil)
2. Look at **"API restrictions"** - this shows what APIs it can access
3. Common ones: YouTube Data API v3, Maps API, Firebase API, etc.

**Step 5: Delete the Compromised Key**
1. In the key details, look for **"Delete"** button (usually red)
2. OR go back to credentials list and click the trash/delete icon next to the key
3. Confirm deletion when prompted
4. **DO THIS IMMEDIATELY** - don't wait

**Step 6: Create New Restricted API Key**
1. Back on Credentials page, click **"+ CREATE CREDENTIALS"**
2. Select **"API key"**
3. A new key will be generated - **COPY IT IMMEDIATELY**
4. Click **"RESTRICT KEY"** (very important!)

**Step 6.5: Enable Required APIs (IMPORTANT!)**
**If you don't see YouTube APIs in restrictions, you need to enable them first:**

1. **Go to APIs & Services** → **"Library"** (in left sidebar)
2. **Search for "YouTube Data API v3"**
3. Click on **"YouTube Data API v3"**
4. Click **"ENABLE"** button
5. Wait for it to enable (may take a minute)
6. **Repeat for any other APIs you need:**
   - YouTube Analytics API (if you use analytics)
   - YouTube Reporting API (if you need reports)
   - Maps API (if you use Google Maps)
   - Any other Google APIs your app uses

**Alternative: Enable APIs through API Dashboard**
1. Go to **"APIs & Services"** → **"Dashboard"**
2. Click **"+ ENABLE APIS AND SERVICES"** at the top
3. Search for "YouTube Data API v3" 
4. Click on it and click **"ENABLE"**

**Step 7: Now Properly Restrict Your New Key**
1. **Go back to Credentials** → Edit your new API key
2. **Name your key**: "Wavelength Lore YouTube API - 2025"
3. **Application restrictions**: Choose based on your setup:
   - **HTTP referrers** if used in browser (add your domain like `*.wavelength-lore.com`)
   - **IP addresses** if used on server (add your server IP)
   - **None** only if absolutely necessary (NOT recommended)
4. **API restrictions**: 
   - Select **"Restrict key"**
   - Now you should see **YouTube Data API v3** in the list!
   - Choose **ONLY** the APIs you actually use:
     - ✅ YouTube Data API v3 (if you need YouTube)
     - ✅ YouTube Analytics API (if you track analytics)
     - ❌ Don't enable APIs you don't use
5. Click **"SAVE"**

**Common APIs You Might Need to Enable:**
- **YouTube Data API v3** - For video info, playlists, channels
- **YouTube Analytics API** - For video performance data
- **YouTube Reporting API** - For channel reports
- **Maps JavaScript API** - If you use Google Maps
- **Geocoding API** - If you convert addresses to coordinates
- **Places API** - If you search for places

**Troubleshooting: Can't Find Your Key?**

**Option A: Check All Projects**
1. At the top of Google Cloud Console, click the project dropdown
2. Switch between different projects you might have
3. Check each project's credentials

**Option B: Check Through Firebase**
1. Go to https://console.firebase.google.com/
2. Select your wavelength-lore project
3. Project Settings → General tab
4. Scroll down to "Web API Key" - this might be the same key

**Option C: Search by Key Value**
1. In Google Cloud Console, use the search bar
2. Search for: "AIzaSyDEsAFgYaBlttBdjh[REDACTED]"
3. It might show up in search results

**Option D: Check Billing**
1. Go to "Billing" in Google Cloud Console
2. Look for API usage charges
3. This can help identify which project has the API key

**Step 8: Update Your Application**
```bash
# Update your .env file:
YOUTUBE_API_KEY="your_new_restricted_api_key_here"
```

## 🔒 FINAL SECURITY INCIDENT COMPLETION CHECKLIST

### Phase 1: Credential Rotation ✅
- [ ] **Firebase**: Delete old web app, create new one, update .env
- [ ] **AWS**: Delete compromised key, create new IAM user with minimal permissions, update .env  
- [ ] **YouTube**: Delete old API key, create new restricted key, update .env

### Phase 2: Verification & Testing 🧪
- [ ] **Update .env file** with ALL new credentials (no old values remaining)
- [ ] **Test application functionality**:
  ```bash
  # Test your app still works with new credentials
  npm start
  # or
  node index.js
  ```
- [ ] **Verify Firebase connection** - check forum posts load
- [ ] **Verify AWS services** - check file uploads/CDN if applicable  
- [ ] **Verify YouTube API** - check video embeds/data if applicable

### Phase 3: Security Hardening 🛡️
- [ ] **Commit .env changes** (the template files, NOT the .env with secrets)
- [ ] **Update .gitignore** to ensure .env is never committed:
  ```bash
  echo ".env" >> .gitignore
  echo ".env.local" >> .gitignore
  echo ".env.*.local" >> .gitignore
  ```
- [ ] **Force push changes** to overwrite Git history with exposed keys:
  ```bash
  git add -A
  git commit -m "Security: Replace hardcoded credentials with environment variables"
  git push --force-with-lease
  ```

### Phase 4: Monitoring & Documentation 📊
- [ ] **Monitor for 48 hours**:
  - Check AWS CloudTrail for unauthorized API calls
  - Monitor Firebase usage dashboard
  - Watch Google Cloud Console for unusual API usage
  - Check billing for unexpected charges
- [ ] **Set up alerts**:
  - AWS Budget alerts for spending
  - Firebase usage quotas
  - Google Cloud billing alerts
- [ ] **Schedule next key rotation** (90 days from now)

### Phase 5: Incident Closure 📝
- [ ] **Create incident summary**:
  - What happened: GitHub detected exposed credentials in repository
  - Impact: Potential unauthorized access to Firebase, AWS, YouTube APIs
  - Resolution: All credentials rotated, environment variables implemented
  - Lessons learned: Never commit credentials, use .env files properly
- [ ] **Archive this security response document**
- [ ] **Update team/documentation** about proper credential management

### 🚨 IMMEDIATE ACTION REQUIRED:
**Your .env file still contains the OLD COMPROMISED Firebase APP_ID!**

Update your .env file RIGHT NOW with your new Firebase credentials:
```bash
# The API_KEY stays the same (this is normal and cannot be changed):
API_KEY="YOUR_FIREBASE_API_KEY"  # ✅ SAME - this is normal!

# But you MUST update the APP_ID with the new one from Firebase Console:
APP_ID="your_new_app_id_from_firebase_console"  # ✅ This MUST be different!
```

**🔑 CLARIFICATION OF WHAT NEEDS TO CHANGE:**
- ❌ **API Key CANNOT be changed** - it's permanent for the project
- ✅ **APP_ID MUST be changed** - this is what provides security
- ✅ **AWS credentials MUST be changed** - create new access keys
- ✅ **YouTube API key MUST be changed** - create new restricted key

### 📋 POST-INCIDENT BEST PRACTICES:
1. **Never commit .env files** to any repository
2. **Use .env.example** templates without real values
3. **Rotate credentials every 90 days** 
4. **Use minimal permissions** for all API keys
5. **Enable monitoring/alerts** for all cloud services
6. **Regular security audits** of your repositories

---
**Incident Status: 🟡 PENDING** (waiting for .env update and testing)
**Next Action: Update .env file with new Firebase credentials, then test application**

### 3. **WHAT I'VE ALREADY FIXED**

✅ **Removed hardcoded credentials** from all forum template files
✅ **Replaced with environment variables** using EJS templating
✅ **Created .env.example** template for future reference
✅ **Verified .gitignore** includes .env file

#### Fixed Files:
- `views/forum/home-page.ejs`
- `views/forum/create-post-page.ejs` 
- `views/forum/post-page.ejs`
- `views/forum/user-profile.ejs`
- `views/forum/recent.ejs`
- `views/forum/category-page.ejs`

### 4. **NEXT STEPS FOR YOU**

#### A. Update Your .env File:
```bash
# After rotating credentials, update .env with NEW values:
API_KEY="your_new_firebase_api_key"
AUTH_DOMAIN="wavelength-lore.firebaseapp.com"
DATABASE_URL="https://wavelength-lore-default-rtdb.firebaseio.com"
PROJECT_ID="wavelength-lore"
STORAGE_BUCKET="wavelength-lore.firebasestorage.app"
MESSAGING_SENDER_ID="your_new_sender_id"
APP_ID="your_new_app_id"

# New AWS Credentials
ACCESS_KEY_ID="your_new_aws_access_key"
SECRET_ACCESS_KEY="your_new_aws_secret_key"

# New YouTube API Key
YOUTUBE_API_KEY="your_new_youtube_api_key"
```

#### B. Verify Security:
1. **Test the application** after updating credentials
2. **Monitor logs** for any issues
3. **Set up proper monitoring** for future credential usage
4. **Consider using AWS Secrets Manager** for production

#### C. Git History Cleanup:
1. **Consider using git filter-branch** to remove credentials from git history
2. **Or create a fresh repository** if history cleanup is too complex
3. **Force push** cleaned history (⚠️ coordinate with team first)

### 5. **PREVENTION FOR FUTURE**

✅ **Environment Variables**: Already implemented
✅ **.gitignore**: Already configured
🔄 **Consider**: 
- AWS Secrets Manager for production
- Firebase App Check for additional security
- API key restrictions and quotas
- Regular credential rotation schedule
- Security scanning tools (like GitGuardian)

### 6. **TIMELINE FOR ACTION**

- **IMMEDIATE** (next 1 hour): Rotate Firebase and AWS credentials
- **TODAY**: Update .env file and test application  
- **THIS WEEK**: Implement additional security measures
- **ONGOING**: Monitor for unauthorized usage

---

**⚠️ CRITICAL**: Do not commit any more code until ALL credentials are rotated and the .env file is updated with the new secure values.