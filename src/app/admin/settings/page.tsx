
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
import { Moon, Sun, Laptop, Building2, Palette, Save, CheckCircle2 } from 'lucide-react';
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
             <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full md:max-w-md rounded-lg" />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-border/50 mt-6 pt-6">
                        <Skeleton className="h-10 w-32 rounded-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
         <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
                <CardTitle className="text-xl font-semibold">Company Profile</CardTitle>
                <CardDescription>Manage your company's details and public presence.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground/80 text-sm">Company Name</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="e.g. Ruby Inc." 
                                            {...field} 
                                            className="max-w-md bg-background/50 focus-visible:ring-primary/20 transition-all shadow-sm"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4 border-t border-border/50 mt-6">
                            <Button 
                                type="submit" 
                                disabled={form.formState.isSubmitting || !form.formState.isDirty}
                                className="relative overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:scale-100"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
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
        <FormItem className="space-y-4">
          <FormLabel className="text-base text-foreground/80">Select a Theme</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {Object.entries(themes).map(([name, theme]) => {
                const isSelected = field.value === name;
                return (
                  <FormItem key={name} className="flex items-center space-x-0 space-y-0 relative">
                    <FormControl>
                      <RadioGroupItem value={name} id={name} className="sr-only" />
                    </FormControl>
                    <FormLabel
                      htmlFor={name}
                      className={cn(
                        "group relative flex flex-col items-start justify-between rounded-2xl border-2 p-5 cursor-pointer w-full overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg",
                        isSelected 
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                            : "border-border/50 bg-background hover:border-border hover:bg-muted/30"
                      )}
                    >
                      {isSelected && (
                         <div className="absolute top-4 right-4 text-primary animate-in zoom-in duration-300">
                             <CheckCircle2 className="h-5 w-5" />
                         </div>
                      )}
                      <div className="mb-4 text-left pr-8">
                        <p className={cn("font-semibold text-lg transition-colors", isSelected ? "text-primary" : "text-foreground")}>{theme.label}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{theme.description}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-auto pt-4 w-full border-t border-border/50 border-dashed">
                          <div className="w-8 h-8 rounded-full border shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: `hsl(${theme.light.primary.h}, ${theme.light.primary.s}%, ${theme.light.primary.l}%)` }} title="Primary Color" />
                          <div className="w-6 h-6 rounded-full border shadow-sm transition-transform group-hover:scale-110 delay-75" style={{ backgroundColor: `hsl(${theme.light.accent.h}, ${theme.light.accent.s}%, ${theme.light.accent.l}%)` }} title="Accent Color" />
                          <div className="w-6 h-6 rounded-full border shadow-sm transition-transform group-hover:scale-110 delay-150" style={{ backgroundColor: `hsl(${theme.light.background.h}, ${theme.light.background.s}%, ${theme.light.background.l}%)` }} title="Background Color" />
                      </div>
                    </FormLabel>
                  </FormItem>
                )
              })}
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
            <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                     <Skeleton className="h-24 w-full rounded-xl" />
                     <Skeleton className="h-48 w-full rounded-xl" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
                    <CardTitle className="text-xl font-semibold">Display Mode</CardTitle>
                    <CardDescription>
                        Toggle between light, dark, or system preference for the application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="inline-flex items-center p-1.5 bg-muted/80 backdrop-blur-md rounded-xl shadow-inner border border-border/50">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setTheme('light')}
                            className={cn(
                                "rounded-lg px-6 py-2 transition-all duration-300 font-medium",
                                activeMode === 'light' ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                            )}
                        >
                            <Sun className="h-4 w-4 mr-2" /> Light
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setTheme('dark')}
                            className={cn(
                                "rounded-lg px-6 py-2 transition-all duration-300 font-medium",
                                activeMode === 'dark' ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                            )}
                        >
                            <Moon className="h-4 w-4 mr-2" /> Dark
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setTheme('system')}
                            className={cn(
                                "rounded-lg px-6 py-2 transition-all duration-300 font-medium",
                                activeMode === 'system' ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                            )}
                        >
                            <Laptop className="h-4 w-4 mr-2" /> System
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
                    <CardTitle className="text-xl font-semibold">Application Theme</CardTitle>
                    <CardDescription>
                        Select a carefully crafted premium theme for your application.
                    </CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="pt-6">
                            <ThemeSelector form={form} />
                        </CardContent>
                        <div className="flex justify-end p-6 pt-4 border-t border-border/50 bg-muted/10">
                            <Button 
                                type="submit" 
                                disabled={form.formState.isSubmitting || !form.formState.isDirty}
                                className="relative overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:scale-100"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {form.formState.isSubmitting ? 'Saving...' : 'Save Appearance'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Settings"
                description="Manage your company profile and customize the premium appearance of your catalog."
            />
            
            <Tabs defaultValue="company" className="flex flex-col md:flex-row gap-8 w-full mt-8">
                <TabsList className="flex flex-row md:flex-col justify-start h-auto w-full md:w-64 bg-transparent p-0 space-x-2 md:space-x-0 md:space-y-2 shrink-0 overflow-x-auto no-scrollbar border-b md:border-b-0 pb-4 md:pb-0">
                    <TabsTrigger 
                        value="company" 
                        className="w-full justify-start py-3 px-4 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/60 transition-all duration-300 border border-transparent data-[state=active]:border-primary/20 text-base font-medium"
                    >
                        <Building2 className="w-5 h-5 mr-3 opacity-70" />
                        Company
                    </TabsTrigger>
                    <TabsTrigger 
                        value="appearance" 
                        className="w-full justify-start py-3 px-4 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/60 transition-all duration-300 border border-transparent data-[state=active]:border-primary/20 text-base font-medium"
                    >
                        <Palette className="w-5 h-5 mr-3 opacity-70" />
                        Appearance
                    </TabsTrigger>
                </TabsList>
                <div className="flex-1 min-w-0">
                    <TabsContent value="company" className="mt-0 border-none p-0 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
                       <CompanyProfileSettings />
                    </TabsContent>
                    <TabsContent value="appearance" className="mt-0 border-none p-0 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
                       <AppearanceSettings />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
