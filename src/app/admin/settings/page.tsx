
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { updateTheme } from './actions';

const colorSchema = z.object({
  h: z.number().min(0).max(360),
  s: z.number().min(0).max(100),
  l: z.number().min(0).max(100),
});

const themeSchema = z.object({
  primary: colorSchema,
  accent: colorSchema,
  background: colorSchema,
});

type ThemeFormValues = z.infer<typeof themeSchema>;

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


export default function SettingsPage() {
    const { toast } = useToast();
    // These initial values should match your globals.css
    const form = useForm<ThemeFormValues>({
        resolver: zodResolver(themeSchema),
        defaultValues: {
            primary: { h: 196, s: 35, l: 43 },
            accent: { h: 106, s: 35, l: 44 },
            background: { h: 196, s: 39, l: 92 },
        },
    });

    const onSubmit = async (data: ThemeFormValues) => {
        try {
            await updateTheme(data);
            toast({
                title: "Theme Updated",
                description: "Your new theme colors have been applied.",
            });
            // Optional: force a reload to see changes if they don't apply dynamically
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
        <div className="p-4 md:p-8">
        <PageHeader
            title="Settings"
            description="Customize the appearance and behavior of your catalog."
        />
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                    <CardTitle>Theme Colors</CardTitle>
                    <CardDescription>
                        Adjust the main colors of your application. The changes will be applied globally.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ColorPicker form={form} name="primary" label="Primary Color" />
                        <ColorPicker form={form} name="accent" label="Accent Color" />
                        <ColorPicker form={form} name="background" label="Background Color" />
                    </CardContent>
                </Card>

                 <div className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </Form>
        </div>
    );
}
