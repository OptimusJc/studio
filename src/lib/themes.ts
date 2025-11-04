
export type Color = { h: number; s: number; l: number };

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
  },
} as const;

export type ThemeName = keyof typeof themes;
