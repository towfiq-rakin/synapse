"use client"

import { Check } from "lucide-react"

import { useColorProfile } from "@/hooks/use-color-profile"
import { COLOR_PROFILES, type ColorProfileId } from "@/lib/color-profiles"
import { cn } from "@/lib/utils"

export function ColorProfilePicker() {
  const { colorProfile, setColorProfile } = useColorProfile()

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {COLOR_PROFILES.map((profile) => {
        const selected = profile.id === colorProfile

        return (
          <button
            key={profile.id}
            type="button"
            aria-pressed={selected}
            onClick={() => setColorProfile(profile.id as ColorProfileId)}
            className={cn(
              "group rounded-2xl border bg-background p-3 text-left transition-colors duration-200 hover:bg-muted/40",
              selected
                ? "border-primary ring-2 ring-primary/20"
                : "border-border/80"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{profile.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {profile.description}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-transparent"
                )}
              >
                <Check className="size-3.5" />
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              {profile.swatches.map((swatch, index) => (
                <span
                  key={`${profile.id}-swatch-${index}`}
                  aria-hidden="true"
                  className="size-5 rounded-full border border-border/70"
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
