"use client";

import type { SVGProps } from "react";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M21.77 12.25c0-.77-.07-1.5-.2-2.2H12v4.16h5.47a4.68 4.68 0 0 1-2.03 3.07v2.55h3.3c1.93-1.78 3.03-4.4 3.03-7.58Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.74 0 5.03-.9 6.71-2.44l-3.3-2.55c-.91.61-2.07.98-3.41.98-2.62 0-4.84-1.77-5.63-4.14H2.96v2.63A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.37 13.85A5.98 5.98 0 0 1 6.05 12c0-.64.11-1.25.32-1.85V7.52H2.96A10 10 0 0 0 2 12c0 1.61.38 3.13.96 4.48l3.41-2.63Z"
        fill="#FBBC04"
      />
      <path
        d="M12 5.98c1.49 0 2.83.51 3.88 1.5l2.91-2.91C17.02 2.92 14.73 2 12 2a10 10 0 0 0-9.04 5.52l3.41 2.63c.79-2.37 3.01-4.17 5.63-4.17Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.1-.75.09-.73.09-.73 1.21.09 1.85 1.25 1.85 1.25 1.08 1.85 2.84 1.32 3.53 1.01.11-.79.42-1.32.76-1.62-2.66-.31-5.47-1.33-5.47-5.9 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.56.12-3.26 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.7.25 2.95.12 3.26.77.84 1.24 1.92 1.24 3.23 0 4.58-2.81 5.59-5.49 5.89.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground/80">
      <div className="h-px flex-1 bg-border/70" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-border/70" />
    </div>
  );
}

export function AuthField({
  label,
  className,
  error,
  id,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      <Input
        id={fieldId}
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        className={cn("h-11 rounded-xl px-3", className)}
        {...props}
      />
      {/* {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null} */}
    </label>
  );
}

export function PasswordField({
  label,
  className,
  error,
  id,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      <div className="relative">
        <Input
          id={fieldId}
          aria-describedby={errorId}
          aria-invalid={Boolean(error)}
          className={cn("h-11 rounded-xl px-3 pr-10", className)}
          type={visible ? "text" : "password"}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <span className="flex size-4 items-center justify-center">
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </span>
          <span className="sr-only">{visible ? "Hide password" : "Show password"}</span>
        </button>
      </div>
      {/* {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null} */}
    </label>
  );
}
