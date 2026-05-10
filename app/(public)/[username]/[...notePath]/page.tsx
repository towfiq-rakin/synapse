import { redirect } from "next/navigation";

type PublicPathPageProps = {
  params: Promise<{ username: string; notePath: string[] }>;
};

export default async function PublicPathPage({ params }: PublicPathPageProps) {
  const { username, notePath } = await params;
  const encodedPath = notePath.map((segment) => encodeURIComponent(segment)).join("/");
  redirect(`/u/${encodeURIComponent(username)}/${encodedPath}`);
}
