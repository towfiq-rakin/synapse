"use client"

import { startTransition, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import {
  BadgeCheck,
  BookOpenText,
  Check,
  CircleUserRound,
  ImagePlus,
  Loader2,
  MoonStar,
  Settings2,
  Sparkles,
  SunMedium,
  Upload,
  Type,
} from "lucide-react"
import { toast } from "sonner"

import { AuthField, PasswordField } from "@/app/(auth)/_components/auth-form-ui"
import { getFriendlyClerkError, isValidPassword } from "@/app/(auth)/_components/auth-validation"
import { Button } from "@/components/ui/button"
import { ColorProfilePicker } from "@/components/settings/color-profile-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_INTERFACE_DENSITY,
  DEFAULT_READING_SIZE,
  INTERFACE_DENSITY_STORAGE_KEY,
  INTERFACE_DENSITY_VALUES,
  READING_SIZE_STORAGE_KEY,
  READING_SIZE_VALUES,
  type InterfaceDensity,
  type ReadingSize,
} from "@/lib/ui-preferences"
import { cn } from "@/lib/utils"

type SettingsSection = "account" | "appearance" | "editor" | "workspace"

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSection?: SettingsSection
  user: {
    name: string | null
    email: string | null
    image: string | null
    username?: string | null
    displayName?: string | null
    bio?: string | null
    isPublicProfile?: boolean
  } | null
}

type SettingsActionResult = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string | undefined>
  username?: string
  profile?: {
    displayName?: string | null
    bio?: string | null
    isPublicProfile?: boolean
  }
}

const sections: Array<{
  id: SettingsSection
  label: string
  eyebrow: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    id: "account",
    label: "Account",
    eyebrow: "Profile",
    icon: BadgeCheck,
  },
  {
    id: "appearance",
    label: "Appearance",
    eyebrow: "Look and feel",
    icon: Sparkles,
  },
  {
    id: "editor",
    label: "Editor",
    eyebrow: "Writing flow",
    icon: BookOpenText,
  },
  {
    id: "workspace",
    label: "Workspace",
    eyebrow: "Shared defaults",
    icon: Settings2,
  },
]

function SectionButton({
  label,
  eyebrow,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  eyebrow: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors duration-200",
        active
          ? "border-foreground/10 bg-background text-foreground"
          : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-background/80 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border",
          active ? "border-border bg-muted text-foreground" : "border-transparent bg-muted/60 text-muted-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </span>
        <span className="mt-1 block text-sm font-medium text-foreground">{label}</span>
      </span>
    </button>
  )
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function ToggleButton({
  pressed,
  label,
  onClick,
}: {
  pressed: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "flex min-w-24 cursor-pointer items-center justify-between rounded-full border px-3 py-2 text-sm transition-colors duration-200",
        pressed
          ? "border-foreground/10 bg-foreground text-background"
          : "border-border bg-background text-foreground hover:bg-muted"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "ml-3 flex size-5 items-center justify-center rounded-full transition-colors",
          pressed ? "bg-background/15 text-background" : "bg-muted text-muted-foreground"
        )}
      >
        <Check className="size-3.5" />
      </span>
    </button>
  )
}

function SegmentedChoice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{
    value: T
    label: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-muted/80 p-1">
      {options.map((option) => {
        const Icon = option.icon

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors duration-200",
              value === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon ? <Icon className="size-4" /> : null}
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function SettingsDialog({
  open,
  onOpenChange,
  initialSection = "appearance",
  user,
}: SettingsDialogProps) {
  const router = useRouter()
  const { user: clerkUser, isLoaded } = useUser()
  const { resolvedTheme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection)
  const [density, setDensity] = useState<InterfaceDensity>(DEFAULT_INTERFACE_DENSITY)
  const [fontSize, setFontSize] = useState<ReadingSize>(DEFAULT_READING_SIZE)
  const [showRecentSearches, setShowRecentSearches] = useState(true)
  const [showSlashHints, setShowSlashHints] = useState(true)
  const [openLinksInPeek, setOpenLinksInPeek] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("Synapse Workspace")
  const [workspaceGuideline, setWorkspaceGuideline] = useState(
    "Keep notes terse, searchable, and ready to publish."
  )
  const [username, setUsername] = useState(user?.username ?? "")
  const [usernameError, setUsernameError] = useState("")
  const [usernameStatus, setUsernameStatus] = useState("")
  const [savingUsername, setSavingUsername] = useState(false)
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(Boolean(user?.isPublicProfile))
  const [publicProfileDisplayName, setPublicProfileDisplayName] = useState(user?.displayName ?? "")
  const [publicProfileBio, setPublicProfileBio] = useState(user?.bio ?? "")
  const [publicProfileError, setPublicProfileError] = useState("")
  const [publicProfileStatus, setPublicProfileStatus] = useState("")
  const [savingPublicProfile, setSavingPublicProfile] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [signOutOtherSessions, setSignOutOtherSessions] = useState(true)
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})
  const [passwordStatus, setPasswordStatus] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const themeMode = resolvedTheme === "dark" ? "dark" : "light"
  const userName =
    clerkUser?.fullName?.trim() ||
    user?.name?.trim() ||
    "Synapse User"
  const userEmail =
    clerkUser?.primaryEmailAddress?.emailAddress?.trim() ||
    user?.email?.trim() ||
    "account@synapse.app"
  const usernameValue =
    clerkUser?.username?.trim() ||
    user?.username?.trim() ||
    ""
  const profileImageUrl = clerkUser?.imageUrl || user?.image || ""
  const hasUserImage = Boolean(profileImageUrl)

  useEffect(() => {
    if (open) {
      setActiveSection(initialSection)
    }
  }, [initialSection, open])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const storedDensity = window.localStorage.getItem(INTERFACE_DENSITY_STORAGE_KEY)
    const storedReadingSize = window.localStorage.getItem(READING_SIZE_STORAGE_KEY)

    const nextDensity = INTERFACE_DENSITY_VALUES.includes(storedDensity as InterfaceDensity)
      ? (storedDensity as InterfaceDensity)
      : DEFAULT_INTERFACE_DENSITY
    const nextReadingSize = READING_SIZE_VALUES.includes(storedReadingSize as ReadingSize)
      ? (storedReadingSize as ReadingSize)
      : DEFAULT_READING_SIZE

    setDensity(nextDensity)
    setFontSize(nextReadingSize)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    document.documentElement.dataset.interfaceDensity = density
    window.localStorage.setItem(INTERFACE_DENSITY_STORAGE_KEY, density)
  }, [density])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    document.documentElement.dataset.readingSize = fontSize
    window.localStorage.setItem(READING_SIZE_STORAGE_KEY, fontSize)
  }, [fontSize])

  useEffect(() => {
    if (!open) {
      return
    }

    setUsername(usernameValue)
    setUsernameError("")
    setUsernameStatus("")
    setPublicProfileEnabled(Boolean(user?.isPublicProfile))
    setPublicProfileDisplayName(user?.displayName ?? "")
    setPublicProfileBio(user?.bio ?? "")
    setPublicProfileError("")
    setPublicProfileStatus("")
    setPasswordDialogOpen(false)
    resetPasswordForm()
  }, [open, user?.bio, user?.displayName, user?.isPublicProfile, usernameValue])

  useEffect(() => {
    if (passwordDialogOpen) {
      return
    }

    resetPasswordForm()
  }, [passwordDialogOpen])

  function resetPasswordForm() {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordErrors({})
    setPasswordStatus("")
  }

  function refreshShell() {
    startTransition(() => {
      router.refresh()
    })
  }

  function isValidAppUsername(value: string) {
    return /^[a-z0-9-]{3,32}$/.test(value.trim())
  }

  async function handleProfileImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || !clerkUser) {
      return
    }

    setUploadingImage(true)

    try {
      await clerkUser.setProfileImage({ file })
      await clerkUser.reload()
      refreshShell()
      toast.success("Profile picture updated.")
    } catch (error) {
      const friendly = getFriendlyClerkError(error)
      toast.error(friendly.message)
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleUsernameSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalized = username.trim().toLowerCase()
    setUsernameError("")
    setUsernameStatus("")

    if (!normalized) {
      setUsernameError("Choose a username.")
      return
    }

    if (!isValidAppUsername(normalized)) {
      setUsernameError("Use 3-32 lowercase letters, numbers, or hyphens.")
      return
    }

    if (normalized === usernameValue) {
      setUsernameStatus("Username is already up to date.")
      return
    }

    setSavingUsername(true)

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized }),
      })

      const data = (await response.json().catch(() => null)) as SettingsActionResult | null

      if (!response.ok || !data?.success) {
        setUsernameError(data?.fieldErrors?.username || data?.error || "Could not update username.")
        return
      }

      setUsername(data.username ?? normalized)
      setUsernameStatus("Username updated.")
      await clerkUser?.reload()
      refreshShell()
      toast.success("Username updated.")
    } catch {
      setUsernameError("Could not update username right now.")
    } finally {
      setSavingUsername(false)
    }
  }

  async function handlePasswordSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: {
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    } = {}

    if (!currentPassword.trim()) {
      nextErrors.currentPassword = "Enter your current password."
    }

    if (!newPassword) {
      nextErrors.newPassword = "Enter a new password."
    } else if (!isValidPassword(newPassword)) {
      nextErrors.newPassword = "Use at least 8 characters."
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your new password."
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match."
    }

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors)
      setPasswordStatus("")
      return
    }

    setSavingPassword(true)
    setPasswordErrors({})
    setPasswordStatus("")

    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          signOutOfOtherSessions: signOutOtherSessions,
        }),
      })
      const result = (await response.json().catch(() => null)) as SettingsActionResult | null

      if (!response.ok || !result?.success) {
        setPasswordErrors({
          currentPassword: result?.fieldErrors?.currentPassword,
          newPassword: result?.fieldErrors?.newPassword,
          confirmPassword: result?.fieldErrors?.confirmPassword,
        })
        setPasswordStatus(result?.error || "Could not update password.")
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordErrors({})
      setPasswordStatus("")
      setPasswordDialogOpen(false)
      toast.success("Password updated.")
    } catch (error) {
      const friendly = getFriendlyClerkError(error)
      setPasswordStatus(friendly.message)
      setPasswordErrors({
        currentPassword: friendly.fieldErrors.password,
        newPassword: friendly.fieldErrors.password,
      })
    } finally {
      setSavingPassword(false)
    }
  }

  async function handlePublicProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPublicProfileError("")
    setPublicProfileStatus("")
    setSavingPublicProfile(true)

    try {
      const response = await fetch("/api/settings/public-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublicProfile: publicProfileEnabled,
          displayName: publicProfileDisplayName,
          bio: publicProfileBio,
        }),
      })

      const data = (await response.json().catch(() => null)) as SettingsActionResult | null

      if (!response.ok || !data?.success) {
        setPublicProfileError(data?.error || "Could not update public profile.")
        return
      }

      setPublicProfileEnabled(Boolean(data.profile?.isPublicProfile ?? publicProfileEnabled))
      setPublicProfileDisplayName(data.profile?.displayName ?? "")
      setPublicProfileBio(data.profile?.bio ?? "")
      setPublicProfileStatus(publicProfileEnabled ? "Public profile is live." : "Public profile disabled.")
      refreshShell()
      toast.success(publicProfileEnabled ? "Public profile updated." : "Public profile hidden.")
    } catch {
      setPublicProfileError("Could not update public profile right now.")
    } finally {
      setSavingPublicProfile(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-[min(88dvh,820px)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden rounded-[28px] border border-border/80 p-0 shadow-2xl sm:!max-w-6xl"
      >
        <div className="grid min-h-0 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b border-border bg-muted/45 md:border-r md:border-b-0">
            <div className="flex items-start justify-between gap-4 px-4 pb-4 pt-5 md:px-5 md:pb-5 md:pt-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Settings
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                  Workspace controls
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                onClick={() => onOpenChange(false)}
              >
                <span className="sr-only">Close settings</span>
                <span className="text-lg leading-none">X</span>
              </Button>
            </div>

            <div className="px-3 pb-3 md:px-4 md:pb-4">
              <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
                {sections.map((section) => (
                  <div key={section.id} className="min-w-[220px] md:min-w-0">
                    <SectionButton
                      label={section.label}
                      eyebrow={section.eyebrow}
                      icon={section.icon}
                      active={activeSection === section.id}
                      onClick={() => setActiveSection(section.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto bg-background">
            <div className="border-b border-border/80 px-5 py-5 sm:px-7 sm:py-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  {sections.find((section) => section.id === activeSection)?.label}
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-7">
              {activeSection === "account" ? (
                <>
                  <div className="rounded-[24px] border border-border/80 bg-muted/35 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background text-foreground">
                          {hasUserImage ? (
                            <span
                              aria-hidden="true"
                              className="size-full bg-cover bg-center bg-no-repeat"
                              style={{ backgroundImage: `url("${profileImageUrl}")` }}
                            />
                          ) : (
                            <CircleUserRound className="size-6" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Signed in
                          </p>
                          <h3 className="mt-1 truncate text-lg font-semibold text-foreground">
                            {userName}
                          </h3>
                          <p className="truncate text-sm text-muted-foreground">{userEmail}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!isLoaded || uploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploadingImage ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : hasUserImage ? (
                            <Upload className="size-4" />
                          ) : (
                            <ImagePlus className="size-4" />
                          )}
                          {hasUserImage ? "Change photo" : "Upload photo"}
                        </Button>
                        <p className="max-w-[16rem] text-right text-xs leading-5 text-muted-foreground">
                          Profile image uploads are handled by Clerk.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border/80 bg-background p-4">
                    <div className="pb-4">
                      <h3 className="text-sm font-medium text-foreground">Username</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        This updates both your Clerk profile and the app&apos;s public note path.
                      </p>
                    </div>
                    <form className="grid gap-4" onSubmit={handleUsernameSave}>
                      <AuthField
                        label="Username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        error={usernameError}
                        autoComplete="username"
                        spellCheck={false}
                        className="bg-background lowercase"
                      />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          Use 3-32 lowercase letters, numbers, or hyphens.
                        </p>
                        <Button type="submit" variant="outline" disabled={savingUsername}>
                          {savingUsername ? <Loader2 className="size-4 animate-spin" /> : null}
                          Save username
                        </Button>
                      </div>
                      {usernameStatus ? (
                        <p className="text-sm text-muted-foreground">{usernameStatus}</p>
                      ) : null}
                    </form>
                  </div>

                  <div className="rounded-[24px] border border-border/80 bg-background p-4">
                    <div className="pb-4">
                      <h3 className="text-sm font-medium text-foreground">Password</h3>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Change password in focused modal.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        Change password
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}

              {activeSection === "appearance" ? (
                <>
                  <div className="space-y-4">
                    <SettingRow
                      title="Theme mode"
                      description="Switch app shell between light and dark."
                    >
                      <SegmentedChoice
                        value={themeMode}
                        onChange={(value) => setTheme(value)}
                        options={[
                          { value: "light", label: "Light", icon: SunMedium },
                          { value: "dark", label: "Dark", icon: MoonStar },
                        ]}
                      />
                    </SettingRow>

                    <div className="rounded-[24px] border border-border/80 bg-background p-4">
                      <div className="pb-4">
                        <h3 className="text-sm font-medium text-foreground">
                          Color profile
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Choose a TweakCN color palette for the app interface.
                        </p>
                      </div>
                      <ColorProfilePicker />
                    </div>

                    <SettingRow
                      title="Interface density"
                      description="Controls spacing for lists, rails, and cards."
                    >
                      <SegmentedChoice
                        value={density}
                        onChange={setDensity}
                        options={[
                          { value: "compact", label: "Compact" },
                          { value: "comfortable", label: "Comfortable" },
                        ]}
                      />
                    </SettingRow>

                    <SettingRow
                      title="Reading size"
                      description="Preview text scale for notes."
                    >
                      <SegmentedChoice
                        value={fontSize}
                        onChange={setFontSize}
                        options={[
                          { value: "small", label: "Small" },
                          { value: "medium", label: "Medium" },
                          { value: "large", label: "Large" },
                        ]}
                      />
                    </SettingRow>
                  </div>
                </>
              ) : null}

              {activeSection === "editor" ? (
                <>
                  <SettingRow
                    title="Recent search history"
                    description="Keep the search dialog warm by surfacing recent note queries."
                  >
                    <ToggleButton
                      pressed={showRecentSearches}
                      label={showRecentSearches ? "Enabled" : "Disabled"}
                      onClick={() => setShowRecentSearches((value) => !value)}
                    />
                  </SettingRow>

                  <SettingRow
                    title="Slash command hints"
                    description="Show lightweight prompts while typing slash commands in the editor."
                  >
                    <ToggleButton
                      pressed={showSlashHints}
                      label={showSlashHints ? "Visible" : "Hidden"}
                      onClick={() => setShowSlashHints((value) => !value)}
                    />
                  </SettingRow>

                  <SettingRow
                    title="Open links in peek"
                    description="Keep outbound links inside a lightweight reading preview."
                  >
                    <ToggleButton
                      pressed={openLinksInPeek}
                      label={openLinksInPeek ? "Peek mode" : "New tab"}
                      onClick={() => setOpenLinksInPeek((value) => !value)}
                    />
                  </SettingRow>

                  <div className="rounded-[24px] border border-border/80 bg-muted/35 p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background">
                        <Type className="size-4 text-foreground" />
                      </span>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Editorial defaults
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Interface density and reading size preferences are now applied globally
                          and persisted for future sessions.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {activeSection === "workspace" ? (
                <>
                  <div className="rounded-[24px] border border-border/80 bg-background p-4">
                    <div className="pb-4">
                      <h3 className="text-sm font-medium text-foreground">Public profile</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Control whether published notes appear in your public Synapse workspace.
                      </p>
                    </div>
                    <form className="grid gap-4" onSubmit={handlePublicProfileSave}>
                      <SettingRow
                        title="Workspace visibility"
                        description="Published notes become reachable on your public profile only when this is enabled."
                      >
                        <ToggleButton
                          pressed={publicProfileEnabled}
                          label={publicProfileEnabled ? "Public" : "Private"}
                          onClick={() => setPublicProfileEnabled((value) => !value)}
                        />
                      </SettingRow>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-foreground" htmlFor="public-display-name">
                            Public display name
                          </label>
                          <Input
                            id="public-display-name"
                            value={publicProfileDisplayName}
                            onChange={(event) => setPublicProfileDisplayName(event.target.value)}
                            placeholder="Optional"
                            className="bg-background"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-foreground" htmlFor="public-username-preview">
                            Public path
                          </label>
                          <Input
                            id="public-username-preview"
                            value={usernameValue ? `/u/${usernameValue}` : "/u/username"}
                            readOnly
                            className="bg-background text-muted-foreground"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="public-bio">
                          Public bio
                        </label>
                        <Textarea
                          id="public-bio"
                          value={publicProfileBio}
                          onChange={(event) => setPublicProfileBio(event.target.value)}
                          placeholder="Optional short note for your public workspace."
                          className="min-h-24 bg-background"
                        />
                      </div>

                      {publicProfileError ? (
                        <p className="text-sm text-destructive">{publicProfileError}</p>
                      ) : null}
                      {publicProfileStatus ? (
                        <p className="text-sm text-muted-foreground">{publicProfileStatus}</p>
                      ) : null}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          Unlisted share links stay off the public explorer even when your profile is public.
                        </p>
                        <Button type="submit" variant="outline" disabled={savingPublicProfile}>
                          {savingPublicProfile ? <Loader2 className="size-4 animate-spin" /> : null}
                          Save public profile
                        </Button>
                      </div>
                    </form>
                  </div>

                  <SettingRow
                    title="Workspace name"
                    description="Used in onboarding copy and future shared surfaces."
                  >
                    <Input
                      value={workspaceName}
                      onChange={(event) => setWorkspaceName(event.target.value)}
                      className="w-full min-w-[14rem] bg-background"
                    />
                  </SettingRow>

                  <div className="rounded-[24px] border border-border/80 bg-background p-4">
                    <div className="pb-4">
                      <h3 className="text-sm font-medium text-foreground">Writing guideline</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        A small shared note for the tone and shape of documents in this
                        workspace.
                      </p>
                    </div>
                    <Textarea
                      value={workspaceGuideline}
                      onChange={(event) => setWorkspaceGuideline(event.target.value)}
                      className="min-h-28 bg-background"
                    />
                  </div>

                  <div className="rounded-[24px] border border-border/80 bg-muted/35 p-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border bg-background px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Default privacy
                        </p>
                        <p className="mt-2 text-sm font-medium text-foreground">Private</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-background px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Publish style
                        </p>
                        <p className="mt-2 text-sm font-medium text-foreground">Clean export</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-background px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Sync mode
                        </p>
                        <p className="mt-2 text-sm font-medium text-foreground">Automatic</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <Separator />
            <DialogFooter className="items-center justify-between gap-3 px-5 py-4 sm:flex-row sm:px-7">
              <p className="text-sm text-muted-foreground">
                Some settings still local only.
              </p>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-h-[min(90dvh,42rem)] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-[28px] border border-border/80 p-0 shadow-2xl sm:max-w-lg">
          <form className="grid gap-5 p-5 sm:p-6" onSubmit={handlePasswordSave}>
            <DialogHeader className="gap-3">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Change password
              </DialogTitle>
              <DialogDescription className="text-sm leading-6">
                Enter current password, then choose new one.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <PasswordField
                label="Current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                error={passwordErrors.currentPassword}
                autoComplete="current-password"
                className="bg-background"
              />
              <PasswordField
                label="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                error={passwordErrors.newPassword}
                autoComplete="new-password"
                className="bg-background"
              />
              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={passwordErrors.confirmPassword}
                autoComplete="new-password"
                className="bg-background"
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/35 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Sign out other sessions</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recommended after password change.
                </p>
              </div>
              <ToggleButton
                pressed={signOutOtherSessions}
                label={signOutOtherSessions ? "Enabled" : "Disabled"}
                onClick={() => setSignOutOtherSessions((value) => !value)}
              />
            </div>

            {passwordStatus ? (
              <p className="text-sm text-muted-foreground">{passwordStatus}</p>
            ) : null}

            <DialogFooter className="gap-3 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="outline" disabled={savingPassword}>
                {savingPassword ? <Loader2 className="size-4 animate-spin" /> : null}
                Update password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
