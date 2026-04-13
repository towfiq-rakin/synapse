import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-card-foreground">
        <div>
          <h1 className="text-lg font-semibold">Synapse Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.email} ({session.user.username})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/app/notes" className="text-sm font-medium text-foreground underline underline-offset-4">
            My notes
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
