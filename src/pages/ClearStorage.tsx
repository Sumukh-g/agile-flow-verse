import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ClearStorage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Ready to clear');
  const [cleared, setCleared] = useState(false);

  const clearEverything = () => {
    setStatus('Clearing localStorage...');
    localStorage.clear();
    
    setTimeout(() => {
      setStatus('Clearing sessionStorage...');
      sessionStorage.clear();
    }, 300);

    setTimeout(() => {
      setStatus('✅ All cleared!');
      setCleared(true);
    }, 600);

    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-500 to-red-700 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">⚠️ Clear Browser Storage</CardTitle>
          <CardDescription className="text-center">
            You have old invalid tokens causing 401 errors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-yellow-800 mb-2">Why you need this:</p>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              <li>Old Keycloak tokens in your browser</li>
              <li>Backend rejects them (401 errors)</li>
              <li>Dashboard shows zeros</li>
              <li>Can't create/load data</li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium mb-4">{status}</p>
            
            {!cleared ? (
              <Button 
                onClick={clearEverything}
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                🧹 Clear Storage & Fix Now
              </Button>
            ) : (
              <div className="text-green-600 font-bold">
                Redirecting to login...
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">After clearing:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>You'll be redirected to login</li>
              <li>Login with: <code className="bg-gray-100 px-1 rounded">demo@example.com</code> / <code className="bg-gray-100 px-1 rounded">demo123</code></li>
              <li>Get new valid JWT tokens</li>
              <li>Everything will work!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClearStorage;

