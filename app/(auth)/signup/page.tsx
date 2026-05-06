import type { Metadata } from "next";
import AuthShell from "../_components/auth-shell";
import CustomSignupForm from "../_components/custom-signup-form";

export const metadata: Metadata = {
  title: "Sign Up | Synapse",
};

export default function SignupPage() {
  return (
    <AuthShell>
      <CustomSignupForm />
    </AuthShell>
  );
}
