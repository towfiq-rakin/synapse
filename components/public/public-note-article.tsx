import Link from "next/link";
import { format } from "date-fns";
import PublicNoteContent from "@/components/public/public-note-content";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { PublicProfile, PublicWorkspaceNote } from "@/lib/publishing/public-queries";

type PublicNoteArticleProps = {
  note: PublicWorkspaceNote;
  profile: PublicProfile;
  html: string;
  profileHref?: string | null;
  editHref?: string | null;
};

function formatDateLabel(date: Date | null) {
  if (!date) {
    return null;
  }

  return format(date, "MMMM d, yyyy");
}

function normalizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[§¶#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function removeDuplicateLeadTitle(html: string, title: string): string {
  const trimmed = html.trimStart();
  const match = trimmed.match(/^<h1\b[^>]*>([\s\S]*?)<\/h1>/i);

  if (!match) {
    return html;
  }

  const headingText = normalizeText(match[1] ?? "");
  const titleText = normalizeText(title);

  if (!headingText || headingText !== titleText) {
    return html;
  }

  return trimmed.replace(match[0], "").trimStart();
}

function formatBreadcrumbLabel(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function PublicNoteArticle({
  note,
  profile,
  html,
  profileHref,
  editHref,
}: PublicNoteArticleProps) {
  const profileName = profile.displayName || profile.name;
  const updatedLabel = formatDateLabel(note.updatedAt);
  const articleHtml = removeDuplicateLeadTitle(html, note.title);
  const rootHref = profileHref ?? `/u/${profile.username}`;
  const folderSegments = note.path.slice(0, -1);

  return (
    <article className="mx-auto w-full max-w-[48rem] text-card-foreground">
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-sm text-muted-foreground sm:text-[0.95rem]">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={rootHref}>@{profile.username}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {folderSegments.map((segment, index) => {
            const href = `${rootHref}/${folderSegments.slice(0, index + 1).join("/")}`;

            return (
              <BreadcrumbItem key={`${segment}-${index}`}>
                <BreadcrumbSeparator />
                <BreadcrumbLink asChild>
                  <Link href={href}>{formatBreadcrumbLabel(segment)}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            );
          })}
          <BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{note.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{note.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span>
          by{" "}
          {profileHref ? (
            <Link href={profileHref} className="font-medium text-foreground transition-colors hover:text-foreground/70">
              {profileName}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{profileName}</span>
          )}{" "}
          <span className="text-muted-foreground/80">@{profile.username}</span>
        </span>
        {updatedLabel ? <span>Updated {updatedLabel}</span> : null}
      </div>

      {editHref ? (
        <div className="mt-5">
          <Button asChild variant="outline" size="sm" className="rounded-md px-3.5">
            <Link href={editHref}>Open in editor</Link>
          </Button>
        </div>
      ) : null}

      <PublicNoteContent html={articleHtml} />
    </article>
  );
}
