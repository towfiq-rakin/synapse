import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-muted/40 via-background to-background px-4 py-12">
      <div className="pointer-events-none absolute top-0 h-48 w-2/3 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
  );
}
