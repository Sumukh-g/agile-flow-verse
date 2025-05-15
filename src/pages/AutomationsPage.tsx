
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap } from 'lucide-react';

const AutomationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Zap className="mr-3 h-7 w-7 text-primary" />
          Automations
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Automations</CardTitle>
          <CardDescription>
            Streamline your workflows by setting up automated actions and triggers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Zap className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Automations Hub</h2>
            <p className="text-muted-foreground">
              This is where you'll be able to create, view, and manage all your project automations.
              <br />
              Content for this page is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationsPage;
