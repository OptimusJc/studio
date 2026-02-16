import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter, Source_Code_Pro, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-code-pro",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair-display",
});

export const metadata: Metadata = {
  title: "Ruby Catalogue",
  description: "Manage and share your product catalogs with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceCodePro.variable} ${playfairDisplay.variable}`}
    >
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-10846874269"
          strategy="afterInteractive"
        ></Script>
        <Script id="googletagmanager" strategy="afterInteractive">
          {`

              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'AW-10846874269');
          `}
        </Script>
      </head>

      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>{children}</FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
