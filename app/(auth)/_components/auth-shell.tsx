import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

function SynapseMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg shadow-black/15 backdrop-blur">
        <span
          aria-hidden="true"
          className="block size-7 bg-current"
          style={{
            WebkitMaskImage: "url('/synapse.svg')",
            maskImage: "url('/synapse.svg')",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">Synapse</p>
        <p className="text-lg leading-none [font-family:var(--font-brand-yatra)]">Knowledge workspace</p>
      </div>
    </div>
  );
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-border/70 bg-background/94 shadow-2xl shadow-black/10 backdrop-blur">
      <div className="grid lg:grid-cols-[0.75fr_1fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#102a43_0%,#0f172a_48%,#111827_100%)] lg:flex">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_75%_80%,rgba(34,197,94,0.16),transparent_32%)]" />
          <div className="relative flex min-h-[420px] items-end p-8">
            <SynapseMark />
          </div>
        </div>

        <div className="bg-card/90 p-6 sm:p-8 lg:p-10">
          <div className="mb-6 rounded-2xl bg-[linear-gradient(160deg,#102a43_0%,#0f172a_48%,#111827_100%)] p-4 lg:hidden">
            <SynapseMark />
          </div>
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </section>
  );
}
