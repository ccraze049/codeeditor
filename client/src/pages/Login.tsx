import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  const handleLogin = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      toast({
        title: "Welcome!",
        description: "Successfully logged in to CodeSpace IDE",
      });

      // Refresh auth state and redirect to home page
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      toast({
        title: "Account Created!",
        description: "Welcome to CodeSpace IDE",
      });

      // Refresh auth state and redirect to home page
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "Please try again with different credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4" style={{paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)"}}>
      <Card className={`w-full ${isMobile ? 'max-w-sm mx-2' : 'max-w-md'}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CodeSpace IDE</CardTitle>
          <CardDescription>
            Your browser-based development environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <LoginForm onSubmit={(email, password, name) => handleLogin(email, password, name)} isLoading={isLoading} />
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <SignupForm onSubmit={(email, password, firstName, lastName) => handleSignup(email, password, firstName, lastName)} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm({ onSubmit, isLoading }: { onSubmit: (email: string, password: string, name?: string) => void; isLoading: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onSubmit(email.trim(), password.trim(), name.trim() || undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-base"
          required
          data-testid="input-login-email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="input-login-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-name">Name (Optional)</Label>
        <Input
          id="login-name"
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="input-login-name"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !email.trim() || !password.trim()}
        data-testid="button-login"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}

function SignupForm({ onSubmit, isLoading }: { onSubmit: (email: string, password: string, firstName: string, lastName: string) => void; isLoading: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim() && firstName.trim()) {
      onSubmit(email.trim(), password.trim(), firstName.trim(), lastName.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="input-signup-email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Choose a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="input-signup-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-first-name">First Name</Label>
        <Input
          id="signup-first-name"
          type="text"
          placeholder="John"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          data-testid="input-signup-firstname"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-last-name">Last Name</Label>
        <Input
          id="signup-last-name"
          type="text"
          placeholder="Doe"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          data-testid="input-signup-lastname"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !email.trim() || !password.trim() || !firstName.trim()}
        data-testid="button-signup"
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </Button>
    </form>
  );
}