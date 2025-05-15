
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const AdminPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Shield className="mr-3 h-7 w-7 text-primary" />
          Admin Panel
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>
            Manage users, billing, security, and other workspace-level configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Shield className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Administration</h2>
            <p className="text-muted-foreground">
              Control and customize your ProjectMaster workspace settings from this central hub.
              <br />
              Content for this page is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
