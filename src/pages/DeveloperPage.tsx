
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code } from 'lucide-react';

const DeveloperPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Code className="mr-3 h-7 w-7 text-primary" />
          Developer Tools
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>API & Webhooks</CardTitle>
          <CardDescription>
            Access ProjectMaster data programmatically and build custom integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Code className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Developer Portal</h2>
            <p className="text-muted-foreground">
              Find API documentation, manage your API keys, and configure webhooks here.
              <br />
              Content for this page is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperPage;
