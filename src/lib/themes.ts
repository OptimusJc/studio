
export type Color = { h: number; s: number; l: number };
export type FullColor = { h: number; s: number; l: number; }; // Can add 'a' for alpha if needed

export type ThemeColors = {
  background: FullColor;
  foreground: FullColor;
  primary: FullColor;
  'primary-foreground': FullColor;
  accent: FullColor;
  'accent-foreground': FullColor;
};

export type Theme = {
  label: string;
  description: string;
  light: {
    primary: Color;
    accent: Color;
    background: Color;
  };
  dark: {
    primary: Color;
    accent: Color;
    background: Color;
  };
  sidebar: {
    light: ThemeColors;
    dark: ThemeColors;
  };
};

export const themes = {
  clarity: {
    label: "Clarity & Efficiency",
    description: "A clean, professional theme focused on readability.",
    light: {
      primary: { h: 196, s: 35, l: 43 },
      accent: { h: 106, s: 35, l: 44 },
      background: { h: 192, s: 72, l: 92 },
    },
    dark: {
      primary: { h: 196, s: 35, l: 43 },
      accent: { h: 106, s: 35, l: 44 },
      background: { h: 240, s: 10, l: 3.9 },
    },
    sidebar: {
      light: {
        background: { h: 240, s: 5.9, l: 10 },
        foreground: { h: 240, s: 4.8, l: 95.9 },
        primary: { h: 196, s: 35, l: 43 },
        'primary-foreground': { h: 0, s: 0, l: 98 },
        accent: { h: 240, s: 3.7, l: 15.9 },
        'accent-foreground': { h: 240, s: 4.8, l: 95.9 },
      },
      dark: {
        background: { h: 240, s: 10, l: 3.9 },
        foreground: { h: 0, s: 0, l: 98 },
        primary: { h: 196, s: 35, l: 43 },
        'primary-foreground': { h: 0, s: 0, l: 98 },
        accent: { h: 240, s: 3.7, l: 15.9 },
        'accent-foreground': { h: 0, s: 0, l: 98 },
      },
    }
  },
  vibrant: {
    label: "Vibrancy & Engagement",
    description: "A modern, dynamic theme with a friendly feel.",
    light: {
      primary: { h: 262, s: 85, l: 58 },
      accent: { h: 180, s: 85, l: 40 },
      background: { h: 210, s: 20, l: 98 },
    },
    dark: {
      primary: { h: 262, s: 70, l: 65 },
      accent: { h: 180, s: 70, l: 45 },
      background: { h: 240, s: 10, l: 4 },
    },
     sidebar: {
      light: {
        background: { h: 262, s: 25, l: 15 },
        foreground: { h: 262, s: 80, l: 95 },
        primary: { h: 262, s: 85, l: 58 },
        'primary-foreground': { h: 0, s: 0, l: 100 },
        accent: { h: 262, s: 35, l: 25 },
        'accent-foreground': { h: 262, s: 90, l: 90 },
      },
      dark: {
        background: { h: 262, s: 20, l: 8 },
        foreground: { h: 262, s: 80, l: 95 },
        primary: { h: 262, s: 70, l: 65 },
        'primary-foreground': { h: 0, s: 0, l: 100 },
        accent: { h: 262, s: 25, l: 15 },
        'accent-foreground': { h: 262, s: 90, l: 90 },
      },
    }
  },
} as const;

export type ThemeName = keyof typeof themes;
