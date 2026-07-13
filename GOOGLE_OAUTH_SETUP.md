# Google OAuth Setup Guide

## Error: "The given origin is not allowed for the given client ID"

This error occurs when the domain where your frontend is running is not whitelisted in Google Cloud Console.

## How to Fix

### 1. Go to Google Cloud Console

Visit: https://console.cloud.google.com/apis/credentials

### 2. Find your OAuth 2.0 Client ID

Look for the client ID: `213370047582-omlbf5s59ccocfseu1ruib12i2rhuuvv.apps.googleusercontent.com`

### 3. Edit the Client ID

Click the pencil (edit) icon.

### 4. Add Authorized JavaScript Origins

Under **"Authorized JavaScript origins"**, add your frontend domains:

**For local development:**
```
http://localhost:5173
http://127.0.0.1:5173
http://localhost:5174
```

**For production (add your actual domain):**
```
https://your-domain.com
https://www.your-domain.com
```

### 5. Add Authorized Redirect URIs

Under **"Authorized redirect URIs"** (if using OAuth 2.0 web application), add:

```
http://127.0.0.1:8000/api/google-login
http://localhost:8000/api/google-login
https://your-domain.com/api/google-login
```

### 6. Save Changes

Click **SAVE**.

### 7. Restart your frontend

```bash
cd frontend
npm run dev
```

## Why This Happens

Google's OAuth 2.0 implementation requires explicit whitelisting of domains for security. The frontend must be served from one of the authorized origins, otherwise Google returns 403.

## Still Getting Errors?

1. Make sure you saved the changes in Google Cloud Console
2. Clear your browser cache and cookies
3. Wait 1-2 minutes for Google's servers to propagate the changes
4. Check that the frontend is actually running from the exact origin you added (e.g., `http://localhost:5173` not `http://127.0.0.1:5173` if you only added one)

## Note

The client ID `213370047582-omlbf5s59ccocfseu1ruib12i2rhuuvv.apps.googleusercontent.com` is currently configured in:
- `frontend/.env.example`
- `frontend/src/services/googleAuthService.ts` (fallback)