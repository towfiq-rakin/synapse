"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useSignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthDivider,
  AuthField,
  GitHubIcon,
  GoogleIcon,
  PasswordField,
} from "./auth-form-ui";
import { getFriendlyClerkError, isBlank } from "./auth-validation";

type OAuthProvider = "google" | "github";
type PendingAction = OAuthProvider | "credentials" | "verification" | null;
type LoginFieldErrors = {
  identifier?: string;
  password?: string;
  code?: string;
};
const AUTH_CARD_CLASS =
  "flex min-h-[34rem] flex-col rounded-[24px] border border-border/70 bg-card/95 p-5 text-card-foreground shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur sm:p-7";

export default function CustomLoginForm() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { client, setActive } = useClerk();
  const { signIn } = useSignIn();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/notes");
    }
  }, [isLoaded, isSignedIn, router]);

  const isBusy = !isLoaded || !client || !setActive || !signIn || pendingAction !== null;
  const canSubmitCredentials = needsVerification
    ? verificationCode.trim().length > 0 && !isBusy
    : identifier.trim().length > 0 && password.length > 0 && !isBusy;

  async function handleOAuthSignIn(provider: OAuthProvider) {
    if (!client || isBusy) {
      return;
    }

    setPendingAction(provider);
    setErrorMessage(null);

    try {
      await client.signIn.authenticateWithRedirect({
        strategy: provider === "google" ? "oauth_google" : "oauth_github",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/notes",
      });
    } catch (error) {
      setErrorMessage(getFriendlyClerkError(error).message);
      setPendingAction(null);
    }
  }

  async function handleCredentialSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!client || !setActive || isBusy) {
      return;
    }

    const nextErrors: LoginFieldErrors = {};

    if (needsVerification) {
      if (isBlank(verificationCode)) {
        nextErrors.code = "Enter the verification code.";
      }
    } else {
      if (isBlank(identifier)) {
        nextErrors.identifier = "Enter your email address or username.";
      }

      if (isBlank(password)) {
        nextErrors.password = "Enter your password.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    setPendingAction("credentials");
    setErrorMessage(null);
    setFieldErrors({});

    try {
      if (needsVerification) {
        setPendingAction("verification");
        
        let verifyResult;
        if (client.signIn.status === 'needs_client_trust' || client.signIn.status === 'needs_second_factor') {
            const factor = client.signIn.supportedSecondFactors?.find(
                (f) => f.strategy === 'email_code' || f.strategy === 'phone_code'
            );
            
            if (factor?.strategy === 'email_code') {
                verifyResult = await client.signIn.attemptSecondFactor({ strategy: 'email_code', code: verificationCode });
            } else {
                throw new Error("Unsupported verification method.");
            }
        } else if (client.signIn.status === 'needs_first_factor') {
            verifyResult = await client.signIn.attemptFirstFactor({ strategy: 'email_code', code: verificationCode });
        } else {
            throw new Error("Unexpected sign in status: " + client.signIn.status);
        }

        if (verifyResult.status === "complete" && verifyResult.createdSessionId) {
            await setActive({ session: verifyResult.createdSessionId, redirectUrl: "/notes" });
            return;
        }

        setErrorMessage("Verification failed or incomplete.");
        setPendingAction(null);
        return;
      }

      const result = await client.signIn.create({
        identifier: identifier.trim(),
        password,
      });

      console.log('Login result status:', result.status, result);

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId, redirectUrl: "/notes" });
        return;
      }

      if (result.status === "needs_first_factor" || result.status === "needs_second_factor" || result.status === "needs_client_trust") {
          // send code
          if (result.status === "needs_client_trust" || result.status === "needs_second_factor") {
              const factor = result.supportedSecondFactors?.find(
                  (f) => f.strategy === 'email_code' || f.strategy === 'phone_code'
              );
              if (factor?.strategy === 'email_code') {
                  await result.prepareSecondFactor({ strategy: 'email_code' });
                  setNeedsVerification(true);
                  setPendingAction(null);
                  return;
              }
          } else if (result.status === "needs_first_factor") {
              const factor = result.supportedFirstFactors?.find(
                 (f) => f.strategy === 'email_code'
              );
              if (factor?.strategy === 'email_code') {
                  await result.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
                  setNeedsVerification(true);
                  setPendingAction(null);
                  return;
              }
          }
      }

      setErrorMessage("This sign-in needs an additional verification step that is not implemented in this form yet.");
      setPendingAction(null);
    } catch (error) {
      const friendlyError = getFriendlyClerkError(error);
      setFieldErrors({
        identifier: friendlyError.fieldErrors.identifier,
        password: friendlyError.fieldErrors.password,
        code: friendlyError.fieldErrors.code,
      });
      setErrorMessage(friendlyError.message);
      setPendingAction(null);
    }
  }

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
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in with OAuth or your Synapse credentials.</p>
      </header>

      <div className="mt-6 flex flex-1 flex-col">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            disabled={isBusy}
            onClick={() => handleOAuthSignIn("github")}
          >
            {pendingAction === "github" ? <Loader2 className="size-4 animate-spin" /> : <GitHubIcon className="size-4" />}
            GitHub
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            disabled={isBusy}
            onClick={() => handleOAuthSignIn("google")}
          >
            {pendingAction === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon className="size-4" />}
            Google
          </Button>
        </div>

        <div className="my-6">
          <AuthDivider />
        </div>

        <form className="flex flex-1 flex-col" noValidate onSubmit={handleCredentialSignIn}>
          {needsVerification ? (
             <div className="space-y-4">
               <AuthField
                 autoComplete="one-time-code"
                 disabled={isBusy}
                 error={fieldErrors.code}
                 label="Verification Code"
                 placeholder="Enter the code sent to your email"
                 required
                 value={verificationCode}
                 onChange={(event) => {
                   setVerificationCode(event.target.value);
                   setFieldErrors((current) => ({ ...current, code: undefined }));
                   setErrorMessage(null);
                 }}
               />
               <Button
                 type="button"
                 variant="link"
                 className="p-0 h-auto"
                 onClick={() => {
                   setNeedsVerification(false);
                   setVerificationCode("");
                   setErrorMessage(null);
                   setFieldErrors({});
                 }}
               >
                 Back to login
               </Button>
             </div>
          ) : (
            <div className="space-y-4">
              <AuthField
                autoComplete="username"
                disabled={isBusy}
                error={fieldErrors.identifier}
                label="Email address or username"
                placeholder="Enter your email address or username"
                required
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setFieldErrors((current) => ({ ...current, identifier: undefined }));
                  setErrorMessage(null);
                }}
              />

              <PasswordField
                autoComplete="current-password"
                disabled={isBusy}
                error={fieldErrors.password}
                label="Password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                  setErrorMessage(null);
                }}
              />
            </div>
          )}

          <Button
            type="submit"
            className="mt-6 h-11 w-full rounded-xl bg-[linear-gradient(90deg,#6d5efc_0%,#7c3aed_100%)] text-white hover:opacity-95"
            disabled={!canSubmitCredentials}
          >
            {pendingAction === "credentials" || pendingAction === "verification" ? <Loader2 className="size-4 animate-spin" /> : null}
            Continue
          </Button>
        </form>
      </div>

      <div className="mt-4 min-h-5 text-center" aria-live="polite">
        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {!errorMessage && !isLoaded ? <p className="text-sm text-muted-foreground">Preparing secure sign-in…</p> : null}
      </div>

      <footer className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link className="font-medium text-primary transition-colors hover:text-primary/80" href="/signup">
          Sign up
        </Link>
      </footer>
    </section>
  );
}
