import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <main className="min-h-screen w-full">{children}</main>;
}
