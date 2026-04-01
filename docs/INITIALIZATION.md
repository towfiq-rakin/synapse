# Synapse — Initialization Guide

> This guide covers everything needed to go from zero to a running local dev server with auth + DB connected. **Do not start until you have reviewed and approved the project plan and architecture.**

---

## Prerequisites

| Tool           | Version               | Check                    |
| -------------- | --------------------- | ------------------------ |
| Node.js        | ≥ 20 LTS              | `node -v`                |
| npm            | ≥ 10                  | `npm -v`                 |
| Git            | any                   | `git --version`          |
| MongoDB Atlas  | account + cluster     | atlas.mongodb.com        |
| Gemini API key | from Google AI Studio | aistudio.google.com      |
| GCS Bucket     | (for image uploads)   | console.cloud.google.com |

---

## Step 1 — Bootstrap Next.js Project

```bash
# Run inside note-app/ directory
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

Answers to prompts (if interactive mode):

- Use TypeScript → **Yes**
- Use ESLint → **Yes**
- Use Tailwind → **Yes**
- Use `src/` directory → **No**
- Use App Router → **Yes**
- Customize import alias → **Yes** (`@/*`)

---

## Step 2 — Install Core Dependencies

```bash
# UI & Icons
npm install shadcn lucide-react

# shadcn/ui init (run after install)
npx shadcn@latest init

# State Management
npm install zustand

# Database
npm install mongoose

# Auth
npm install next-auth@beta

# Editor (TipTap)
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-link @tiptap/extension-placeholder \
  @tiptap/extension-code-block-lowlight lowlight

# KaTeX
npm install @tiptap/extension-mathematics katex
npm install --save-dev @types/katex

# Markdown parsing (for public rendering)
npm install remark remark-math remark-gfm \
  rehype-katex rehype-stringify rehype-highlight

# Graph View
npm install d3
npm install --save-dev @types/d3

# Mermaid
npm install mermaid

# AI
npm install ai @ai-sdk/google @assistant-ui/react

# Utilities
npm install clsx date-fns slugify bcryptjs
npm install --save-dev @types/bcryptjs
```

---

## Step 3 — Install shadcn/ui Components

```bash
npx shadcn@latest add button input textarea \
  dialog sheet tooltip \
  dropdown-menu context-menu \
  scroll-area separator \
  badge skeleton toast \
  command popover
```

---

## Step 4 — Design Theme with tweakcn

> **Do this before writing any components** — it sets your whole visual identity.

1. Go to **[tweakcn.com](https://tweakcn.com)**
2. Pick a dark preset (aim for Notion/Obsidian feel — dark background, neutral grays, subtle accent)
3. Tune colors, border-radius, typography to your taste
4. Click **Export** → copy the generated CSS variables
5. Paste into `app/globals.css`, replacing the default shadcn/ui variables

**What to aim for:**

| Token            | Suggestion                                  |
| ---------------- | ------------------------------------------- |
| Background       | `#0f0f0f` or `#111111`                      |
| Surface / Card   | `#1a1a1a`                                   |
| Accent / Primary | Muted blue or violet                        |
| Border radius    | `6px` — subtle, not round                   |
| Font             | Inter or Geist (already default in Next.js) |

> tweakcn exports a ready-to-paste CSS block — no manual variable hunting needed.

---

## Step 5 — Environment Variables

Create `.env.local` in the project root:

```env
# ── MongoDB ──────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/Synapse?retryWrites=true&w=majority

# ── Auth ──────────────────────────────────────────────────
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Optional OAuth (add one or both)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Email (for verification emails) ───────────────────────────
EMAIL_FROM=noreply@Synapse.app
RESEND_API_KEY=<from resend.com>  # or use SMTP vars

# ── Gemini AI ──────────────────────────────────────────────────
GOOGLE_GENERATIVE_AI_API_KEY=<from aistudio.google.com>

# ── Google Cloud Storage ───────────────────────────────────────
GCS_BUCKET_NAME=Synapse-assets
GCS_PROJECT_ID=your-gcp-project
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

> 🔐 Add `.env.local` to `.gitignore` — it is by default with `create-next-app`.

**Generate bcrypt hash for your password:**

```bash
node -e "const b=require('bcryptjs');b.hash('yourpassword',12).then(console.log)"
```

---

## Step 5 — MongoDB Connection Singleton

Create `lib/db/mongoose.ts`:

```typescript
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

declare global {
  var mongoose: {
    conn: typeof import("mongoose") | null;
    promise: Promise<typeof import("mongoose")> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

## Step 6 — next-auth Configuration

Create `lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db/mongoose";
import User from "./db/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );
        if (!valid) return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          username: user.username,
        };
      },
    }),
    GitHub, // requires GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET
    Google, // requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.username = (user as any).username;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as any).username = token.username;
      return session;
    },
  },
});
```

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

Add to `middleware.ts` (project root):

```typescript
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAppRoute = req.nextUrl.pathname.startsWith("/app");
  if (isAppRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/app/:path*"],
};
```

---

## Step 7 — Create Initial Mongoose Models

```bash
mkdir -p lib/db/models
```

`lib/db/models/Note.ts` — see Architecture doc for the full interface.  
`lib/db/models/Folder.ts`  
`lib/db/models/User.ts`

_(Actual model code will be written during execution phase.)_

---

## Step 8 — Verify Dev Server

```bash
npm run dev
```

Open `http://localhost:3000` — you should see the default Next.js page with no errors.

Then verify:

- [ ] TypeScript compiles with no errors (`npm run build`)
- [ ] MongoDB connects (add a test route `/api/health` that calls `connectToDatabase()`)
- [ ] Auth works: visit `/login`, sign in, protected `/app` route accessible

---

## Step 9 — Create Folder Scaffolding

```bash
mkdir -p \
  app/\(auth\)/login \
  app/\(app\)/notes/\[id\] \
  app/\(public\)/blog/\[slug\] \
  app/\(public\)/notes/\[slug\] \
  app/api/notes/\[id\] \
  app/api/ai/chat \
  app/api/upload \
  components/layout \
  components/editor/extensions \
  components/editor/toolbar \
  components/graph \
  components/toc \
  lib/db/models \
  lib/ai \
  store \
  hooks \
  types
```

---

## Step 10 — Git Setup

```bash
git init
git add .
git commit -m "chore: initial project setup"
```

Create a GitHub repo and push:

```bash
git remote add origin https://github.com/<you>/Synapse.git
git push -u origin main
```

---

## What's Next (Phase 1 Execution)

After initialization is verified:

1. Build the Note Mongoose model + `/api/notes` CRUD routes
2. Build `Sidebar` tree component with Zustand store
3. Integrate TipTap editor with KaTeX + Mermaid
4. Build public rendering routes (`/blog/[slug]`, `/notes/[slug]`)
5. Add Table of Contents component
