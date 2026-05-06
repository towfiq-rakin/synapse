import type { Metadata } from "next";
import AuthShell from "../_components/auth-shell";
import CustomLoginForm from "../_components/custom-login-form";

export const metadata: Metadata = {
  title: "Login | Synapse",
};

export default function LoginPage() {
  return (
    <AuthShell>
      <CustomLoginForm />
    </AuthShell>
  );
}
