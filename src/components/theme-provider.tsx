"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { themes, type ThemeName } from "@/lib/themes"

function GlobalThemeApplier() {
    const firestore = useFirestore();
    const { resolvedTheme } = useTheme();
    
    const activeThemeRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'activeTheme') : null, [firestore]);
    const { data: activeTheme } = useDoc<{ name: ThemeName }>(activeThemeRef);

    React.useEffect(() => {
        if (!activeTheme?.name) return;
        
        const selectedTheme = themes[activeTheme.name];
        if (!selectedTheme) return;

        const root = document.documentElement;
        // Use resolvedTheme to correctly apply 'light' or 'dark' colors even when the user selects 'system'
        const mode = resolvedTheme === 'dark' ? 'dark' : 'light';

        const themeConfig = mode === 'dark' ? selectedTheme.dark : selectedTheme.light;
        const sidebarConfig = mode === 'dark' ? selectedTheme.sidebar.dark : selectedTheme.sidebar.light;

        Object.entries(themeConfig).forEach(([key, color]) => {
            root.style.setProperty(`--${key}`, `${color.h} ${color.s}% ${color.l}%`);
        });

        Object.entries(sidebarConfig).forEach(([key, color]) => {
            root.style.setProperty(`--sidebar-${key}`, `${color.h} ${color.s}% ${color.l}%`);
        });
    }, [activeTheme, resolvedTheme]);

    return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <GlobalThemeApplier />
      {children}
    </NextThemesProvider>
  )
}
