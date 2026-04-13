import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "../_components/login-form";

export const metadata = {
  title: "Login | Synapse",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <section className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue building your knowledge graph.</p>
      </header>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Synapse?{" "}
        <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </section>
  );
}
