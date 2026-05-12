import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  JetBrains_Mono,
  Libre_Baskerville,
  Lora,
  Merriweather,
  Metamorphous,
  Montserrat,
  Source_Code_Pro,
  Yatra_One,
} from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "./color-profiles.css";
import { ColorProfileSync } from "@/components/theme/color-profile-sync";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import {
  COLOR_PROFILES,
  COLOR_PROFILE_STORAGE_KEY,
  DEFAULT_COLOR_PROFILE,
} from "@/lib/color-profiles";
import {
  DEFAULT_INTERFACE_DENSITY,
  DEFAULT_READING_SIZE,
  INTERFACE_DENSITY_STORAGE_KEY,
  INTERFACE_DENSITY_VALUES,
  READING_SIZE_STORAGE_KEY,
  READING_SIZE_VALUES,
} from "@/lib/ui-preferences";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-theme-geist",
  fallback: ["ui-sans-serif", "sans-serif", "system-ui"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-theme-geist-mono",
  fallback: ["ui-monospace", "monospace"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-theme-montserrat",
  fallback: ["ui-sans-serif", "sans-serif", "system-ui"],
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-theme-merriweather",
  weight: ["300", "400", "700", "900"],
  fallback: ["serif"],
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-theme-source-code-pro",
  fallback: ["monospace"],
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-theme-libre-baskerville",
  weight: ["400", "700"],
  fallback: ["serif"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-theme-lora",
  fallback: ["serif"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-theme-ibm-plex-mono",
  weight: ["400", "500", "600", "700"],
  fallback: ["monospace"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-theme-jetbrains-mono",
  fallback: ["monospace"],
});

const metamorphous = Metamorphous({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: "400",
  fallback: ["serif"],
});

const yatraOne = Yatra_One({
  subsets: ["latin"],
  variable: "--font-brand-yatra",
  weight: "400",
  fallback: ["serif"],
});

export const metadata: Metadata = {
  title: "Synapse",
  description: "Synapse note workspace",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/synapse.svg?v=3", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/synapse.svg?v=3"],
  },
};

const colorProfileScript = `
(() => {
  try {
    var valid = ${JSON.stringify(COLOR_PROFILES.map((profile) => profile.id))};
    var fallback = ${JSON.stringify(DEFAULT_COLOR_PROFILE)};
    var key = ${JSON.stringify(COLOR_PROFILE_STORAGE_KEY)};
    var stored = localStorage.getItem(key);
    var profile = valid.indexOf(stored || "") === -1 ? fallback : stored;
    document.documentElement.dataset.colorProfile = profile;
  } catch (_) {
    document.documentElement.dataset.colorProfile = ${JSON.stringify(DEFAULT_COLOR_PROFILE)};
  }
})();
`;

const uiPreferenceScript = `
(() => {
  try {
    var densityValues = ${JSON.stringify(INTERFACE_DENSITY_VALUES)};
    var readingSizeValues = ${JSON.stringify(READING_SIZE_VALUES)};
    var densityKey = ${JSON.stringify(INTERFACE_DENSITY_STORAGE_KEY)};
    var readingSizeKey = ${JSON.stringify(READING_SIZE_STORAGE_KEY)};
    var defaultDensity = ${JSON.stringify(DEFAULT_INTERFACE_DENSITY)};
    var defaultReadingSize = ${JSON.stringify(DEFAULT_READING_SIZE)};

    var densityStored = localStorage.getItem(densityKey);
    var density = densityValues.indexOf(densityStored || "") === -1 ? defaultDensity : densityStored;

    var readingSizeStored = localStorage.getItem(readingSizeKey);
    var readingSize = readingSizeValues.indexOf(readingSizeStored || "") === -1 ? defaultReadingSize : readingSizeStored;

    document.documentElement.dataset.interfaceDensity = density;
    document.documentElement.dataset.readingSize = readingSize;
  } catch (_) {
    document.documentElement.dataset.interfaceDensity = ${JSON.stringify(DEFAULT_INTERFACE_DENSITY)};
    document.documentElement.dataset.readingSize = ${JSON.stringify(DEFAULT_READING_SIZE)};
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-color-profile={DEFAULT_COLOR_PROFILE}
      data-interface-density={DEFAULT_INTERFACE_DENSITY}
      data-reading-size={DEFAULT_READING_SIZE}
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        geist.variable,
        geistMono.variable,
        montserrat.variable,
        merriweather.variable,
        sourceCodePro.variable,
        libreBaskerville.variable,
        lora.variable,
        ibmPlexMono.variable,
        jetBrainsMono.variable,
        metamorphous.variable,
        yatraOne.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="synapse-color-profile"
          strategy="beforeInteractive"
        >
          {colorProfileScript}
        </Script>
        <Script
          id="synapse-ui-preferences"
          strategy="beforeInteractive"
        >
          {uiPreferenceScript}
        </Script>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ColorProfileSync />
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
