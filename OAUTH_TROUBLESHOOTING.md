# OAuth Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Authentication failed" Error

This error can occur for several reasons. Follow these steps to diagnose:

#### 1. Check Redirect URI Configuration

**The redirect URI must match EXACTLY** what's configured in Google Cloud Console.

**Current redirect URI in code:**
- Development: `http://localhost:5173/auth/callback/google`
- Production: `https://yourdomain.com/auth/callback/google`

**Steps to verify in Google Cloud Console:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Check the **Authorized redirect URIs** section
5. Make sure you have EXACTLY: `http://localhost:5173/auth/callback/google`
   - No trailing slash
   - Must be `http` (not `https`) for localhost
   - Must match the port (5173)

**If the redirect URI doesn't match:**
1. Click **Edit** on your OAuth client
2. Add the correct redirect URI: `http://localhost:5173/auth/callback/google`
3. Click **Save**
4. Wait a few minutes for changes to propagate

#### 2. Check Backend Server is Running

The OAuth callback requires the backend to be running to exchange the code for tokens.

**Verify backend is running:**
```bash
# Check if backend is running on port 3000
curl http://localhost:3000/health
```

**If backend is not running:**
```bash
npm run api:dev
```

#### 3. Check Environment Variables

**Frontend (.env file in root):**
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here
```

**Backend (.env file in root or src/api):**
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**Important:** After adding environment variables:
- **Frontend:** Restart the dev server (`npm run dev`)
- **Backend:** Restart the backend server (`npm run api:dev`)

#### 4. Check Browser Console

Open your browser's Developer Tools (F12) and check:
- **Console tab:** Look for error messages
- **Network tab:** Check the `/auth/oauth/callback` request
  - Status code should be 200
  - Check the response body for error details

#### 5. Check Backend Logs

Look at your backend terminal output for error messages. You should see:
- `[OAUTH] Processing callback for provider: google`
- `[OAUTH] Exchanging code for google with redirectUri: ...`
- Any error messages will show what went wrong

#### 6. Common Error Messages and Solutions

**Error: "redirect_uri_mismatch"**
- **Cause:** Redirect URI doesn't match Google Cloud Console
- **Solution:** Add the exact redirect URI to Google Cloud Console

**Error: "invalid_grant"**
- **Cause:** Authorization code expired or already used
- **Solution:** Try logging in again (codes expire quickly)

**Error: "invalid_client"**
- **Cause:** Client ID or Secret is incorrect
- **Solution:** Verify your environment variables are correct

**Error: "Failed to exchange OAuth code"**
- **Cause:** Backend couldn't exchange code for token
- **Solution:** Check backend logs for detailed error message

#### 7. Testing Steps

1. **Clear browser cache and cookies** for localhost
2. **Open browser in incognito/private mode** (to avoid cached issues)
3. **Go to:** `http://localhost:5173/signup`
4. **Click:** "Continue with Google"
5. **Complete Google login**
6. **Check:** Browser console and backend logs for errors

#### 8. Verify Google OAuth App Configuration

In Google Cloud Console, make sure:

1. **OAuth consent screen is configured:**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Must be in "Testing" or "Production" mode
   - Must have at least one test user (if in Testing mode)

2. **Scopes are correct:**
   - Required scopes: `openid`, `email`, `profile`
   - These are automatically requested by the app

3. **Application type is correct:**
   - Should be "Web application"
   - Not "Desktop app" or "Mobile app"

## Debug Checklist

- [ ] Backend server is running on port 3000
- [ ] Frontend server is running on port 5173
- [ ] `VITE_GOOGLE_CLIENT_ID` is set in frontend .env
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in backend .env
- [ ] Both servers were restarted after adding env variables
- [ ] Redirect URI in Google Cloud Console matches: `http://localhost:5173/auth/callback/google`
- [ ] OAuth consent screen is configured
- [ ] Browser console shows no JavaScript errors
- [ ] Backend logs show OAuth processing messages

## Still Having Issues?

1. **Check the exact error message** in:
   - Browser console (F12 → Console tab)
   - Backend terminal output
   - Network tab (F12 → Network → find `/auth/oauth/callback` request)

2. **Share the error details:**
   - The exact error message
   - Backend log output
   - Browser console errors
   - Network request/response details

