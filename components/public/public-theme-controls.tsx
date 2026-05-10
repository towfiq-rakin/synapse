"use client";

import { MoonStar, Palette, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useColorProfile } from "@/hooks/use-color-profile";
import { COLOR_PROFILES, type ColorProfileId } from "@/lib/color-profiles";
import { cn } from "@/lib/utils";

function ThemeModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof SunMedium;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border/70 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </button>
  );
}

export default function PublicThemeControls() {
  const { resolvedTheme, setTheme } = useTheme();
  const { colorProfile, setColorProfile } = useColorProfile();
  const themeMode = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 rounded-lg px-3">
          <Palette className="size-4" />
          <span className="hidden sm:inline">Theme</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] gap-5 rounded-2xl border border-border/70 p-4">
        <PopoverHeader>
          <PopoverTitle>Reader theme</PopoverTitle>
        </PopoverHeader>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Mode</p>
          <div className="grid grid-cols-2 gap-2">
            <ThemeModeButton active={themeMode === "light"} icon={SunMedium} label="Light" onClick={() => setTheme("light")} />
            <ThemeModeButton active={themeMode === "dark"} icon={MoonStar} label="Dark" onClick={() => setTheme("dark")} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Profiles</p>
          <div className="grid gap-2 overflow-hidden">
            {COLOR_PROFILES.map((profile) => {
              const selected = profile.id === colorProfile;

              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setColorProfile(profile.id as ColorProfileId)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/8"
                      : "border-border/70 bg-background hover:bg-muted/35",
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{profile.name}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    {profile.swatches.map((swatch, index) => (
                      <span
                        key={`${profile.id}-${index}`}
                        aria-hidden="true"
                        className="size-3.5 rounded-full border border-border/70"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
