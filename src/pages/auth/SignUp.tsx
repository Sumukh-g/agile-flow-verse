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
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from "sonner";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (!formData.password) {
      toast.error("Password is required");
      return;
    }
    
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);
    
    try {
      // Call real signup API
      const response = await apiClient.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        tenantName: 'My Company', // Optional tenant name
      });

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('tenantId', response.user.tenantId);

      toast.success("Account created successfully!");
      
      // Reload page to trigger auth context to pick up new user
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error?.response?.data?.message || error?.message || "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignup = async () => {
    setLoading(true);
    
    try {
      // Create a demo user
      const mockUser = {
        id: Date.now().toString(),
        name: 'Demo User',
        email: 'demo@example.com',
        roles: ['user']
      };
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('tenantId', 'dev');
      
      // Update the auth context
      setUser(mockUser);
      
      toast.success("Demo account created! Redirecting to dashboard...");
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      toast.error("Demo signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-block mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="bg-indigo-600 text-white p-2 rounded">PM</div>
              <span className="font-semibold text-2xl">ProjectMaster</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your details to get started
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              Create your account to start managing projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            
            <div className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleDemoSignup}
                disabled={loading}
              >
                {loading ? "Creating account..." : "Demo Signup (Skip Registration)"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
            <div className="text-sm text-center text-muted-foreground pt-2 border-t">
              <Link to="/" className="text-primary hover:underline">
                ← Back to Home
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
