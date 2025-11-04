
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { updateTheme, updateCompanyProfile } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

// Schema for theme customization
const themeSchema = z.object({
  primary: z.object({
    h: z.number().min(0).max(360),
    s: z.number().min(0).max(100),
    l: z.number().min(0).max(100),
  }),
  accent: z.object({
    h: z.number().min(0).max(360),
    s: z.number().min(0).max(100),
    l: z.number().min(0).max(100),
  }),
  background: z.object({
    h: z.number().min(0).max(360),
    s: z.number().min(0).max(100),
    l: z.number().min(0).max(100),
  }),
});
type ThemeFormValues = z.infer<typeof themeSchema>;

// Schema for company profile updates
const companyProfileSchema = z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters.'),
});
type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;


function ColorPicker({ form, name, label }: { form: any, name: "primary" | "accent" | "background", label: string }) {
  const h = form.watch(`${name}.h`);
  const s = form.watch(`${name}.s`);
  const l = form.watch(`${name}.l`);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <div 
          className="h-8 w-16 rounded-md border" 
          style={{ backgroundColor: `hsl(${h}, ${s}%, ${l}%)` }}
        />
      </div>
      <FormField
        control={form.control}
        name={`${name}.h`}
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Hue</FormLabel>
              <span className="text-sm text-muted-foreground">{field.value}</span>
            </div>
            <FormControl>
               <Slider
                min={0}
                max={360}
                step={1}
                value={[field.value]}
                onValueChange={(vals) => field.onChange(vals[0])}
              />
            </FormControl>
          </FormItem>
        )}
      />
       <FormField
        control={form.control}
        name={`${name}.s`}
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
                <FormLabel>Saturation</FormLabel>
                <span className="text-sm text-muted-foreground">{field.value}%</span>
            </div>
            <FormControl>
                <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[field.value]}
                    onValueChange={(vals) => field.onChange(vals[0])}
                />
            </FormControl>
          </FormItem>
        )}
      />
       <FormField
        control={form.control}
        name={`${name}.l`}
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
                <FormLabel>Lightness</FormLabel>
                <span className="text-sm text-muted-foreground">{field.value}%</span>
            </div>
            <FormControl>
                 <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[field.value]}
                    onValueChange={(vals) => field.onChange(vals[0])}
                />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}


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

function AppearanceSettings() {
    const { toast } = useToast();
    const { setTheme, theme } = useTheme();

    const form = useForm<ThemeFormValues>({
        resolver: zodResolver(themeSchema),
        // These initial values should match your globals.css
        defaultValues: {
            primary: { h: 196, s: 35, l: 43 },
            accent: { h: 106, s: 35, l: 44 },
            background: { h: 192, s: 72, l: 92 },
        },
    });

    const onSubmit = async (data: ThemeFormValues) => {
        try {
            await updateTheme(data);
            toast({
                title: "Theme Updated",
                description: "Your new theme colors have been applied.",
            });
            window.location.reload();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to Update Theme",
                description: (error as Error).message,
            });
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Toggle between light and dark mode for the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Sun className="h-5 w-5" />
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                        <Moon className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Theme Colors</CardTitle>
                    <CardDescription>
                        Adjust the main colors of your application. The changes will be applied globally.
                    </CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ColorPicker form={form} name="primary" label="Primary Color" />
                            <ColorPicker form={form} name="accent" label="Accent Color" />
                            <ColorPicker form={form} name="background" label="Background Color" />
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
