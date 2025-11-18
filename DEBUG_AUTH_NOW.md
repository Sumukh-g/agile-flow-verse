# Debug Auth - See Exactly What's Happening

## I just added debug logging to show EXACTLY why tokens fail.

### What I Added:
1. **`[AUTH DEBUG]`** logs in `auth.service.ts` - shows token verification process
2. **`[GUARD DEBUG]`** logs in `jwt-auth.guard.ts` - shows what the guard is doing

### To See the Debug Logs:

A new command window should have opened titled "Backend API Debug". 

If not, open a terminal and run:
```bash
cd C:\Users\cenas\.cursor\worktrees\agile-flow-verse\2H0ES
npm run api:dev
```

Watch the console output when you try to access the app.

---

## Now Do This To Test:

### Step 1: In Browser Console (F12 → Console)
```javascript
// Clear everything
localStorage.clear();
sessionStorage.clear();

// Go to login
window.location.href = '/login';
```

### Step 2: Try Logging In
Use: `test@test.com` / `Test123!`

Watch the **Backend terminal window** - you'll see:
- `[GUARD DEBUG] Public route allowed: /v1/auth/login` ← Login attempt
- Either success or error message

### Step 3: If Login Works
You'll be redirected to Dashboard. Watch the backend logs when Dashboard loads:
- `[GUARD DEBUG] Protected route: /v1/projects`
- `[GUARD DEBUG] Authorization header present: true`
- `[AUTH DEBUG] Verifying token, length: XXX`
- Either SUCCESS or FAILURE with exact reason

---

## Common Issues & What Debug Logs Will Show:

### Issue 1: Token Too Short/Malformed
```
[AUTH DEBUG] Token preview: undefined...
[AUTH DEBUG] Local JWT verification FAILED: jwt malformed
```
**Fix**: Browser has corrupt token, need to clear localStorage

### Issue 2: Wrong Secret
```
[AUTH DEBUG] Local JWT verification FAILED: invalid signature  
```
**Fix**: Token signed with different secret, need fresh login

### Issue 3: Token Expired
```
[AUTH DEBUG] Local JWT verification FAILED: jwt expired
```
**Fix**: Need to refresh or re-login

### Issue 4: Missing tenantId
```
[AUTH DEBUG] REJECTED: No tenantId in token
```
**Fix**: Backend login needs to include tenantId in token payload

---

## What the Debug Logs Will Tell Us:

The logs will show EXACTLY which line is failing:
1. Is token being sent? → `Authorization header present`
2. Can backend decode it? → `Local JWT verification SUCCESS/FAILED`  
3. Does it have required fields? → `No userId` or `No tenantId`
4. Does guard allow it? → `Request ALLOWED` or `REJECTED`

---

## After You Test:

**Send me a screenshot or copy-paste of the backend console logs** when you:
1. Try to login
2. Try to access Dashboard

I'll see exactly what's failing and fix it immediately.

---

## Expected Good Flow:

```
[GUARD DEBUG] Public route allowed: /v1/auth/login
[GUARD DEBUG] Protected route: /v1/projects
[GUARD DEBUG] Authorization header present: true
[AUTH DEBUG] Verifying token, length: 245
[AUTH DEBUG] JWT_SECRET set: true
[AUTH DEBUG] Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...
[AUTH DEBUG] Local JWT verification SUCCESS
[AUTH DEBUG] Decoded payload: {"sub":"user-id","tenantId":"tenant-id","email":"test@test.com"}
[AUTH DEBUG] User permissions loaded: 0
[GUARD DEBUG] Token verified, user: user-id tenant: tenant-id
[GUARD DEBUG] Request ALLOWED
```

**Clear storage, login, and send me the logs!**

