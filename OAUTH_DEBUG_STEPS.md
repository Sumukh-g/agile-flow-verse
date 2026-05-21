# OAuth Debugging Steps

## Current Status
✅ Environment variables are correctly set:
- `GOOGLE_CLIENT_ID`: ✓ Set
- `GOOGLE_CLIENT_SECRET`: ✓ Set  
- `VITE_GOOGLE_CLIENT_ID`: ✓ Set

✅ Redirect URI configured in code: `http://localhost:5173/auth/callback/google`

## Next Steps to Debug

### 1. Verify Redirect URI in Google Cloud Console

**CRITICAL:** The redirect URI must match EXACTLY (no trailing slash, correct port, http not https for localhost).

1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Check **"Authorized redirect URIs"** section
5. **Must have EXACTLY:** `http://localhost:5173/auth/callback/google`
   - No trailing slash
   - Must be `http` (not `https`) for localhost
   - Port must be `5173`
6. If missing or different, click **Edit** → Add the URI → **Save**
7. **Wait 2-5 minutes** for changes to propagate

### 2. Restart Both Servers

After any `.env` changes, you MUST restart:

**Backend:**
```bash
# Stop the current backend (Ctrl+C)
npm run api:dev
```

**Frontend:**
```bash
# Stop the current frontend (Ctrl+C)
npm run dev
```

### 3. Check Browser Console

When you click "Continue with Google":

1. Open Browser DevTools (F12)
2. Go to **Console** tab
3. Look for:
   - `[OAUTH] Calling backend with redirectUri: ...`
   - Any error messages starting with `[OAUTH ERROR]`
4. Go to **Network** tab
5. Find the request to `/auth/oauth/callback`
6. Check:
   - Status code (should be 200)
   - Response body (should contain user and tokens)

### 4. Check Backend Logs

In your backend terminal, look for:

**Success logs:**
```
[OAUTH] Processing callback for provider: google
[OAUTH] Exchanging code for google with redirectUri: http://localhost:5173/auth/callback/google
[OAUTH] Successfully exchanged code for google access token
[OAUTH] Fetching user info from google using URL: https://www.googleapis.com/oauth2/v2/userinfo
[OAUTH] User [email] authenticated via google
```

**Error logs (if something fails):**
```
[OAUTH ERROR] Token exchange failed for google: [status] [statusText]
[OAUTH ERROR] Error details: [error message]
```

### 5. Common Issues and Solutions

#### Issue: "redirect_uri_mismatch"
**Cause:** Redirect URI doesn't match Google Cloud Console
**Solution:** 
- Verify the exact URI in Google Cloud Console
- Make sure there's no trailing slash
- Wait 2-5 minutes after saving

#### Issue: "invalid_grant"
**Cause:** Authorization code expired or already used
**Solution:** Try logging in again (codes expire in ~10 minutes)

#### Issue: "invalid_client"
**Cause:** Client ID or Secret is incorrect
**Solution:** 
- Verify `.env` file has correct values
- Restart backend server after changing `.env`

#### Issue: Backend returns 401
**Cause:** Backend couldn't exchange code for token
**Solution:** Check backend logs for detailed error message

### 6. Test the Flow

1. **Clear browser cache/cookies** for localhost (or use incognito mode)
2. Go to: `http://localhost:5173/signup`
3. Click: "Continue with Google"
4. Complete Google login
5. **Watch both:**
   - Browser console (F12)
   - Backend terminal logs

### 7. If Still Failing

Share these details:
1. **Exact error message** from browser console
2. **Backend log output** (especially `[OAUTH ERROR]` messages)
3. **Network request details** (F12 → Network → `/auth/oauth/callback` → Response)
4. **Screenshot** of Google Cloud Console showing your redirect URIs

## Quick Checklist

- [ ] Redirect URI added in Google Cloud Console: `http://localhost:5173/auth/callback/google`
- [ ] Waited 2-5 minutes after saving in Google Cloud Console
- [ ] Backend server restarted after adding `.env` variables
- [ ] Frontend server restarted after adding `.env` variables
- [ ] Both servers are running (backend on 3000, frontend on 5173)
- [ ] Browser console shows no JavaScript errors
- [ ] Backend logs show OAuth processing messages

