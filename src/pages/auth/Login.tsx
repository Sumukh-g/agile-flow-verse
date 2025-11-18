
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
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from "sonner";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

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
      // Use auth context login
      await login(formData.email, formData.password);
      toast.success("Login successful!");
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error?.response?.data?.message || error?.message || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    // For demo: use a test account
    setFormData({ email: 'demo@example.com', password: 'demo123' });
    setLoading(true);
    
    try {
      await login('demo@example.com', 'demo123');
      toast.success("Demo login successful!");
      navigate('/dashboard');
    } catch (error) {
      toast.error("Demo login failed. Please try manual login.");
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
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            
            <div className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleDemoLogin}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Demo Login (Skip Keycloak)"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
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

export default Login;
