"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthDivider,
  AuthField,
  GitHubIcon,
  GoogleIcon,
  PasswordField,
} from "./auth-form-ui";
import {
  getFriendlyClerkError,
  isBlank,
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "./auth-validation";

type OAuthProvider = "google" | "github";
type PendingAction = OAuthProvider | "credentials" | "verify-email" | "resend-code" | null;
type SignupStep = "profile" | "credentials" | "verify-email";
type SignupFieldErrors = {
  firstName?: string;
  lastName?: string;
  username?: string;
  emailAddress?: string;
  password?: string;
  verificationCode?: string;
};
const AUTH_CARD_CLASS =
  "flex min-h-[34rem] flex-col rounded-[24px] border border-border/70 bg-card/95 p-5 text-card-foreground shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur sm:h-[34rem] sm:p-7";

export default function CustomSignupForm() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { client, setActive } = useClerk();
  const { signUp } = useSignUp();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [step, setStep] = useState<SignupStep>("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/notes");
    }
  }, [isLoaded, isSignedIn, router]);

  const isBusy = !isLoaded || !client || !setActive || !signUp || pendingAction !== null;
  const canContinueProfile = firstName.trim().length > 0 && lastName.trim().length > 0 && !isBusy;
  const canSubmitSignup =
    username.trim().length > 0 && emailAddress.trim().length > 0 && password.length > 0 && !isBusy;
  const canSubmitVerification = verificationCode.trim().length > 0 && !isBusy;

  async function handleOAuthSignUp(provider: OAuthProvider) {
    if (!client || isBusy) {
      return;
    }

    setPendingAction(provider);
    setErrorMessage(null);

    try {
      await client.signUp.authenticateWithRedirect({
        strategy: provider === "google" ? "oauth_google" : "oauth_github",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/notes",
      });
    } catch (error) {
      setErrorMessage(getFriendlyClerkError(error).message);
      setPendingAction(null);
    }
  }

  function handleProfileContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    const nextErrors: SignupFieldErrors = {};

    if (isBlank(firstName)) {
      nextErrors.firstName = "Enter your first name.";
    }

    if (isBlank(lastName)) {
      nextErrors.lastName = "Enter your last name.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors((current) => ({
        ...current,
        firstName: nextErrors.firstName,
        lastName: nextErrors.lastName,
      }));
      setErrorMessage("Please add your name to continue.");
      return;
    }

    setErrorMessage(null);
    setFieldErrors((current) => ({
      ...current,
      firstName: undefined,
      lastName: undefined,
    }));
    setStep("credentials");
  }

  async function handleCredentialSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!client || !setActive || isBusy) {
      return;
    }

    const nextErrors: SignupFieldErrors = {};

    if (isBlank(username)) {
      nextErrors.username = "Choose a username.";
    } else if (!isValidUsername(username)) {
      nextErrors.username = "Use 3-32 characters: letters, numbers, underscores, or hyphens.";
    }

    if (isBlank(emailAddress)) {
      nextErrors.emailAddress = "Enter your email address.";
    } else if (!isValidEmail(emailAddress)) {
      nextErrors.emailAddress = "Enter a valid email address.";
    }

    if (isBlank(password)) {
      nextErrors.password = "Create a password.";
    } else if (!isValidPassword(password)) {
      nextErrors.password = "Use at least 8 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    setPendingAction("credentials");
    setErrorMessage(null);
    setFieldErrors((current) => ({
      ...current,
      username: undefined,
      emailAddress: undefined,
      password: undefined,
    }));

    try {
      const result = await client.signUp.create({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        username: username.trim() || undefined,
        emailAddress: emailAddress.trim() || undefined,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId, redirectUrl: "/notes" });
        return;
      }

      await result.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify-email");
      setPendingAction(null);
    } catch (error) {
      const friendlyError = getFriendlyClerkError(error);
      setFieldErrors((current) => ({
        ...current,
        username: friendlyError.fieldErrors.username,
        emailAddress: friendlyError.fieldErrors.email_address,
        password: friendlyError.fieldErrors.password,
      }));
      setErrorMessage(friendlyError.message);
      setPendingAction(null);
    }
  }

  async function handleEmailVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!client || !setActive || isBusy) {
      return;
    }

    if (isBlank(verificationCode)) {
      setFieldErrors((current) => ({
        ...current,
        verificationCode: "Enter the verification code.",
      }));
      setErrorMessage("Enter the code sent to your email.");
      return;
    }

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setFieldErrors((current) => ({
        ...current,
        verificationCode: "Enter the 6-digit code from your email.",
      }));
      setErrorMessage("Enter a valid verification code.");
      return;
    }

    setPendingAction("verify-email");
    setErrorMessage(null);
    setFieldErrors((current) => ({
      ...current,
      verificationCode: undefined,
    }));

    try {
      const result = await client.signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId, redirectUrl: "/notes" });
        return;
      }

      setErrorMessage("Your account is not ready yet. Check the verification code and try again.");
      setPendingAction(null);
    } catch (error) {
      const friendlyError = getFriendlyClerkError(error);
      setFieldErrors((current) => ({
        ...current,
        verificationCode: friendlyError.fieldErrors.code,
      }));
      setErrorMessage(friendlyError.message);
      setPendingAction(null);
    }
  }

  async function handleResendCode() {
    if (!client || isBusy) {
      return;
    }

    setPendingAction("resend-code");
    setErrorMessage(null);

    try {
      await client.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (error) {
      const friendlyError = getFriendlyClerkError(error);
      setFieldErrors((current) => ({
        ...current,
        verificationCode: friendlyError.fieldErrors.code,
      }));
      setErrorMessage(friendlyError.message);
    } finally {
      setPendingAction(null);
    }
  }

  function handleBackToProfile() {
    if (isBusy) {
      return;
    }

    setErrorMessage(null);
    setStep("profile");
  }

  function handleBackToCredentials() {
    if (isBusy) {
      return;
    }

    setErrorMessage(null);
    setStep("credentials");
  }

  const title = step === "verify-email" ? "Verify your email" : "Create your account";
  const description =
    step === "profile"
      ? "Start with OAuth or add your name."
      : step === "credentials"
        ? "Choose your username, email, and password."
        : `Enter the code sent to ${emailAddress.trim() || "your email address"}.`;

  if (isLoaded && isSignedIn) {
    return (
      <section className="rounded-[24px] border border-border/70 bg-card/95 p-6 text-card-foreground shadow-lg">
        <p className="text-sm text-muted-foreground">Redirecting to your notes…</p>
      </section>
    );
  }

  return (
    <section className={AUTH_CARD_CLASS}>
      <header className="space-y-2 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="mt-6 flex flex-1 flex-col">
        {step === "profile" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                disabled={isBusy}
                onClick={() => handleOAuthSignUp("github")}
              >
                {pendingAction === "github" ? <Loader2 className="size-4 animate-spin" /> : <GitHubIcon className="size-4" />}
                GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                disabled={isBusy}
                onClick={() => handleOAuthSignUp("google")}
              >
                {pendingAction === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon className="size-4" />}
                Google
              </Button>
            </div>

            <div className="my-6">
              <AuthDivider />
            </div>

            <form className="flex flex-1 flex-col" noValidate onSubmit={handleProfileContinue}>
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField
                  autoComplete="given-name"
                  disabled={isBusy}
                  error={fieldErrors.firstName}
                  label="First name"
                  placeholder="First name"
                  required
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    setFieldErrors((current) => ({ ...current, firstName: undefined }));
                    setErrorMessage(null);
                  }}
                />
                <AuthField
                  autoComplete="family-name"
                  disabled={isBusy}
                  error={fieldErrors.lastName}
                  label="Last name"
                  placeholder="Last name"
                  required
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    setFieldErrors((current) => ({ ...current, lastName: undefined }));
                    setErrorMessage(null);
                  }}
                />
              </div>

              <Button
                type="submit"
                className="mt-auto h-11 w-full rounded-xl bg-[linear-gradient(90deg,#6d5efc_0%,#7c3aed_100%)] text-white hover:opacity-95"
                disabled={!canContinueProfile}
              >
                Continue
              </Button>
            </form>
          </>
        ) : null}

        {step === "credentials" ? (
          <form className="flex flex-1 flex-col" noValidate onSubmit={handleCredentialSignUp}>
            <div className="space-y-4">
              <AuthField
                autoComplete="username"
                disabled={isBusy}
                error={fieldErrors.username}
                label="Username"
                placeholder="Enter your username"
                required
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setFieldErrors((current) => ({ ...current, username: undefined }));
                  setErrorMessage(null);
                }}
              />

              <AuthField
                autoComplete="email"
                disabled={isBusy}
                error={fieldErrors.emailAddress}
                label="Email address"
                placeholder="Enter your email address"
                required
                type="email"
                value={emailAddress}
                onChange={(event) => {
                  setEmailAddress(event.target.value);
                  setFieldErrors((current) => ({ ...current, emailAddress: undefined }));
                  setErrorMessage(null);
                }}
              />

              <PasswordField
                autoComplete="new-password"
                disabled={isBusy}
                error={fieldErrors.password}
                label="Password"
                placeholder="Create a password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                  setErrorMessage(null);
                }}
              />

              <div
                id="clerk-captcha"
                data-cl-theme="auto"
                data-cl-size="flexible"
                className="overflow-hidden rounded-xl"
              />
            </div>

            <div className="space-y-3 pt-4">
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[linear-gradient(90deg,#6d5efc_0%,#7c3aed_100%)] text-white hover:opacity-95"
                disabled={!canSubmitSignup}
              >
                {pendingAction === "credentials" ? <Loader2 className="size-4 animate-spin" /> : null}
                Continue
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-xl"
                disabled={isBusy}
                onClick={handleBackToProfile}
              >
                Back
              </Button>
            </div>

            <div className="flex-1" />
          </form>
        ) : null}

        {step === "verify-email" ? (
          <form className="flex flex-1 flex-col" noValidate onSubmit={handleEmailVerification}>
            <div className="space-y-4">
              <AuthField
                autoComplete="one-time-code"
                disabled={isBusy}
                error={fieldErrors.verificationCode}
                inputMode="numeric"
                label="Verification code"
                placeholder="Enter the code from your email"
                required
                value={verificationCode}
                onChange={(event) => {
                  setVerificationCode(event.target.value);
                  setFieldErrors((current) => ({ ...current, verificationCode: undefined }));
                  setErrorMessage(null);
                }}
              />
            </div>

            <div className="space-y-3 pt-4">
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[linear-gradient(90deg,#6d5efc_0%,#7c3aed_100%)] text-white hover:opacity-95"
                disabled={!canSubmitVerification}
              >
                {pendingAction === "verify-email" ? <Loader2 className="size-4 animate-spin" /> : null}
                Verify email
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl"
                disabled={isBusy}
                onClick={handleResendCode}
              >
                {pendingAction === "resend-code" ? <Loader2 className="size-4 animate-spin" /> : null}
                Resend code
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-xl"
                disabled={isBusy}
                onClick={handleBackToCredentials}
              >
                Back
              </Button>
            </div>

            <div className="flex-1" />
          </form>
        ) : null}
      </div>

      <div className="mt-4 min-h-5 text-center" aria-live="polite">
        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {!errorMessage && !isLoaded ? <p className="text-sm text-muted-foreground">Preparing secure sign-up…</p> : null}
      </div>

      {step === "profile" ? (
        <footer className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-primary transition-colors hover:text-primary/80" href="/login">
            Sign in
          </Link>
        </footer>
      ) : null}
    </section>
  );
}
