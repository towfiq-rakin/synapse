"use client";

import dynamic from "next/dynamic";

const SimpleEditor = dynamic(
  () =>
    import("@/components/tiptap-templates/simple/simple-editor").then(
      (module) => module.SimpleEditor,
    ),
  {
    ssr: false,
  },
);

export default function AppIndexPage() {
  return <SimpleEditor />;
}