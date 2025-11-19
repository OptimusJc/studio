
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateCompanyProfile } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { themes, type ThemeName } from '@/lib/themes';
import { cn } from '@/lib/utils';

const themeSchema = z.object({
  theme: z.custom<ThemeName>((val) => Object.keys(themes).includes(val as string)),
});

type ThemeFormValues = z.infer<typeof themeSchema>;

const companyProfileSchema = z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters.'),
});
type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;


function CompanyProfileSettings() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const companyProfileRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'companyProfile') : null, [firestore]);
    const { data: companyProfile, isLoading: isLoadingProfile } = useDoc<{ name: string }>(companyProfileRef);

    const form = useForm<CompanyProfileFormValues>({
        resolver: zodResolver(companyProfileSchema),
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        if (companyProfile) {
            form.reset({ name: companyProfile.name });
        }
    }, [companyProfile, form]);

    const onSubmit = async (data: CompanyProfileFormValues) => {
        try {
            await updateCompanyProfile({ name: data.name });
            toast({
                title: 'Company Profile Updated',
                description: 'Your company name has been successfully updated.',
            });
            router.refresh();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to Update Profile',
                description: (error as Error).message,
            });
        }
    };
    
    if (isLoadingProfile) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-24" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>Manage your company's details.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Ruby Inc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>Save Changes</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

function ThemeSelector({ form }: { form: any }) {
  return (
    <FormField
      control={form.control}
      name="theme"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Select a Theme</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {Object.entries(themes).map(([name, theme]) => (
                <FormItem key={name} className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value={name} id={name} className="sr-only" />
                  </FormControl>
                  <FormLabel
                    htmlFor={name}
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer w-full",
                      field.value === name && "border-primary"
                    )}
                  >
                    <div className="mb-2 text-center">
                      <p className="font-semibold">{theme.label}</p>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `hsl(${theme.light.primary.h}, ${theme.light.primary.s}%, ${theme.light.primary.l}%)` }} />
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `hsl(${theme.light.accent.h}, ${theme.light.accent.s}%, ${theme.light.accent.l}%)` }} />
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `hsl(${theme.light.background.h}, ${theme.light.background.s}%, ${theme.light.background.l}%)` }} />
                    </div>
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function AppearanceSettings() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { setTheme, theme: activeMode } = useTheme();
    
    const activeThemeRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'activeTheme') : null, [firestore]);
    const { data: activeTheme, isLoading: isLoadingTheme } = useDoc<{ name: ThemeName }>(activeThemeRef);

    const form = useForm<ThemeFormValues>({
        resolver: zodResolver(themeSchema),
        defaultValues: {
            theme: 'clarity',
        },
    });

    useEffect(() => {
        if (activeTheme?.name) {
            form.reset({ theme: activeTheme.name });
        }
    }, [activeTheme, form]);

    const applyTheme = (themeName: ThemeName, mode: 'light' | 'dark') => {
        const selectedTheme = themes[themeName];
        if (!selectedTheme) return;

        const root = document.documentElement;
        const themeConfig = mode === 'dark' ? selectedTheme.dark : selectedTheme.light;
        const sidebarConfig = mode === 'dark' ? selectedTheme.sidebar.dark : selectedTheme.sidebar.light;

        Object.entries(themeConfig).forEach(([key, color]) => {
            root.style.setProperty(`--${key}`, `${color.h} ${color.s}% ${color.l}%`);
        });

        Object.entries(sidebarConfig).forEach(([key, color]) => {
            root.style.setProperty(`--sidebar-${key}`, `${color.h} ${color.s}% ${color.l}%`);
        });
    }
    
    useEffect(() => {
        if (activeTheme?.name) {
            applyTheme(activeTheme.name, activeMode as 'light' | 'dark' || 'light');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTheme, activeMode]);


    const onSubmit = async (data: ThemeFormValues) => {
        if (!firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Firestore is not available.',
            });
            return;
        }

        try {
            applyTheme(data.theme, activeMode as 'light' | 'dark' || 'light');

            // Save theme name to Firestore
            const themeDocRef = doc(firestore, 'settings', 'activeTheme');
            await setDoc(themeDocRef, { name: data.theme });
            
            toast({
                title: "Theme Updated",
                description: "Your new theme has been applied.",
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to Update Theme",
                description: (error as Error).message,
            });
        }
    };

    if (isLoadingTheme) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-8">
                     <Skeleton className="h-24 w-full" />
                     <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Dark/Light Mode</CardTitle>
                    <CardDescription>
                        Toggle between light and dark mode for the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Sun className="h-5 w-5" />
                        <Switch
                            checked={activeMode === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                        <Moon className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Application Theme</CardTitle>
                    <CardDescription>
                        Select a pre-designed theme for your application.
                    </CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent>
                            <ThemeSelector form={form} />
                        </CardContent>
                        <div className="flex justify-end p-6 pt-0">
                            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>Save Appearance</Button>
                        </div>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader
                title="Settings"
                description="Manage your company profile and customize the appearance of your catalog."
            />
            
            <Tabs defaultValue="company" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="company">Company</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                </TabsList>
                <TabsContent value="company" className="pt-6">
                   <CompanyProfileSettings />
                </TabsContent>
                <TabsContent value="appearance" className="pt-6">
                   <AppearanceSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
