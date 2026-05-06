"use client";

import { useLayoutEffect } from "react";
import {
  COLOR_PROFILE_STORAGE_KEY,
  DEFAULT_COLOR_PROFILE,
  resolveColorProfileId,
} from "@/lib/color-profiles";

function applyStoredColorProfile() {
  try {
    const profile = resolveColorProfileId(
      window.localStorage.getItem(COLOR_PROFILE_STORAGE_KEY),
    );
    document.documentElement.dataset.colorProfile = profile;
  } catch {
    document.documentElement.dataset.colorProfile = DEFAULT_COLOR_PROFILE;
  }
}

export function ColorProfileSync() {
  useLayoutEffect(() => {
    applyStoredColorProfile();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== COLOR_PROFILE_STORAGE_KEY) {
        return;
      }

      applyStoredColorProfile();
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
