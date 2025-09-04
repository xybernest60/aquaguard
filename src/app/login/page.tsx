"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Fish } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('email, password_hash')
        .eq('email', email)
        .single();

      if (error || !data) {
        throw new Error('Invalid email or password.');
      }
      
      // IMPORTANT: This is an insecure password check for demonstration purposes.
      // In a real application, use a secure authentication provider like Supabase Auth,
      // which handles password hashing and verification securely.
      if (password === data.password_hash) {
        toast({
          title: 'Login Successful',
          description: 'Welcome to AquaGuard!',
        });
        // Store a session token or user information in local storage if needed
        localStorage.setItem('user', JSON.stringify({ email: data.email }));
        router.replace('/dashboard');
      } else {
        throw new Error('Invalid email or password.');
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
               <Fish className="w-10 h-10 text-primary" />
            </div>
          <CardTitle>AquaGuard Login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground justify-center">
            <p>Use the credentials from your database.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
