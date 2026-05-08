type PublicProfileLike = {
  username: string;
  name: string;
  displayName?: string | null;
  bio?: string | null;
  isPublicProfile?: boolean | null;
  publishedAt?: Date | null;
};

export type NormalizedPublicProfile = {
  username: string;
  name: string;
  displayName: string | null;
  bio: string | null;
  isPublicProfile: boolean;
  publishedAt: Date | null;
};

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizePublicProfile(profile: PublicProfileLike): NormalizedPublicProfile {
  return {
    username: profile.username,
    name: profile.name,
    displayName: normalizeOptionalText(profile.displayName),
    bio: normalizeOptionalText(profile.bio),
    isPublicProfile: Boolean(profile.isPublicProfile),
    publishedAt: profile.publishedAt ?? null,
  };
}
