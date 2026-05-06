export const COLOR_PROFILE_STORAGE_KEY = "synapse-color-profile"

export const COLOR_PROFILES = [
  {
    id: "default",
    name: "Default",
    description: "Synapse default theme.",
    swatches: [
      "oklch(0.9900 0 0)",
      "oklch(0 0 0)",
      "oklch(0.9400 0 0)",
      "oklch(0 0 0)",
    ],
  },
  {
    id: "claude",
    name: "Claude",
    description: "Warm, calm, document-friendly palette.",
    swatches: [
      "oklch(0.9818 0.0054 95.0986)",
      "oklch(0.3438 0.0269 95.7226)",
      "oklch(0.6171 0.1375 39.0427)",
      "oklch(0.9245 0.0138 92.9892)",
    ],
  },
  {
    id: "nature",
    name: "Nature",
    description: "Organic green-inspired palette.",
    swatches: [
      "oklch(0.9711 0.0074 80.7211)",
      "oklch(0.3000 0.0358 30.2042)",
      "oklch(0.5234 0.1347 144.1672)",
      "oklch(0.8952 0.0504 146.0366)",
    ],
  },
  {
    id: "vintage-paper",
    name: "Vintage Paper",
    description: "Soft paper-like writing surface.",
    swatches: [
      "oklch(0.9582 0.0152 90.2357)",
      "oklch(0.3760 0.0225 64.3434)",
      "oklch(0.6180 0.0778 65.5444)",
      "oklch(0.8348 0.0426 88.8064)",
    ],
  },
  {
    id: "dark-matter",
    name: "Dark Matter",
    description: "Deep high-contrast dark interface.",
    swatches: [
      "oklch(0.1797 0.0043 308.1928)",
      "oklch(0.8109 0 0)",
      "oklch(0.7214 0.1337 49.9802)",
      "oklch(0.3211 0 0)",
    ],
  },
  {
    id: "perpetuity",
    name: "Perpetuity",
    description: "Balanced long-form writing palette.",
    swatches: [
      "oklch(0.9491 0.0085 197.0126)",
      "oklch(0.3772 0.0619 212.6640)",
      "oklch(0.5624 0.0947 203.2755)",
      "oklch(0.9021 0.0297 201.8915)",
    ],
  },
] as const

export type ColorProfileId = (typeof COLOR_PROFILES)[number]["id"]

export const DEFAULT_COLOR_PROFILE: ColorProfileId = "default"

export function isColorProfileId(value: string): value is ColorProfileId {
  return COLOR_PROFILES.some((profile) => profile.id === value)
}

export function resolveColorProfileId(value: string | null | undefined): ColorProfileId {
  if (!value) {
    return DEFAULT_COLOR_PROFILE
  }

  return isColorProfileId(value) ? value : DEFAULT_COLOR_PROFILE
}
