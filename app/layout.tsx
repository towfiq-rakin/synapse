import type { Metadata } from "next";
import { Merriweather, Metamorphous, Montserrat, Source_Code_Pro, Yatra_One } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  fallback: ["ui-sans-serif", "sans-serif", "system-ui"],
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "700", "900"],
  fallback: ["serif"],
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-mono",
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
      { url: "/synapse-black.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/synapse-white.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
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
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        montserrat.variable,
        merriweather.variable,
        sourceCodePro.variable,
        metamorphous.variable,
        yatraOne.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
