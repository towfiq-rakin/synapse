import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignupForm } from "../_components/signup-form";

export const metadata = {
  title: "Sign Up | Synapse",
};

export default async function SignupPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/app");
  }

  return (
    <section className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start writing notes and publishing your connected ideas.</p>
      </header>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </section>
  );
}
