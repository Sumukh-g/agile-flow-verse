import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Debug: React.FC = () => {
  const navigate = useNavigate();
  
  const storageData = {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: localStorage.getItem('user'),
    tenantId: localStorage.getItem('tenantId'),
  };

  const clearAndLogin = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Access Token:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {storageData.accessToken || 'NONE'}
            </pre>
          </div>
          
          <div>
            <strong>Refresh Token:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {storageData.refreshToken || 'NONE'}
            </pre>
          </div>
          
          <div>
            <strong>User:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {storageData.user || 'NONE'}
            </pre>
          </div>
          
          <div>
            <strong>Tenant ID:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {storageData.tenantId || 'NONE'}
            </pre>
          </div>

          <div className="pt-4">
            <Button onClick={clearAndLogin} className="w-full" variant="destructive">
              Clear Everything & Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Debug;

