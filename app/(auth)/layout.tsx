import type { ReactNode } from "react";
import AuthLiquidBackground from "./_components/auth-liquid-background";
import { ThemeProvider } from "@/components/theme-provider";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <main className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080810] px-4 py-8 sm:px-6 lg:px-8">
        <AuthLiquidBackground />
        <div className="relative z-10 w-full max-w-6xl">{children}</div>
      </main>
    </ThemeProvider>
  );
}
