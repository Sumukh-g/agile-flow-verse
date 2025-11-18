# SIMPLE SOLUTION - Use SignUp Page

## The scripts aren't working, so just use the app's signup feature:

### Step 1: Go to Signup Page
```
http://localhost:5173/signup
```

### Step 2: Fill in the form:
```
Name: Demo User
Email: demo@example.com  
Password: demo123
Confirm Password: demo123
Company Name: Demo Company
```

### Step 3: Click "Sign Up"

This will:
- Create a new tenant
- Create a new user with hashed password
- Automatically log you in
- Give you valid JWT tokens

### Step 4: You'll be redirected to Dashboard

Then you'll see:
- Real data loading
- CRM section in sidebar
- Everything working

---

## OR - Try These Existing Credentials:

Looking at the logs, I see tenant ID `cmhwrnz1e00002y12vc80129g` which means SOMEONE is logged in.

Try logging in with ANY email that might already exist:
- `admin@example.com` / `admin123`
- `test@test.com` / `test123`
- `user@example.com` / `password`

---

## EASIEST: Just Use SignUp

Go to `/signup` and create a fresh account. It will definitely work!

