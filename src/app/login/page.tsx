'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { doc, getDocs, updateDoc, collection, query, where, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const hasRedirected = useRef(false);

  const error = searchParams.get('error');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Only redirect if user is already logged in when page loads
  useEffect(() => {
    if (!isUserLoading && user && !isLoggingIn && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/admin');
    }
  }, [user, isUserLoading, isLoggingIn, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    try {
      // Step 1: Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, data.email, data.password);
      
      // Step 2: Find the user document in Firestore by email
      const usersCollection = collection(firestore, 'users');
      const userQuery = query(usersCollection, where("email", "==", data.email), limit(1));
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        await signOut(auth); // Sign out if no matching profile is found
        throw new Error('User account not found. Please contact an administrator.');
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userDocRef = userDoc.ref;
      
      // Step 3: Check if user has proper role
      if (userData.role !== 'Admin' && userData.role !== 'Editor') {
        await signOut(auth);
        throw new Error('You do not have permission to access the admin dashboard.');
      }

      // Step 4: Update last login time
      await updateDoc(userDocRef, {
        lastLogin: new Date().toISOString(),
      });

      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      hasRedirected.current = true;
      router.replace('/admin');
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: (error as Error).message,
      });
      setIsLoggingIn(false);
    }
  };

  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Loading...</p>
        </div>
    )
  }

  if (user && !isLoggingIn) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Redirecting to dashboard...</p>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
       <div className="absolute top-8 left-8 flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-lg">CatalogLink</span>
        </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error === 'unauthorized' && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Access Denied</AlertTitle>
                  <AlertDescription>
                    You do not have permission to access the admin dashboard.
                  </AlertDescription>
              </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}


export default function LoginPage() {
    return (
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <p>Loading...</p>
          </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
