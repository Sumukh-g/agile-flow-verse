
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { toast } from "sonner";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
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
    
    setLoading(true);
    
    try {
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would validate credentials with a server
      // For demo purposes, we'll just log in the user
      localStorage.setItem('user', JSON.stringify({
        id: Date.now().toString(),
        name: 'Demo User',
        email: formData.email,
        isAuthenticated: true
      }));
      
      toast.success("Login successful! Redirecting...");
      
      // Redirect to dashboard after login
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      toast.error("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-indigo-600 text-white p-2 rounded">PM</div>
            <span className="font-semibold text-2xl">ProjectMaster</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your account to continue
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary underline">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="underline text-primary">
                  Sign up for free
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
