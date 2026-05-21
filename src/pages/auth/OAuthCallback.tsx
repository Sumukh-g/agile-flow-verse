/**
 * OAuth Callback Page
 * 
 * Handles OAuth redirects from providers (Google, Microsoft, GitHub, Apple)
 * and exchanges authorization codes for access tokens.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { handleOAuthCallback, OAuthProvider } from '@/lib/oauth';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: OAuthProvider }>();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      if (!provider) {
        setError('Invalid OAuth provider');
        return;
      }

      // Get authorization code and state from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      // Handle OAuth errors
      if (errorParam) {
        const errorDescription = searchParams.get('error_description') || 'Authentication failed';
        setError(errorDescription);
        toast.error(`OAuth error: ${errorDescription}`);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setError('Missing authorization code or state parameter');
        toast.error('Invalid OAuth callback. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Handle OAuth callback
        const response = await handleOAuthCallback(provider, code, state);

        // Update auth context
        // The tokens are already stored in localStorage by handleOAuthCallback
        // We just need to trigger a page reload or update the auth context
        toast.success('Authentication successful!');
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processCallback();
  }, [provider, searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Completing authentication...</CardTitle>
          <CardDescription>
            Please wait while we complete your sign-in
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {error ? (
            <>
              <div className="text-red-600 mb-4 text-center">
                <p className="font-semibold">Authentication Failed</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Processing your authentication...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;

