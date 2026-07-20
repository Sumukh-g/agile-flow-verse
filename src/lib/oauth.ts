/**
 * OAuth Authentication Utilities
 * 
 * Provides OAuth integration for multiple providers:
 * - Google OAuth 2.0
 * - Microsoft Azure AD
 * - GitHub OAuth
 * - Apple Sign In
 * 
 * Each provider follows the OAuth 2.0 authorization code flow with PKCE for security.
 */

import { apiClient } from './api-client';
import { safeSetItem } from './storage-utils';
import { toast } from 'sonner';

// OAuth Provider Types
export type OAuthProvider = 'google' | 'microsoft' | 'github' | 'apple';

// OAuth Configuration
const OAUTH_CONFIG = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/callback/google`,
    scope: 'openid email profile',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  microsoft: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/callback/microsoft`,
    scope: 'openid email profile',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/callback/github`,
    scope: 'user:email',
    authUrl: 'https://github.com/login/oauth/authorize',
  },
  apple: {
    clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/callback/apple`,
    scope: 'name email',
    authUrl: 'https://appleid.apple.com/auth/authorize',
  },
};

/**
 * Generate a random code verifier for PKCE
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a code challenge from a verifier using SHA256
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a random state parameter for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Initiate OAuth flow for a specific provider
 * 
 * @param provider - The OAuth provider to use
 * @returns Promise that resolves when the OAuth flow is initiated
 */
export async function initiateOAuthFlow(provider: OAuthProvider): Promise<void> {
  const config = OAUTH_CONFIG[provider];
  
  if (!config.clientId) {
    toast.error(
      `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not configured. ` +
      `Please add VITE_${provider.toUpperCase()}_CLIENT_ID to your .env file. ` +
      `See OAUTH_SETUP.md for instructions.`
    );
    return;
  }

  try {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store PKCE parameters in sessionStorage for the callback
    sessionStorage.setItem(`oauth_${provider}_code_verifier`, codeVerifier);
    sessionStorage.setItem(`oauth_${provider}_state`, state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Add provider-specific parameters
    if (provider === 'microsoft') {
      params.append('response_mode', 'query');
    } else if (provider === 'apple') {
      params.append('response_mode', 'form_post');
    }

    // Redirect to OAuth provider
    window.location.href = `${config.authUrl}?${params.toString()}`;
  } catch (error) {
    console.error(`Failed to initiate ${provider} OAuth flow:`, error);
    toast.error(`Failed to start ${provider} authentication. Please try again.`);
  }
}

/**
 * Handle OAuth callback after user authorization
 * 
 * @param provider - The OAuth provider
 * @param code - Authorization code from OAuth provider
 * @param state - State parameter for CSRF protection
 * @returns Promise that resolves with user data and tokens
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string,
  state: string
): Promise<{ user: any; accessToken: string; refreshToken: string }> {
  try {
    // Verify state parameter
    const storedState = sessionStorage.getItem(`oauth_${provider}_state`);
    if (state !== storedState) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }

    // Get code verifier
    const codeVerifier = sessionStorage.getItem(`oauth_${provider}_code_verifier`);
    if (!codeVerifier) {
      throw new Error('Code verifier not found. Please try logging in again.');
    }

    // Exchange authorization code for tokens via backend
    console.log(`[OAUTH] Calling backend with redirectUri: ${OAUTH_CONFIG[provider].redirectUri}`);
    const response = await apiClient.post('/auth/oauth/callback', {
      provider,
      code,
      codeVerifier,
      redirectUri: OAUTH_CONFIG[provider].redirectUri,
    });

    // Clear OAuth session data
    sessionStorage.removeItem(`oauth_${provider}_code_verifier`);
    sessionStorage.removeItem(`oauth_${provider}_state`);

    // Store tokens and user data
    const success =
      safeSetItem('accessToken', response.accessToken) &&
      safeSetItem('refreshToken', response.refreshToken) &&
      safeSetItem('user', JSON.stringify(response.user)) &&
      safeSetItem('tenantId', response.user.tenantId);

    if (!success) {
      throw new Error('Failed to store authentication data.');
    }

    return response;
  } catch (error: any) {
    console.error(`[OAUTH ERROR] Callback error for ${provider}:`, error);
    console.error(`[OAUTH ERROR] Error details:`, {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    
    // Provide more helpful error messages
    let errorMessage = 'Authentication failed';
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Check if an OAuth provider is genuinely configured.
 *
 * Rejects empty values and the placeholder values shipped in env.example
 * (e.g. "your-google-client-id"), so we never advertise a provider that will
 * immediately fail when clicked.
 */
export function isOAuthProviderConfigured(provider: OAuthProvider): boolean {
  const clientId = OAUTH_CONFIG[provider].clientId;
  if (!clientId) return false;

  const placeholderPattern = /^your-|client-id$|changeme|placeholder/i;
  if (placeholderPattern.test(clientId)) return false;

  return true;
}

/**
 * Get available OAuth providers — only those that are actually configured.
 */
export function getAvailableOAuthProviders(): OAuthProvider[] {
  return (['google', 'microsoft', 'github', 'apple'] as OAuthProvider[]).filter(
    (provider) => isOAuthProviderConfigured(provider),
  );
}

