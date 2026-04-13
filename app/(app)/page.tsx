"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

export default function AppIndexPage() {
  const editor = useCreateBlockNote();

  return (
    <section className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <BlockNoteView editor={editor} />
      </div>
    </section>
  );
}
