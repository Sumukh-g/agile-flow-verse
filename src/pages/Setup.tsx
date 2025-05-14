
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface SetupStepProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SetupStep = ({ title, description, children }: SetupStepProps) => (
  <div className="space-y-4 py-6">
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
    {children}
  </div>
);

const Setup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Setup form states
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    company: '',
    team: '',
    avatar: null
  });
  
  const [workspaceData, setWorkspaceData] = useState({
    name: '',
    description: '',
    type: 'personal',
    inviteTeam: false
  });
  
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: ['email-important', 'app-all'],
    features: ['tasks', 'projects', 'dashboard']
  });
  
  // Form change handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setWorkspaceData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };
  
  const updateNotificationPreference = (value: string) => {
    setPreferences(prev => {
      const currentNotifications = [...prev.notifications];
      
      if (currentNotifications.includes(value)) {
        return {
          ...prev,
          notifications: currentNotifications.filter(item => item !== value)
        };
      } else {
        return {
          ...prev,
          notifications: [...currentNotifications, value]
        };
      }
    });
  };
  
  const updateFeaturePreference = (value: string) => {
    setPreferences(prev => {
      const currentFeatures = [...prev.features];
      
      if (currentFeatures.includes(value)) {
        return {
          ...prev,
          features: currentFeatures.filter(item => item !== value)
        };
      } else {
        return {
          ...prev,
          features: [...currentFeatures, value]
        };
      }
    });
  };
  
  // Navigation functions
  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 2));
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  
  const completeSetup = () => {
    setLoading(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      // Save setup data
      localStorage.setItem('userSetup', JSON.stringify({
        profile: profileData,
        workspace: workspaceData,
        preferences
      }));
      
      setLoading(false);
      toast.success('Setup completed! Welcome to your workspace.');
      navigate('/dashboard');
    }, 1500);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome! Let's set up your workspace</CardTitle>
          <CardDescription>Complete these steps to get started with your account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="w-full mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of 3
              </span>
              <span className="text-sm text-muted-foreground">
                {currentStep === 0 && 'Your Profile'}
                {currentStep === 1 && 'Workspace Setup'}
                {currentStep === 2 && 'Preferences'}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Step 1: Profile Information */}
          {currentStep === 0 && (
            <SetupStep 
              title="Complete Your Profile" 
              description="Tell us a bit about yourself to personalize your experience."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName" 
                      value={profileData.firstName} 
                      onChange={handleProfileChange}
                      placeholder="John" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName" 
                      value={profileData.lastName} 
                      onChange={handleProfileChange}
                      placeholder="Doe" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input 
                    id="jobTitle" 
                    name="jobTitle" 
                    value={profileData.jobTitle} 
                    onChange={handleProfileChange}
                    placeholder="Product Manager" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input 
                      id="company" 
                      name="company" 
                      value={profileData.company} 
                      onChange={handleProfileChange}
                      placeholder="Acme Inc." 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Input 
                      id="team" 
                      name="team" 
                      value={profileData.team} 
                      onChange={handleProfileChange}
                      placeholder="Engineering" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="avatar">Profile Picture</Label>
                  <Input 
                    id="avatar" 
                    name="avatar" 
                    type="file" 
                    accept="image/*" 
                    className="cursor-pointer"
                    onChange={() => toast.info('Profile picture upload will be available in production')}
                  />
                </div>
              </div>
            </SetupStep>
          )}
          
          {/* Step 2: Workspace Setup */}
          {currentStep === 1 && (
            <SetupStep 
              title="Set Up Your Workspace" 
              description="Configure your workspace to match your team's needs."
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">Workspace Name</Label>
                  <Input 
                    id="workspaceName" 
                    name="name" 
                    value={workspaceData.name} 
                    onChange={handleWorkspaceChange}
                    placeholder="My Awesome Workspace" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workspaceDescription">Description (optional)</Label>
                  <Textarea 
                    id="workspaceDescription" 
                    name="description" 
                    value={workspaceData.description} 
                    onChange={handleWorkspaceChange}
                    placeholder="What is this workspace for?" 
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Workspace Type</Label>
                  <RadioGroup 
                    value={workspaceData.type} 
                    onValueChange={(value) => setWorkspaceData({ ...workspaceData, type: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="personal" id="personal" />
                      <Label htmlFor="personal" className="cursor-pointer">Personal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="team" id="team" />
                      <Label htmlFor="team" className="cursor-pointer">Team</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="organization" id="organization" />
                      <Label htmlFor="organization" className="cursor-pointer">Organization</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inviteTeam" 
                    name="inviteTeam"
                    checked={workspaceData.inviteTeam} 
                    onCheckedChange={(checked) => 
                      setWorkspaceData({ ...workspaceData, inviteTeam: checked as boolean })
                    } 
                  />
                  <Label htmlFor="inviteTeam" className="cursor-pointer">
                    Invite team members after setup
                  </Label>
                </div>
              </div>
            </SetupStep>
          )}
          
          {/* Step 3: Preferences */}
          {currentStep === 2 && (
            <SetupStep 
              title="Customize Your Experience" 
              description="Set your preferences to optimize your workflow."
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme Preference</Label>
                  <RadioGroup 
                    value={preferences.theme} 
                    onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-3 flex-1">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="cursor-pointer">Light</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3 flex-1">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="cursor-pointer">Dark</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3 flex-1">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="cursor-pointer">System Default</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Notification Preferences</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="email-important" 
                        checked={preferences.notifications.includes('email-important')} 
                        onCheckedChange={() => updateNotificationPreference('email-important')} 
                      />
                      <Label htmlFor="email-important" className="cursor-pointer">
                        Email notifications for important updates
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="email-all" 
                        checked={preferences.notifications.includes('email-all')} 
                        onCheckedChange={() => updateNotificationPreference('email-all')} 
                      />
                      <Label htmlFor="email-all" className="cursor-pointer">
                        Email notifications for all updates
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="app-all" 
                        checked={preferences.notifications.includes('app-all')} 
                        onCheckedChange={() => updateNotificationPreference('app-all')} 
                      />
                      <Label htmlFor="app-all" className="cursor-pointer">
                        In-app notifications
                      </Label>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Features You'll Use</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <Checkbox 
                        id="feature-tasks" 
                        checked={preferences.features.includes('tasks')} 
                        onCheckedChange={() => updateFeaturePreference('tasks')} 
                      />
                      <Label htmlFor="feature-tasks" className="cursor-pointer">
                        Task Management
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <Checkbox 
                        id="feature-projects" 
                        checked={preferences.features.includes('projects')} 
                        onCheckedChange={() => updateFeaturePreference('projects')} 
                      />
                      <Label htmlFor="feature-projects" className="cursor-pointer">
                        Project Management
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <Checkbox 
                        id="feature-calendar" 
                        checked={preferences.features.includes('calendar')} 
                        onCheckedChange={() => updateFeaturePreference('calendar')} 
                      />
                      <Label htmlFor="feature-calendar" className="cursor-pointer">
                        Calendar
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <Checkbox 
                        id="feature-dashboard" 
                        checked={preferences.features.includes('dashboard')} 
                        onCheckedChange={() => updateFeaturePreference('dashboard')} 
                      />
                      <Label htmlFor="feature-dashboard" className="cursor-pointer">
                        Dashboard
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <Checkbox 
                        id="feature-automation" 
                        checked={preferences.features.includes('automation')} 
                        onCheckedChange={() => updateFeaturePreference('automation')} 
                      />
                      <Label htmlFor="feature-automation" className="cursor-pointer">
                        Automations
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <Checkbox 
                        id="feature-reports" 
                        checked={preferences.features.includes('reports')} 
                        onCheckedChange={() => updateFeaturePreference('reports')} 
                      />
                      <Label htmlFor="feature-reports" className="cursor-pointer">
                        Reports
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </SetupStep>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            
            <Button
              type="button"
              onClick={currentStep < 2 ? nextStep : completeSetup}
              disabled={loading}
            >
              {loading && <span className="mr-2">Loading...</span>}
              {currentStep < 2 ? 'Continue' : 'Complete Setup'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;
