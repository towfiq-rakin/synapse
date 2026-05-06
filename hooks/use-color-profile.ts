"use client"

import { useEffect, useState } from "react"

import {
  COLOR_PROFILE_STORAGE_KEY,
  DEFAULT_COLOR_PROFILE,
  resolveColorProfileId,
  type ColorProfileId,
} from "@/lib/color-profiles"

function applyColorProfile(profile: ColorProfileId) {
  document.documentElement.dataset.colorProfile = profile
}

function readColorProfile(): ColorProfileId {
  if (typeof document !== "undefined") {
    const profileFromDom = resolveColorProfileId(
      document.documentElement.dataset.colorProfile
    )

    if (profileFromDom !== DEFAULT_COLOR_PROFILE) {
      return profileFromDom
    }
  }

  if (typeof window !== "undefined") {
    return resolveColorProfileId(
      window.localStorage.getItem(COLOR_PROFILE_STORAGE_KEY)
    )
  }

  return DEFAULT_COLOR_PROFILE
}

export function useColorProfile() {
  const [colorProfile, setColorProfileState] = useState<ColorProfileId>(() =>
    readColorProfile()
  )

  useEffect(() => {
    applyColorProfile(colorProfile)

    try {
      window.localStorage.setItem(COLOR_PROFILE_STORAGE_KEY, colorProfile)
    } catch {
      // noop: localStorage unavailable
    }
  }, [colorProfile])

  function setColorProfile(profile: ColorProfileId) {
    setColorProfileState(profile)
  }

  return {
    colorProfile,
    setColorProfile,
  }
}
