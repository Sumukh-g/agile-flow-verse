# OAuth Authentication Setup Guide

This application supports OAuth authentication with multiple providers:
- **Google** - Google Sign-In
- **Microsoft** - Microsoft Azure AD / Microsoft Account
- **GitHub** - GitHub OAuth
- **Apple** - Apple Sign In

## Frontend Configuration

Add the following environment variables to your `.env` file (or `.env.local`):

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id

# GitHub OAuth
VITE_GITHUB_CLIENT_ID=your-github-client-id

# Apple OAuth
VITE_APPLE_CLIENT_ID=your-apple-client-id
```

## Backend Configuration

Add the following environment variables to your backend `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Apple OAuth
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
```

## Provider Setup Instructions

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure the OAuth consent screen
6. Set authorized redirect URIs:
   - `http://localhost:5173/auth/callback/google` (development)
   - `https://yourdomain.com/auth/callback/google` (production)
7. Copy the Client ID and Client Secret

### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set redirect URI:
   - `http://localhost:5173/auth/callback/microsoft` (development)
   - `https://yourdomain.com/auth/callback/microsoft` (production)
5. Go to "Certificates & secrets" → "New client secret"
6. Copy the Application (client) ID and Client secret value

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL:
   - `http://localhost:5173/auth/callback/github` (development)
   - `https://yourdomain.com/auth/callback/github` (production)
4. Copy the Client ID
5. Generate a Client Secret and copy it

### Apple OAuth Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Create a new App ID and enable "Sign in with Apple"
4. Create a Services ID
5. Configure redirect URLs:
   - `http://localhost:5173/auth/callback/apple` (development)
   - `https://yourdomain.com/auth/callback/apple` (production)
6. Create a Key for Sign in with Apple
7. Copy the Services ID (Client ID) and Key ID

## How It Works

1. **User clicks OAuth button** → Frontend initiates OAuth flow
2. **User authorizes** → Redirected to OAuth provider
3. **Provider redirects back** → `/auth/callback/:provider` with authorization code
4. **Backend exchanges code** → Gets access token from provider
5. **Backend gets user info** → Retrieves user email/name from provider
6. **Backend creates/updates user** → Creates account if new, updates if existing
7. **Backend generates JWT tokens** → Returns access/refresh tokens
8. **Frontend stores tokens** → User is logged in

## Security Features

- **PKCE (Proof Key for Code Exchange)** - Prevents authorization code interception
- **State parameter** - CSRF protection
- **Secure token storage** - Tokens stored in localStorage with safe handling
- **HTTPS required** - OAuth providers require HTTPS in production

## Testing

1. Start the development server
2. Navigate to `/login` or `/signup`
3. Click on an OAuth provider button (only configured providers will show)
4. Complete the OAuth flow
5. You should be redirected to the dashboard upon successful authentication

## Notes

- OAuth buttons only appear if the provider is configured (has a Client ID)
- If a user already exists with the same email, they will be logged in
- New users are automatically assigned to a new tenant
- OAuth users don't have passwords (password field is null)

