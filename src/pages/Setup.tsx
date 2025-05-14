
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

const setupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  company: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  role: z.string().min(1, { message: "Please select your role." }),
  teamSize: z.string().min(1, { message: "Please select your team size." }),
});

type SetupFormValues = z.infer<typeof setupSchema>;

const Setup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: "",
      company: "",
      role: "",
      teamSize: "",
    },
  });

  const onSubmit = (data: SetupFormValues) => {
    // In a real application, we would save this data to the user profile
    localStorage.setItem('userSetup', JSON.stringify(data));
    toast.success("Setup completed successfully!");
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen bg-muted/40 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Team</CardTitle>
          <CardDescription>Complete your setup to get started ({step}/{totalSteps})</CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company or Team Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="designer">Designer</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="teamSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Size</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="solo">Just me</SelectItem>
                            <SelectItem value="small">2-5 people</SelectItem>
                            <SelectItem value="medium">6-20 people</SelectItem>
                            <SelectItem value="large">21-100 people</SelectItem>
                            <SelectItem value="enterprise">100+ people</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Choose your workspace preferences</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border cursor-pointer hover:border-primary" onClick={() => toast.success("Project Management selected!")}>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl mb-2">📊</div>
                        <div className="font-medium">Project Management</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border cursor-pointer hover:border-primary" onClick={() => toast.success("Task Tracking selected!")}>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl mb-2">✅</div>
                        <div className="font-medium">Task Tracking</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border cursor-pointer hover:border-primary" onClick={() => toast.success("Document Collaboration selected!")}>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl mb-2">📝</div>
                        <div className="font-medium">Document Collaboration</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border cursor-pointer hover:border-primary" onClick={() => toast.success("Team Communication selected!")}>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl mb-2">💬</div>
                        <div className="font-medium">Team Communication</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              {step > 1 ? (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/login')}
                >
                  Cancel
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button 
                  type="button"
                  onClick={() => {
                    const currentStepFields = step === 1 
                      ? ['name', 'company'] 
                      : ['role', 'teamSize'];
                    
                    const canContinue = currentStepFields.every(
                      field => form.getValues(field as keyof SetupFormValues)
                    );
                    
                    if (canContinue) {
                      setStep(step + 1);
                    } else {
                      currentStepFields.forEach(field => 
                        form.trigger(field as keyof SetupFormValues)
                      );
                    }
                  }}
                >
                  Continue
                </Button>
              ) : (
                <Button type="submit">
                  Complete Setup
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default Setup;
