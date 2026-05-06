import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import AppShell from "@/components/layout/app-shell";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  // Middleware guarantees authentication for all (app) routes.
  // We still fetch the user to pass profile data to the sidebar.
  const user = await getSessionUser();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const sidebarUser = user
      ? {
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
      }
    : null;

  return (
    <AppShell defaultOpen={defaultOpen} user={sidebarUser}>
      {children}
    </AppShell>
  );
}
