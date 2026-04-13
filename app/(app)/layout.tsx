import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import Folder from "@/lib/db/models/Folder";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import SidebarTree from "@/components/layout/sidebar-tree";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AppLayoutProps = {
  children: React.ReactNode;
};

type SidebarNote = {
  _id: { toString(): string } | string;
  title: string;
  slug?: string;
  folderId: { toString(): string } | string | null;
};

type SidebarFolder = {
  _id: { toString(): string } | string;
  name: string;
  slug: string;
  parentId: { toString(): string } | string | null;
  order: number;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const [sidebarFolders, sidebarNotes] = await Promise.all([
    Folder.find({ userId: session.user.id }).sort({ order: 1, name: 1 }).select("_id name slug parentId order").lean<SidebarFolder[]>(),
    Note.find({ userId: session.user.id }).sort({ updatedAt: -1 }).select("_id title slug folderId").lean<SidebarNote[]>(),
  ]);

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-card-foreground">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon-sm" className="lg:hidden" aria-label="Open tree view">
                <PanelLeft className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-88 p-0" showCloseButton={false}>
              <SheetHeader className="border-b">
                <SheetTitle>Workspace tree</SheetTitle>
                <SheetDescription>Navigate folders and notes.</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 p-4 pt-3">
                <SidebarTree folders={sidebarFolders} notes={sidebarNotes} className="h-full" />
              </div>
            </SheetContent>
          </Sheet>

          <div>
          <h1 className="text-lg font-semibold">Synapse Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.email} ({session.user.username})
          </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium text-foreground underline underline-offset-4">
            Workspace
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

      <div className="flex min-h-0 flex-1 gap-6">
        <aside className="hidden w-80 shrink-0 lg:block">
          <SidebarTree folders={sidebarFolders} notes={sidebarNotes} className="h-full" />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
