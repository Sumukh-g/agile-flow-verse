/**
 * OAuth Button Component
 * 
 * Provides a styled button for OAuth authentication providers.
 * Supports Google, Microsoft, GitHub, and Apple sign-in.
 */

import { Button } from "@/components/ui/button";
import { initiateOAuthFlow, OAuthProvider } from "@/lib/oauth";
import { Chrome, Github, Apple } from "lucide-react";
import { useState } from "react";

interface OAuthButtonProps {
  provider: OAuthProvider;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

/**
 * Get provider-specific styling and icon
 */
const getProviderConfig = (provider: OAuthProvider) => {
  switch (provider) {
    case 'google':
      return {
        label: 'Continue with Google',
        icon: Chrome,
        bgColor: 'bg-white hover:bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
      };
    case 'microsoft':
      return {
        label: 'Continue with Microsoft',
        icon: Chrome, // Using Chrome icon as placeholder - you can add a Microsoft icon
        bgColor: 'bg-white hover:bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
      };
    case 'github':
      return {
        label: 'Continue with GitHub',
        icon: Github,
        bgColor: 'bg-gray-900 hover:bg-gray-800',
        textColor: 'text-white',
        borderColor: 'border-gray-900',
      };
    case 'apple':
      return {
        label: 'Continue with Apple',
        icon: Apple,
        bgColor: 'bg-black hover:bg-gray-900',
        textColor: 'text-white',
        borderColor: 'border-black',
      };
    default:
      return {
        label: `Continue with ${provider}`,
        icon: Chrome,
        bgColor: 'bg-white hover:bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
      };
  }
};

export const OAuthButton: React.FC<OAuthButtonProps> = ({ 
  provider, 
  variant = "outline",
  className = "" 
}) => {
  const [loading, setLoading] = useState(false);
  const config = getProviderConfig(provider);
  const Icon = config.icon;

  const handleClick = async () => {
    setLoading(true);
    try {
      await initiateOAuthFlow(provider);
    } catch (error) {
      console.error(`OAuth flow failed for ${provider}:`, error);
    } finally {
      // Don't set loading to false here since we're redirecting
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={loading}
      className={`w-full ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <Icon className="mr-2 h-4 w-4" />
      {loading ? 'Connecting...' : config.label}
    </Button>
  );
};

