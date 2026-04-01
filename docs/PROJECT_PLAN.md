# Synapse — Project Plan

> A production-ready, Notion-inspired note-taking and blogging platform with Obsidian-style graph views, Markdown/KaTeX/Mermaid support, and a Gemini-powered AI writing assistant. Deployed on Google Cloud Storage (GCS) with a Node.js backend.

---

## 1. Vision & Goals

| Goal                 | Details                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| **Primary**          | A personal knowledge management and blogging platform that lives in the cloud |
| **Writing UX**       | Notion-like block editor with rich Markdown, KaTeX math, and Mermaid diagrams |
| **Navigation**       | Tree-based file-system sidebar (like VS Code / Obsidian) for notes and blogs  |
| **Discovery**        | Interactive graph view of bidirectionally-linked notes (Obsidian-style)       |
| **AI Copilot**       | Gemini-powered assistant for summarization, completion, and Q&A               |
| **Public Sharing**   | Any note/blog can be published with a public URL, SEO-ready                   |
| **Self-hosted feel** | Deployed on GCS + Cloud Run; user owns their data in MongoDB Atlas            |

---

## 2. User Roles

| Role                | Capabilities                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| **Owner / Admin**   | Full CRUD on own notes, publish/unpublish, AI assistant, can see all users (future moderation) |
| **Registered User** | Sign up, create & manage own notes/blogs, AI assistant, publish publicly                       |
| **Public Visitor**  | Read published notes/blogs — no account required                                               |

> This is a **multi-user platform** from day one. Every user owns their notes. Public profiles live at `/u/[username]`.

---

## 3. Feature Scope

### 3.1 Core Editor

- [x] Block-based Markdown editor (prose-mirror / TipTap)
- [x] `[[wiki-link]]` bidirectional note linking
- [x] KaTeX math rendering (`$inline$` and `$$block$$`)
- [x] Mermaid diagram rendering (fenced code blocks)
- [x] Code blocks with syntax highlighting (Shiki / Prism)
- [x] Inline images, embeds
- [x] Frontmatter metadata (title, tags, slug, publishedAt)

### 3.2 Navigation — Left Sidebar

- [x] Tree-view of all notes & blogs mirroring folder structure in DB
- [x] Create / rename / delete / move notes and folders
- [x] Drag-and-drop reorder
- [x] Search (fuzzy) across all notes
- [x] Tag / label filtering

### 3.3 Right Panel

- [x] **Table of Contents** — auto-generated from heading hierarchy
- [x] **Graph View** — D3.js force-directed graph of linked notes, visible in editor and on public pages

### 3.4 AI Assistant (Copilot)

- [x] Floating toggle button (top-right, chat bubble)
- [x] Slide-over panel with chat conversation
- [x] Gemini Flash/Pro API backend
- [x] Context-aware (current note content sent as system context)
- [x] Capabilities: summarize, expand, fix grammar, explain, Q&A

_See `AI_ASSISTANT.md` for library comparison._

### 3.5 Publishing & Blogging

- [x] Note → Blog toggle (sets `type: blog`)
- [x] Slug-based public URLs: `/blog/[slug]` and `/notes/[slug]`
- [x] SEO metadata (Open Graph, Twitter Card, canonical URLs)
- [x] RSS feed at `/feed.xml`

### 3.6 Auth

- [x] `next-auth` v5 with **Credentials** (email + password sign-up/login)
- [x] Optional **OAuth providers**: GitHub, Google (plug-in via next-auth)
- [x] Protected `/app/*` routes; public `/u/[username]`, `/blog/*`, `/notes/*`
- [x] Email verification on sign-up (Resend / Nodemailer)
- [x] Role field on User: `user` | `admin`
- [x] Admin dashboard at `/admin` (user list, ban, promote)

### 3.7 Settings

- [x] Theme toggle (light / dark / system)
- [x] Custom domain CNAME support (future)
- [x] Export note as Markdown / PDF

---

## 4. Tech Stack

| Layer             | Choice                                      | Reason                                                 |
| ----------------- | ------------------------------------------- | ------------------------------------------------------ |
| **Framework**     | Next.js 14 (App Router)                     | SSR for public pages, RSC, API routes                  |
| **Language**      | TypeScript                                  | Type safety across full stack                          |
| **UI Components** | shadcn/ui + Radix UI                        | Accessible, unstyled-first, composable                 |
| **Icons**         | lucide-react                                | Consistent icon set                                    |
| **State**         | Zustand                                     | Lightweight global state (sidebar, editor, AI panel)   |
| **Editor**        | TipTap (ProseMirror-based)                  | Extensible block editor with great Next.js integration |
| **Markdown**      | `@tiptap/extension-*` + `remark` / `rehype` | Parse & render; KaTeX and Mermaid extensions           |
| **Math**          | KaTeX (`remark-math` + `rehype-katex`)      | Fast, accurate LaTeX rendering                         |
| **Diagrams**      | Mermaid.js (client-side)                    | Rich diagram types                                     |
| **Graph View**    | D3.js (force-directed)                      | Obsidian-style note graph                              |
| **Database**      | MongoDB Atlas                               | Flexible document store; great for nested note trees   |
| **ODM**           | Mongoose                                    | Schema enforcement, virtuals, middleware               |
| **Auth**          | next-auth v5 (credentials)                  | Simple JWT session; no OAuth needed initially          |
| **AI**            | Vercel AI SDK + Gemini adapter              | Streaming, tool-use, easy Next.js integration          |
| **AI UI**         | `assistant-ui`                              | Pre-built chat components; Vercel AI SDK compatible    |
| **Styling**       | Tailwind CSS v3 (shadcn requirement)        | shadcn/ui depends on Tailwind                          |
| **Deployment**    | GCS (static) + Cloud Run (API)              | Or Vercel as an alternative                            |
| **CDN/Storage**   | GCS bucket                                  | Uploaded images and attachments                        |

> **Note on Tailwind:** shadcn/ui requires Tailwind. This is the one unavoidable addition to your stated stack.

---

## 5. Release Phases

### Phase 1 — MVP (Weeks 1–3)

- Project bootstrap, MongoDB connection
- **Multi-user auth**: sign-up, login, JWT sessions (next-auth credentials)
- User schema with `userId` on all documents from day one
- Basic CRUD for notes scoped to logged-in user
- Simple Markdown editor with KaTeX + Mermaid
- Left sidebar tree view
- Table of Contents in right panel
- Public note/blog rendering (SSR) at `/u/[username]/[slug]`
- Public user profile page `/u/[username]`

### Phase 2 — Graph & Linking (Week 4)

- `[[wiki-link]]` parsing and backlink index
- D3 graph view in right panel
- Bidirectional link panel (what links here)

### Phase 3 — AI Copilot (Week 5)

- Gemini API integration
- Vercel AI SDK streaming route
- `assistant-ui` chat panel (slide-over)
- Context injection from current note

### Phase 4 — Polish & Deployment (Week 6)

- SEO, Open Graph, RSS
- Image uploads to GCS
- Cloud Run Dockerfile + CI/CD
- Performance audit

### Phase 5 — Future Enhancements

- Note sharing with per-note permissions (view / comment / edit link)
- Version history / snapshots
- Obsidian-vault import
- Custom domain per user
- Webhooks / Zapier integration
- Admin moderation dashboard
- User follower / following feed
