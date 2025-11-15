
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { manageUserRole } from '@/ai/flows/manage-user-roles-flow';

const userSchema = z.object({
  name: z.string().min(1, 'User name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['Admin', 'Editor']),
});

type UserFormValues = z.infer<typeof userSchema>;

// A temporary, secondary Firebase app instance for creating users
// This is a workaround to create a user without logging in the current admin out
async function createSecondaryApp() {
    const { initializeApp } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const { firebaseConfig } = await import('@/firebase/config');
    const appName = `secondary-app-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, appName);
    return getAuth(secondaryApp);
}


export function AddUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Editor',
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);
    let secondaryAuth;
    try {
        secondaryAuth = await createSecondaryApp();
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
        const newUser = userCredential.user;

        // Step 1: Set custom claims for the new user
        await manageUserRole({ uid: newUser.uid, role: data.role });

        // Step 2: Create the user profile document in Firestore
        const userDocRef = doc(firestore, 'users', newUser.uid);
        const newUserProfile = {
            name: data.name,
            email: data.email,
            role: data.role,
            createdAt: new Date().toISOString(),
            lastLogin: null,
        };

        await setDoc(userDocRef, newUserProfile);

        toast({
            title: 'User Created Successfully',
            description: `The profile for "${data.name}" has been created with their login credentials and role.`,
        });

        setIsOpen(false);
        form.reset();
        router.refresh();

    } catch (error) {
        console.error("Error creating user:", error);
        toast({
            variant: "destructive",
            title: 'Failed to Create User',
            description: (error as Error).message,
        });
    } finally {
        setIsSubmitting(false);
        if (secondaryAuth) {
            const { deleteApp } = await import('firebase/app');
            deleteApp(secondaryAuth.app);
        }
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user profile and their login credentials.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. john.doe@example.com" {...field} />
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
                    <Input type="password" placeholder="Must be at least 6 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating User...' : 'Save User'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
