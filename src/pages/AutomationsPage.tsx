
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Zap, Mail, Calendar, Link as LinkIcon } from 'lucide-react'; // Added Mail, Calendar, LinkIcon

const AutomationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Zap className="mr-3 h-7 w-7 text-primary" />
          Automations & Integrations
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Your Automations</CardTitle>
          <CardDescription>
            Streamline your workflows by setting up automated actions and triggers.
            Detailed automation configuration is typically managed within each project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Automations Hub</h2>
            <p className="text-muted-foreground">
              Centrally view insights about your automations or discover new templates.
              <br />
              To create or manage specific rules, navigate to the automation tab within a project.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5 text-primary" />
            Email & Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your email and calendar to streamline task management and scheduling.
            <br />
            <span className="text-sm text-amber-600 font-medium">
              Note: Full functionality for these features requires backend integration (e.g., with Supabase).
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center mb-2">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              Create Items via Email
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Each project can have a unique email address. Send an email to this address to automatically create a new task or issue. (Requires backend setup for email processing).
            </p>
            <div className="flex items-center gap-2">
              <Input type="email" defaultValue="project-tasks+[projectID]@example.com" readOnly className="bg-gray-100"/>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText("project-tasks+[projectID]@example.com")}>Copy Example</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Actual email addresses would be generated per project upon backend integration.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold flex items-center mb-2">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              Calendar Sync
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Keep your project deadlines and personal calendar aligned. (Requires backend for iCal generation and sync logic).
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ical-feed" className="font-medium">iCal Feed Subscription</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Subscribe to a read-only iCal feed of project due dates in your calendar app.
                </p>
                <div className="flex items-center gap-2">
                  <Input id="ical-feed" type="text" defaultValue="webcal://example.com/ical/[projectID].ics" readOnly  className="bg-gray-100"/>
                  <Button variant="outline" size="sm">
                    <LinkIcon className="mr-1 h-3 w-3" /> Get Feed URL
                  </Button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-way-sync" className="font-medium">Two-Way Calendar Sync (Optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable full two-way synchronization with calendars like Google Calendar or Outlook. (Requires OAuth and backend processing).
                    </p>
                  </div>
                  <Switch id="two-way-sync" disabled />
                </div>
                <Button variant="default" size="sm" className="mt-2" disabled>
                  Connect Calendar Provider
                </Button>
              </div>
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="text-lg font-semibold flex items-center mb-2">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              Embed Calendar Views
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Display project timelines or task calendars within external documents or platforms using embeddable views. (Requires backend to serve embeddable content).
            </p>
             <Button variant="outline" size="sm" disabled>
              Get Embed Code
            </Button>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                The features above are UI representations. True functionality depends on backend services. 
                We recommend integrating with Supabase to power these capabilities. <a href="https://docs.lovable.dev/integrations/supabase/" target="_blank" rel="noopener noreferrer" className="underline text-primary">Learn more about Supabase integration</a>.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AutomationsPage;
