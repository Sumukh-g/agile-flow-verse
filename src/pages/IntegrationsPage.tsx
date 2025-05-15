
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Layers } from 'lucide-react';

const IntegrationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Layers className="mr-3 h-7 w-7 text-primary" />
          Integrations
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Tools</CardTitle>
          <CardDescription>
            Enhance ProjectMaster by integrating with your favorite third-party applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Layers className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Integrations Marketplace</h2>
            <p className="text-muted-foreground">
              Discover and manage integrations to connect ProjectMaster with other services you use.
              <br />
              Content for this page is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsPage;
