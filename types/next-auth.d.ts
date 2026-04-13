import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      username?: string;
      role?: "user" | "admin";
    };
  }

  interface User {
    id: string;
    username: string;
    role: "user" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    role?: "user" | "admin";
  }
}
