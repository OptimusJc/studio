
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { getSdks, initializeFirebase } from '@/firebase/server-init';
import { doc, setDoc } from 'firebase/firestore';

const colorSchema = z.object({
  h: z.number(),
  s: z.number(),
  l: z.number(),
});

const themeSchema = z.object({
  primary: colorSchema,
  accent: colorSchema,
  background: colorSchema,
});

type ThemeFormValues = z.infer<typeof themeSchema>;

const companyProfileSchema = z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters.'),
});
type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

export async function updateTheme(data: ThemeFormValues) {
  const cssFilePath = path.join(process.cwd(), 'src', 'app', 'globals.css');
  
  try {
    const currentCss = await fs.readFile(cssFilePath, 'utf8');

    let newCss = currentCss;
    newCss = newCss.replace(/--primary:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--primary: ${data.primary.h} ${data.primary.s}% ${data.primary.l}%;`);
    newCss = newCss.replace(/--accent:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--accent: ${data.accent.h} ${data.accent.s}% ${data.accent.l}%;`);
    newCss = newCss.replace(/--background:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--background: ${data.background.h} ${data.background.s}% ${data.background.l}%;`);

    // A simple way to adjust foreground color based on lightness
    const primaryForeground = data.primary.l > 50 ? '240 10% 3.9%' : '0 0% 98%';
    const accentForeground = data.accent.l > 50 ? '240 10% 3.9%' : '0 0% 98%';
    
    newCss = newCss.replace(/--primary-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--primary-foreground: ${primaryForeground};`);
    newCss = newCss.replace(/--accent-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--accent-foreground: ${accentForeground};`);

    await fs.writeFile(cssFilePath, newCss, 'utf8');

    return { success: true, message: 'Theme updated successfully.' };
  } catch (error) {
    console.error("Error updating theme:", error);
    throw new Error('Could not write to CSS file.');
  }
}

export async function updateCompanyProfile(data: CompanyProfileFormValues) {
    const { firebaseApp } = initializeFirebase();
    const { firestore } = getSdks(firebaseApp);

    const validatedData = companyProfileSchema.safeParse(data);
    if (!validatedData.success) {
        throw new Error('Invalid data provided for company profile update.');
    }
    
    const { name } = validatedData.data;

    try {
        const companyProfileRef = doc(firestore, 'settings', 'companyProfile');
        await setDoc(companyProfileRef, { name }, { merge: true });
        return { success: true, message: 'Company profile updated successfully.' };
    } catch(error) {
        console.error("Error updating company profile:", error);
        throw new Error('Could not update company profile in Firestore.');
    }
}
