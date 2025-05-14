
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const Setup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    teamSize: '',
    industry: '',
    projectTypes: [] as string[],
    workflowDescription: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, teamSize: value }));
  };

  const handleProjectTypeToggle = (type: string) => {
    setFormData(prev => {
      const projectTypes = [...prev.projectTypes];
      if (projectTypes.includes(type)) {
        return { ...prev, projectTypes: projectTypes.filter(t => t !== type) };
      } else {
        return { ...prev, projectTypes: [...projectTypes, type] };
      }
    });
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.companyName) {
        toast.error("Please fill in all required fields");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.teamSize || formData.projectTypes.length === 0) {
        toast.error("Please select team size and at least one project type");
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      // Save setup data to localStorage
      localStorage.setItem('userSetup', JSON.stringify({
        ...formData,
        completed: true,
        setupDate: new Date().toISOString()
      }));
      
      toast.success("Setup completed successfully! Redirecting to dashboard...");
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-indigo-600 text-white p-2 rounded">PM</div>
            <span className="font-semibold text-2xl">ProjectMaster</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to ProjectMaster</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let's set up your account
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 ? "Personal Information" : 
               currentStep === 2 ? "Team & Projects" : "Workflow Setup"}
            </CardTitle>
            <CardDescription>
              Step {currentStep} of 3
            </CardDescription>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
            </div>
          </CardHeader>
          
          <form onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()}>
            <CardContent>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input 
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company/Organization Name</Label>
                    <Input 
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Acme Inc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input 
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      placeholder="Technology, Marketing, etc."
                    />
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Team Size</Label>
                    <RadioGroup 
                      value={formData.teamSize} 
                      onValueChange={handleRadioChange}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="solo" id="solo" />
                        <Label htmlFor="solo">Solo/Freelancer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="small" id="small" />
                        <Label htmlFor="small">Small Team (2-10)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium">Medium Team (11-50)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="large" id="large" />
                        <Label htmlFor="large">Large Team (50+)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Project Types (select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Software Development", "Marketing", "Design", "Research", "Construction", "Consulting", "Other"].map(type => (
                        <div
                          key={type}
                          className={`border rounded-md p-2 cursor-pointer ${
                            formData.projectTypes.includes(type) ? 'bg-indigo-50 border-indigo-300' : ''
                          }`}
                          onClick={() => handleProjectTypeToggle(type)}
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workflowDescription">Describe your workflow process</Label>
                    <Textarea 
                      id="workflowDescription"
                      name="workflowDescription"
                      value={formData.workflowDescription}
                      onChange={handleInputChange}
                      placeholder="How do you typically manage projects? What stages do they go through?"
                      rows={4}
                    />
                  </div>
                  
                  <div className="p-4 bg-indigo-50 rounded-md">
                    <h3 className="font-medium text-indigo-800">All Set!</h3>
                    <p className="text-sm text-indigo-600">
                      You can customize your workspace further after setup. Click "Complete Setup" to start using ProjectMaster.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <div className="flex justify-between w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                
                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? "Completing..." : "Complete Setup"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
