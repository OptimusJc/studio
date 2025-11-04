
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { getSdks, initializeFirebase } from '@/firebase/server-init';
import { doc, setDoc } from 'firebase/firestore';
import { themes, type ThemeName } from '@/lib/themes';

const themeSchema = z.object({
  theme: z.custom<ThemeName>(),
});

type ThemeFormValues = z.infer<typeof themeSchema>;

const companyProfileSchema = z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters.'),
});
type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

export async function updateTheme(data: ThemeFormValues) {
  const { firebaseApp } = initializeFirebase();
  const { firestore } = getSdks(firebaseApp);
  const cssFilePath = path.join(process.cwd(), 'src', 'app', 'globals.css');
  const selectedTheme = themes[data.theme];

  if (!selectedTheme) {
    throw new Error('Invalid theme selected.');
  }
  
  try {
    // 1. Update CSS file
    const currentCss = await fs.readFile(cssFilePath, 'utf8');
    let newCss = currentCss;
    
    // === Light Mode Variables ===
    const { primary, accent, background } = selectedTheme.light;
    const { primary: sidebarPrimary, accent: sidebarAccent, background: sidebarBackground } = selectedTheme.sidebar.light;
    const { foreground: sidebarForeground, 'accent-foreground': sidebarAccentForeground, 'primary-foreground': sidebarPrimaryForeground } = selectedTheme.sidebar.light;

    newCss = newCss.replace(/--background:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--background: ${background.h} ${background.s}% ${background.l}%;`);
    newCss = newCss.replace(/--primary:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--primary: ${primary.h} ${primary.s}% ${primary.l}%;`);
    newCss = newCss.replace(/--accent:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--accent: ${accent.h} ${accent.s}% ${accent.l}%;`);

    const primaryForeground = primary.l > 50 ? '240 10% 3.9%' : '0 0% 98%';
    const accentForeground = accent.l > 50 ? '240 10% 3.9%' : '0 0% 98%';
    
    newCss = newCss.replace(/--primary-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--primary-foreground: ${primaryForeground};`);
    newCss = newCss.replace(/--accent-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--accent-foreground: ${accentForeground};`);

    // Sidebar light mode
    newCss = newCss.replace(/--sidebar-background:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--sidebar-background: ${sidebarBackground.h} ${sidebarBackground.s}% ${sidebarBackground.l}%;`);
    newCss = newCss.replace(/--sidebar-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--sidebar-foreground: ${sidebarForeground.h} ${sidebarForeground.s}% ${sidebarForeground.l}%;`);
    newCss = newCss.replace(/--sidebar-primary:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--sidebar-primary: ${sidebarPrimary.h} ${sidebarPrimary.s}% ${sidebarPrimary.l}%;`);
    newCss = newCss.replace(/--sidebar-primary-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--sidebar-primary-foreground: ${sidebarPrimaryForeground.h} ${sidebarPrimaryForeground.s}% ${sidebarPrimaryForeground.l}%;`);
    newCss = newCss.replace(/--sidebar-accent:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--sidebar-accent: ${sidebarAccent.h} ${sidebarAccent.s}% ${sidebarAccent.l}%;`);
    newCss = newCss.replace(/--sidebar-accent-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `--sidebar-accent-foreground: ${sidebarAccentForeground.h} ${sidebarAccentForeground.s}% ${sidebarAccentForeground.l}%;`);

    // === Dark Mode Variables ===
    const { primary: darkPrimary, accent: darkAccent, background: darkBackground } = selectedTheme.dark;
    const { primary: darkSidebarPrimary, accent: darkSidebarAccent, background: darkSidebarBackground } = selectedTheme.sidebar.dark;
    const { foreground: darkSidebarForeground, 'accent-foreground': darkSidebarAccentForeground, 'primary-foreground': darkSidebarPrimaryForeground } = selectedTheme.sidebar.dark;

    newCss = newCss.replace(/\.dark\s*{\s*--background:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {\n    --background: ${darkBackground.h} ${darkBackground.s}% ${darkBackground.l}%;`);
    newCss = newCss.replace(/\.dark\s*{([^}]*)--primary:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--primary: ${darkPrimary.h} ${darkPrimary.s}% ${darkPrimary.l}%;`);
    newCss = newCss.replace(/\.dark\s*{([^}]*)--accent:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--accent: ${darkAccent.h} ${darkAccent.s}% ${darkAccent.l}%;`);
    
    const darkPrimaryForeground = darkPrimary.l > 50 ? '240 10% 3.9%' : '0 0% 98%';
    const darkAccentForeground = darkAccent.l > 50 ? '240 10% 3.9%' : '0 0% 98%';

    newCss = newCss.replace(/\.dark\s*{([^}]*)--primary-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--primary-foreground: ${darkPrimaryForeground};`);
    newCss = newCss.replace(/\.dark\s*{([^}]*)--accent-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--accent-foreground: ${darkAccentForeground};`);

    // Sidebar dark mode
    newCss = newCss.replace(/\.dark\s*{([^}]*)--sidebar-background:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--sidebar-background: ${darkSidebarBackground.h} ${darkSidebarBackground.s}% ${darkSidebarBackground.l}%;`);
    newCss = newCss.replace(/\.dark\s*{([^}]*)--sidebar-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--sidebar-foreground: ${darkSidebarForeground.h} ${darkSidebarForeground.s}% ${darkSidebarForeground.l}%;`);
    newCss = newCss.replace(/\.dark\s*{([^}]*)--sidebar-primary:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--sidebar-primary: ${darkSidebarPrimary.h} ${darkSidebarPrimary.s}% ${darkSidebarPrimary.l}%;`);
    newCss = newCss.replace(/\.dark\s*{([^}]*)--sidebar-primary-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--sidebar-primary-foreground: ${darkSidebarPrimaryForeground.h} ${darkSidebarPrimaryForeground.s}% ${darkSidebarPrimaryForeground.l}%;`);
    newCss = newCss.replace(/\.dark\s*{([^}]*)--sidebar-accent:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--sidebar-accent: ${darkSidebarAccent.h} ${darkSidebarAccent.s}% ${darkSidebarAccent.l}%;`);
    newCss = newCss.replace(/\.dark\s*{([^}]*)--sidebar-accent-foreground:\s*[\d.]+\s+[\d.]+%?\s+[\d.]+%?;/, `.dark {$1--sidebar-accent-foreground: ${darkSidebarAccentForeground.h} ${darkSidebarAccentForeground.s}% ${darkSidebarAccentForeground.l}%;`);

    await fs.writeFile(cssFilePath, newCss, 'utf8');

    // 2. Save theme name to Firestore
    const activeThemeRef = doc(firestore, 'settings', 'activeTheme');
    await setDoc(activeThemeRef, { name: data.theme });

    return { success: true, message: 'Theme updated successfully.' };

  } catch (error) {
    console.error("Error updating theme:", error);
    throw new Error('Could not write to CSS file or Firestore.');
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
