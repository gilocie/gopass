
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/logo';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.push(redirectUrl);
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-6">
        <Logo />
      </div>
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your email below to log in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="underline text-primary">
          Sign up
        </Link>
      </div>
    </div>
  );
}
