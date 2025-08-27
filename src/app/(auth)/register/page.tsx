
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
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [organizerName, setOrganizerName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account Created!",
        description: "You have been successfully registered.",
      });
      router.push('/dashboard');
    } catch (error: any) {
        console.error('Registration error:', error);
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message || "An unexpected error occurred.",
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
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create your GoPass account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="organizer-name">Organizer Name</Label>
              <Input 
                id="organizer-name" 
                placeholder="Awesome Events Inc." 
                required 
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
              />
            </div>
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline text-primary">
          Log in
        </Link>
      </div>
    </div>
  );
}
