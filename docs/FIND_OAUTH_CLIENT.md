# How to Find OAuth 2.0 Client in Google Cloud Console

## Step-by-Step Instructions

### 1. Access Google Cloud Console
Go to: https://console.cloud.google.com/

### 2. Select Your Project
- Click the project dropdown at the top of the page
- Find and select: **wavelength-lore**
- OR use direct link: https://console.cloud.google.com/apis/credentials?project=wavelength-lore

### 3. Navigate to Credentials
From the left sidebar:
1. Click **APIs & Services**
2. Click **Credentials**

OR use the hamburger menu (☰) → **APIs & Services** → **Credentials**

### 4. Find OAuth 2.0 Client IDs
On the Credentials page, you'll see a table with different credential types:
- API keys
- OAuth 2.0 Client IDs ← **This is what you need**
- Service accounts

Look for entries under **OAuth 2.0 Client IDs** section.

### 5. Identify the Web Application Client
You should see one or more OAuth 2.0 Client IDs. Look for:
- **Type**: Web application
- **Name**: Might be "Web client 1" or "wavelength-lore" or similar

Click on the name to edit it.

### 6. What If You Don't See Any OAuth 2.0 Clients?

If there are no OAuth 2.0 clients, you need to create one:

1. Click **+ CREATE CREDENTIALS** at the top
2. Select **OAuth client ID**
3. If prompted, configure the consent screen first:
   - Click **CONFIGURE CONSENT SCREEN**
   - Choose **External** (unless you have a Google Workspace)
   - Fill in:
     - App name: **Wavelength Lore**
     - User support email: Your email
     - Developer contact: Your email
   - Click **SAVE AND CONTINUE**
   - Skip scopes (click **SAVE AND CONTINUE**)
   - Add test users if needed
   - Click **BACK TO DASHBOARD**

4. Now create the OAuth client:
   - Application type: **Web application**
   - Name: **Wavelength Lore Web Client**
   - Authorized JavaScript origins:
     ```
     https://wavelength-lore.firebaseapp.com
     https://vh9x3gevev.us-east-1.awsapprunner.com
     ```
   - Authorized redirect URIs:
     ```
     https://wavelength-lore.firebaseapp.com/__/auth/handler
     https://vh9x3gevev.us-east-1.awsapprunner.com/__/auth/handler
     ```
   - Click **CREATE**

5. Save the Client ID and Client Secret shown (you'll need the Client ID for Firebase)

### 7. Verify Firebase Is Using This OAuth Client

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select **wavelength-lore** project
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Check that the **Web SDK configuration** shows your Client ID
6. If not, click **Edit** and paste your Client ID from Google Cloud Console

## Quick Links

- **Google Cloud Credentials**: https://console.cloud.google.com/apis/credentials?project=wavelength-lore
- **Firebase Auth Settings**: https://console.firebase.google.com/project/wavelength-lore/authentication/providers
- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent?project=wavelength-lore

## Common Issues

### "OAuth client not found" in Firebase
- **Cause**: Firebase and Google Cloud are not linked properly
- **Fix**: Make sure you're in the same project in both consoles

### Multiple OAuth clients
- **Cause**: Created multiple clients over time
- **Fix**: Use the one that Firebase references, or consolidate to one client

### Can't find the project
- **Cause**: Wrong Google account or project not accessible
- **Fix**: Make sure you're signed in with the correct Google account that owns the Firebase project

## Screenshot Locations (What to Look For)

When on the Credentials page, you should see:
```
OAuth 2.0 Client IDs
┌─────────────────────────────────────────────────────┐
│ Name                    │ Type            │ Created │
├─────────────────────────────────────────────────────┤
│ Web client (auto)       │ Web application │ ...     │ ← Click this
└─────────────────────────────────────────────────────┘
```

---
**Project**: wavelength-lore
**Date**: October 20, 2025
