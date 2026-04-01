# Synapse — Software Requirements Specification (SRS)

> **Document type:** IEEE 830-style Software Requirements Specification  
> **Project:** Synapse — Production-ready, Notion-inspired knowledge management & blogging platform  
> **Version:** 1.0  
> **Date:** 2026-03-05  
> **Status:** Draft

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [External Interface Requirements](#5-external-interface-requirements)
6. [System Constraints](#6-system-constraints)
7. [Assumptions & Dependencies](#7-assumptions--dependencies)
8. [Appendix — Glossary](#8-appendix--glossary)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for **Synapse**, a multi-user, cloud-hosted personal knowledge management (PKM) and blogging platform. It is intended to serve as a binding contract between the development team and stakeholders, defining what the system must do without prescribing how it does it.

### 1.2 Scope

Synapse is a web application that enables registered users to:

- Create, organise, and manage notes and blog posts using a rich Markdown-based block editor.
- Link notes bidirectionally using `[[wiki-link]]` syntax and visualise connections in an interactive graph.
- Publish notes publicly with pretty, readable URLs and SEO metadata.
- Leverage a Gemini AI writing assistant for summarisation, editing, and Q&A.

The system is deployed on Google Cloud (Cloud Run + GCS) with MongoDB Atlas as the data store.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term           | Definition                                                                |
| -------------- | ------------------------------------------------------------------------- |
| **Note**       | A Markdown document created by an authenticated user                      |
| **Blog**       | A note with `type: blog` and a public slug, rendered in blog format       |
| **Folder**     | A logical container for notes and sub-folders                             |
| **Slug**       | A URL-safe string identifier for a note or folder                         |
| **Wiki-link**  | `[[note-slug]]` inline syntax creating a bidirectional link between notes |
| **Backlink**   | An inbound reference from another note via wiki-link                      |
| **Graph View** | An interactive D3.js force-directed visualisation of linked notes         |
| **Copilot**    | The Gemini AI writing assistant panel                                     |
| **PKM**        | Personal Knowledge Management                                             |
| **SRS**        | Software Requirements Specification (this document)                       |
| **SSR**        | Server-Side Rendering                                                     |
| **ISR**        | Incremental Static Regeneration                                           |
| **RSC**        | React Server Component                                                    |
| **GCS**        | Google Cloud Storage                                                      |

### 1.4 Overview

Section 2 provides a product perspective, user classes, and operating environment.  
Section 3 enumerates functional requirements grouped by feature area.  
Section 4 specifies non-functional requirements (performance, security, etc.).  
Section 5 describes external interfaces.  
Section 6 lists system constraints.

---

## 2. Overall Description

### 2.1 Product Perspective

Synapse is a standalone web platform. Its primary user interface runs in a web browser (Next.js App Router). A Node.js backend (co-located in the Next.js application, deployed on Cloud Run) serves REST API routes. Media assets are stored in a GCS bucket. AI features communicate with the Google Gemini API.

```
[Browser Client] ←→ [Cloud Run: Next.js App] ←→ [MongoDB Atlas]
                                               ←→ [GCS Bucket]
                                               ←→ [Google Gemini API]
```

### 2.2 Product Functions — Summary

| #   | Function                                                |
| --- | ------------------------------------------------------- |
| F1  | Multi-user registration and authentication              |
| F2  | Note and folder CRUD                                    |
| F3  | Rich Markdown editor (KaTeX, Mermaid, syntax highlight) |
| F4  | `[[wiki-link]]` bidirectional linking                   |
| F5  | Graph view of linked notes                              |
| F6  | Public note/blog publishing with pretty URLs            |
| F7  | AI Copilot (Gemini-powered) chat panel                  |
| F8  | Image upload to GCS                                     |
| F9  | Admin dashboard                                         |
| F10 | Note export (Markdown / PDF)                            |

### 2.3 User Classes and Characteristics

#### 2.3.1 Owner / Admin

- Has full system access.
- Can view all users, ban or promote them via `/admin`.
- Technically proficient; uses advanced features (graph view, AI copilot, exports).

#### 2.3.2 Registered User

- Signs up with email and password (or OAuth).
- Has a personal workspace scoped by their `userId`.
- Can create, organise, and publish notes and blogs.
- Has access to the AI Copilot.

#### 2.3.3 Public Visitor

- Not authenticated.
- Can read notes and blogs that the author has set to `visibility: public`.
- Accesses content via pretty URLs (e.g., `Synapse.app/rakin/compiler/example`).
- Cannot create, edit, or interact with notes.

### 2.4 Operating Environment

| Component           | Environment                                 |
| ------------------- | ------------------------------------------- |
| **Browser support** | Latest Chrome, Firefox, Edge, Safari        |
| **Server runtime**  | Node.js 20 LTS (Cloud Run container)        |
| **Database**        | MongoDB Atlas (cloud-managed, M10+ cluster) |
| **Object storage**  | Google Cloud Storage bucket                 |
| **AI provider**     | Google Gemini API (`gemini-2.0-flash`)      |
| **Framework**       | Next.js 14 (App Router, TypeScript)         |

### 2.5 Design and Implementation Constraints

- **Next.js 14 App Router** must be used for both SSR/ISR public pages and protected app routes.
- **MongoDB Atlas** is the mandated database; a relational database is not in scope.
- **Tailwind CSS** is required as a peer dependency of shadcn/ui.
- All user data must be stored within the user's own `userId`-scoped documents; no cross-user data access is permitted through the API.

### 2.6 Assumptions and Dependencies

- Google Cloud Platform project is provisioned with GCS, Cloud Run, Artifact Registry, and Secret Manager.
- MongoDB Atlas cluster is available before deployment.
- Google Gemini API key is available and has sufficient quota.
- Email delivery is handled via Resend or Nodemailer with an SMTP provider.

---

## 3. Functional Requirements

Requirements are written in the form:  
**FR-[AREA]-[NUMBER]:** _The system shall…_

Priority is rated **P1** (must-have for MVP), **P2** (important, near-term), or **P3** (future / nice-to-have).

---

### 3.1 Authentication & User Management

**FR-AUTH-01 (P1):** The system shall allow a visitor to register a new account by providing a unique email address, a unique username, and a password.

**FR-AUTH-02 (P1):** The system shall hash passwords using bcrypt before persisting them to the database. Plain-text passwords must never be stored.

**FR-AUTH-03 (P1):** The system shall authenticate registered users using an email + password credential flow via next-auth v5.

**FR-AUTH-04 (P2):** The system shall support optional OAuth sign-in via GitHub and Google in addition to credentials.

**FR-AUTH-05 (P1):** The system shall issue a JWT session upon successful login, valid for a configurable duration (default: 30 days).

**FR-AUTH-06 (P2):** The system shall send a verification email upon registration. Users with an unverified email shall not be able to authenticate.

**FR-AUTH-07 (P1):** The system shall protect all routes under `/app/*` from unauthenticated access, redirecting unauthenticated requests to `/login`.

**FR-AUTH-08 (P1):** The system shall enforce unique usernames. Attempted registration with a reserved or already-taken username must be rejected with a descriptive error.

**FR-AUTH-09 (P1):** The system shall maintain a blocklist of reserved usernames: `app`, `api`, `admin`, `blog`, `login`, `register`, `feed`, `settings`, `u`, `about`.

**FR-AUTH-10 (P1):** The system shall validate usernames against the pattern `/^[a-z0-9-]+$/` where the value is 3–32 characters and does not start or end with a hyphen.

**FR-AUTH-11 (P2):** The system shall support a password reset flow via email.

**FR-AUTH-12 (P2):** An admin user shall be able to view, ban, and promote user accounts via the `/admin` dashboard.

---

### 3.2 Note and Folder Management

**FR-NOTE-01 (P1):** The system shall allow an authenticated user to create a new note within a folder or at the root level, specifying at minimum a title.

**FR-NOTE-02 (P1):** The system shall allow a user to update the content, title, and tags of their own notes.

**FR-NOTE-03 (P1):** The system shall allow a user to delete their own notes.

**FR-NOTE-04 (P1):** The system shall reject any attempt by a user to read, update, or delete a note not owned by that user (IDOR prevention), returning HTTP 403 or 404.

**FR-NOTE-05 (P1):** Every note shall be stored with `userId`, `folderId | null`, `title`, `slug`, `pathSegments`, `content` (TipTap JSON), `contentText` (plain-text), `type`, `visibility`, `tags`, and `outboundLinks`.

**FR-NOTE-06 (P1):** The system shall auto-save note content with a debounce of no more than 2 seconds of inactivity.

**FR-NOTE-07 (P1):** The system shall allow a user to create folders, rename folders, delete folders (cascading delete of child notes and sub-folders), and move folders within the tree.

**FR-NOTE-08 (P1):** The system shall display all notes and folders for the authenticated user in a collapsible tree-view sidebar, mirroring the folder hierarchy stored in the database.

**FR-NOTE-09 (P2):** The system shall allow a user to reorder notes and folders within a parent via drag-and-drop. The updated order shall be persisted.

**FR-NOTE-10 (P1):** The sidebar shall provide a fuzzy search input that filters visible notes and folders by title or content.

**FR-NOTE-11 (P1):** Each note item in the sidebar shall display the note title. Clicking it shall navigate the editor to that note.

**FR-NOTE-12 (P2):** The system shall allow a user to filter the sidebar by one or more tags.

---

### 3.3 Rich Markdown Editor

**FR-EDIT-01 (P1):** The editor shall be built on TipTap (ProseMirror) and support block-based Markdown input including headings (H1–H6), paragraphs, ordered and unordered lists, blockquotes, horizontal rules, and code blocks.

**FR-EDIT-02 (P1):** The editor shall render inline KaTeX math expressions wrapped in single `$…$` and block math wrapped in `$$…$$` in real time.

**FR-EDIT-03 (P1):** The editor shall render Mermaid diagram source in fenced code blocks tagged ` ```mermaid ` as live SVG diagrams within the editor.

**FR-EDIT-04 (P1):** The editor shall apply syntax highlighting to fenced code blocks with a language tag (e.g., ` ```python `) using Shiki or Prism.

**FR-EDIT-05 (P1):** The editor shall support inline images embedded from a URL or uploaded directly. Uploaded images shall be sent to GCS and replaced with the returned CDN URL.

**FR-EDIT-06 (P2):** The editor shall provide a formatting toolbar with common actions: bold, italic, strikethrough, inline code, link, heading level selector, quote, and list type toggles.

**FR-EDIT-07 (P1):** The editor shall support frontmatter metadata fields rendered as structured form inputs above the document body: `title`, `tags`, `slug`, `publishedAt`.

**FR-EDIT-08 (P1):** The editor shall display the note's last-saved timestamp in the top bar, updating in real time as auto-saves occur.

---

### 3.4 Wiki-Links and Backlinks

**FR-LINK-01 (P1):** The editor shall recognise `[[note-slug]]` syntax as a wiki-link and render it as a highlighted, clickable inline element.

**FR-LINK-02 (P1):** Clicking a wiki-link in the editor shall navigate to the referenced note (if it exists and is owned by the same user).

**FR-LINK-03 (P1):** On every save, the system shall extract all `[[slug]]` tokens from the note content and persist the resulting array as `outboundLinks` on the note document.

**FR-LINK-04 (P1):** The system shall expose an API endpoint `GET /api/notes/[id]/backlinks` that returns all notes containing the given note's slug in their `outboundLinks` array.

**FR-LINK-05 (P1):** The editor's right panel shall display a **Backlinks** section listing all notes that link to the current note.

---

### 3.5 Graph View

**FR-GRAPH-01 (P1):** The system shall render an interactive, force-directed graph using D3.js in the right panel of the editor.

**FR-GRAPH-02 (P1):** Graph nodes shall represent notes; directed edges shall represent wiki-link relationships (outbound from source to target).

**FR-GRAPH-03 (P1):** Clicking a graph node shall navigate the editor to the corresponding note.

**FR-GRAPH-04 (P1):** Hovering a graph node shall display a tooltip with the note's title.

**FR-GRAPH-05 (P1):** The editor's graph panel shall scope the graph to notes within **2 hops** of the currently open note to avoid visual overload.

**FR-GRAPH-06 (P2):** The system shall provide a dedicated `/graph` page displaying the full graph for all of the authenticated user's notes.

**FR-GRAPH-07 (P2):** The currently active note node shall be visually distinguished (e.g., distinct colour or size) in the graph.

---

### 3.6 Publishing and Blogging

**FR-PUB-01 (P1):** Each note shall carry a `visibility` field with values `private` (default) or `public`.

**FR-PUB-02 (P1):** A user shall be able to toggle a note between `private` and `public` from a Share modal in the editor top bar.

**FR-PUB-03 (P1):** When `visibility` is set to `public`, the system shall make the note accessible at the route `/{username}/{...pathSegments}` via SSR without authentication.

**FR-PUB-04 (P1):** When `visibility` is `private`, the route `/{username}/{...pathSegments}` shall return HTTP 404, identical to the response for a non-existent note, to prevent private-note enumeration.

**FR-PUB-05 (P1):** A note with `type: blog` shall also appear on the global `/blog` listing page sorted by `publishedAt` descending.

**FR-PUB-06 (P2):** Public note/blog pages shall include `<meta>` Open Graph tags: `og:title`, `og:description`, `og:url`, `og:image` (first embedded image or user avatar fallback).

**FR-PUB-07 (P2):** Public note/blog pages shall include Twitter Card meta tags.

**FR-PUB-08 (P2):** The system shall expose an RSS feed at `/feed.xml` listing all public blog posts across all users, sorted by `publishedAt`.

**FR-PUB-09 (P1):** When a note is made public, the Share modal must display the full pretty URL and a copy-to-clipboard button.

**FR-PUB-10 (P1):** A public user profile page at `/{username}` shall list all public notes and blogs created by that user.

---

### 3.7 AI Copilot

**FR-AI-01 (P1):** The system shall provide a floating AI Copilot button (chat-bubble icon) in the top-right corner of the editor layout.

**FR-AI-02 (P1):** Clicking the Copilot button shall toggle a slide-over panel containing a chat conversation UI.

**FR-AI-03 (P1):** The Copilot shall use the Google Gemini API (`gemini-2.0-flash`) as the underlying language model.

**FR-AI-04 (P1):** Communication between the client and the Gemini API shall be streamed via Server-Sent Events through the route `POST /api/ai/chat`, using the Vercel AI SDK.

**FR-AI-05 (P1):** On each new chat session, the current note's `contentText` shall be injected into the Gemini system prompt as context.

**FR-AI-06 (P1):** The Copilot shall support the following capabilities exposed via natural-language chat: summarise, expand, fix grammar, explain selection, and Q&A over the note.

**FR-AI-07 (P1):** The user shall be able to abort an in-progress AI response.

**FR-AI-08 (P2):** The Copilot panel shall render AI responses with Markdown formatting (bold, code blocks, lists).

**FR-AI-09 (P2):** The system shall provide a settings toggle to switch the Copilot model between `gemini-2.0-flash` and `gemini-2.5-pro`.

---

### 3.8 Image Uploads

**FR-UPLOAD-01 (P1):** The system shall allow an authenticated user to upload an image (JPEG, PNG, GIF, WebP) from within the editor.

**FR-UPLOAD-02 (P1):** The upload flow shall: (a) call `POST /api/upload` to obtain a GCS presigned URL, (b) PUT the file directly to GCS from the client, and (c) insert the returned GCS CDN URL into the editor content.

**FR-UPLOAD-03 (P1):** Uploaded files shall be stored in GCS under the path `uploads/{userId}/{uuid}.{ext}` to prevent path collisions.

**FR-UPLOAD-04 (P2):** The system shall enforce a maximum file size of 10 MB per upload. Uploads exceeding this limit shall be rejected with a descriptive error message.

**FR-UPLOAD-05 (P2):** The system shall restrict upload MIME types to images only (`image/*`). Non-image uploads shall be rejected.

---

### 3.9 Note Export

**FR-EXPORT-01 (P2):** The system shall allow a user to export a note as a raw Markdown (`.md`) file, downloading it to their device.

**FR-EXPORT-02 (P2):** The system shall allow a user to export a note as a rendered PDF, generated server-side.

---

### 3.10 Table of Contents

**FR-TOC-01 (P1):** The editor's right panel shall display an auto-generated Table of Contents derived from the current note's heading nodes (H1–H6).

**FR-TOC-02 (P1):** Clicking a TOC entry shall smoothly scroll the editor to the corresponding heading.

**FR-TOC-03 (P1):** The TOC shall update in real time as headings are added, removed, or renamed in the editor.

---

### 3.11 Settings

**FR-SET-01 (P1):** The system shall provide a `/app/settings` page for authenticated users.

**FR-SET-02 (P1):** The settings page shall allow a user to switch between `light`, `dark`, and `system` theme modes.

**FR-SET-03 (P2):** The settings page shall allow a user to update their display name, bio, and avatar image.

**FR-SET-04 (P2):** The settings page shall allow a user to change their password (requires current password confirmation).

---

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-PERF-01:** Public SSR pages (`/{username}/…`) shall achieve a Largest Contentful Paint (LCP) of ≤ 2.5 seconds on a simulated 4G connection (Lighthouse mobile audit).

**NFR-PERF-02:** Note list API (`GET /api/notes`) shall respond within 200 ms at the 95th percentile under normal load (< 100 concurrent users).

**NFR-PERF-03:** Auto-save (`PATCH /api/notes/[id]`) shall complete within 500 ms at the 95th percentile.

**NFR-PERF-04:** The AI streaming endpoint shall deliver the first token to the client within 2 seconds of the request.

**NFR-PERF-05:** The D3.js graph shall render and become interactive within 1 second for a graph of up to 500 nodes.

### 4.2 Scalability

**NFR-SCALE-01:** The Cloud Run service shall be configured with a minimum of 1 instance and auto-scale up to 10 instances on increased load.

**NFR-SCALE-02:** The system architecture shall support horizontal scaling (stateless Next.js server; all session and file state external to the process).

**NFR-SCALE-03:** MongoDB indexes (`{ userId, pathSegments }` compound unique; `userId` on Notes and Folders) shall remain effective up to 1 million document per collection.

### 4.3 Availability

**NFR-AVAIL-01:** The platform shall target 99.5% monthly uptime (excluding planned maintenance windows).

**NFR-AVAIL-02:** MongoDB Atlas shall be configured with a replica set for automatic failover.

### 4.4 Security

**NFR-SEC-01:** All API routes under `/api/*` (except next-auth handlers and the public share resolver) shall require a valid JWT session. Unauthenticated requests shall receive HTTP 401.

**NFR-SEC-02:** Every `/api/notes/[id]` and `/api/folders/[id]` handler shall verify `document.userId === session.user.id` before performing any operation. Violations shall return HTTP 403.

**NFR-SEC-03:** The private/non-existent note indistinguishability property (both return identical HTTP 404) shall be enforced on all public-facing route resolvers.

**NFR-SEC-04:** All Markdown/HTML rendered on public pages shall be sanitised using `rehype-sanitize` before being inserted into the DOM.

**NFR-SEC-05:** User passwords shall be hashed with bcrypt using a minimum cost factor of 12.

**NFR-SEC-06:** Environment variables and secrets (MongoDB URI, Gemini API key, GCS credentials) shall be managed via Google Cloud Secret Manager and injected at runtime. They must not be committed to source control.

**NFR-SEC-07:** The application shall enforce HTTPS for all connections. HTTP requests shall be redirected to HTTPS.

**NFR-SEC-08:** Rate limiting shall be applied to authentication endpoints (`/api/auth/…`) with a maximum of 10 attempts per IP per minute.

**NFR-SEC-09:** Public-facing routes (`/{username}/…`) shall be rate limited to a maximum of 300 requests per IP per minute using middleware.

**NFR-SEC-10:** GCS upload objects shall be namespaced per `userId` (`uploads/{userId}/…`) to prevent cross-user path collisions.

### 4.5 Usability

**NFR-UX-01:** The application shall be fully usable on screen widths ≥ 768 px (tablet landscape and desktop).

**NFR-UX-02:** The colour-contrast ratios of all text and interactive elements shall comply with WCAG 2.1 Level AA (minimum contrast ratio 4.5:1 for normal text).

**NFR-UX-03:** Key interactive elements (editor save status, AI streaming indicator, upload progress) shall provide visible real-time feedback to the user.

**NFR-UX-04:** The autocomplete dropdown for `[[wiki-link]]` completion shall appear within 300 ms of typing `[[`.

### 4.6 Maintainability

**NFR-MAINT-01:** All server-side code shall be written in TypeScript with strict mode enabled (`"strict": true` in `tsconfig.json`).

**NFR-MAINT-02:** Shared data types (Note, Folder, User interfaces) shall be defined once in `types/index.ts` and imported throughout the codebase.

**NFR-MAINT-03:** Database models shall be defined using Mongoose schemas with explicit field types and validation rules.

**NFR-MAINT-04:** Environment-specific configuration shall be centralised in `.env.local` (development) and Cloud Secret Manager (production); config objects shall not be hardcoded in component files.

### 4.7 Reliability

**NFR-REL-01:** Auto-save shall implement exponential-backoff retry logic (max 3 retries) for network failures. After all retries fail, the user shall be notified of a save failure.

**NFR-REL-02:** The editor shall preserve unsaved content locally (localStorage) as a backup in case of unexpected page reload, offering to restore it on the next session.

---

## 5. External Interface Requirements

### 5.1 User Interfaces

- **Editor Layout:** Three-panel layout — left sidebar (tree), centre (TipTap editor), right panel (TOC + graph).
- **AI Copilot Panel:** Slide-over overlay from the right edge; does not obscure the editor layout.
- **Public Pages:** Clean reading layout with note title, rendered Markdown, KaTeX, and Mermaid; no editor chrome.
- **Theme:** Light and dark modes derived from a CSS custom-property design token system.

### 5.2 Hardware Interfaces

Not applicable. The application is a web-based SaaS product with no hardware-specific requirements.

### 5.3 Software Interfaces

| Interface            | Protocol / Format  | Direction             | Purpose                          |
| -------------------- | ------------------ | --------------------- | -------------------------------- |
| MongoDB Atlas        | TCP / Mongoose ODM | Server ↔ DB           | All CRUD operations              |
| Google Gemini API    | HTTPS / JSON + SSE | Server → Gemini       | AI text generation               |
| Google Cloud Storage | HTTPS / REST       | Server + Client → GCS | Image storage / presigned upload |
| Email provider       | SMTP / Resend API  | Server → Email        | Verification and password reset  |
| next-auth v5         | Internal Next.js   | Server ↔ Client       | Session management               |

### 5.4 Communication Interfaces

- **Client ↔ Server:** HTTPS REST (JSON) for CRUD; Server-Sent Events for AI streaming.
- **Server ↔ MongoDB:** TCP with TLS, MongoDB wire protocol via `mongoose`.
- **Server ↔ GCS:** HTTPS REST via `@google-cloud/storage` SDKor presigned URL redirect.
- **Server ↔ Gemini:** HTTPS with SSE streaming via `@ai-sdk/google`.

---

## 6. System Constraints

| ID     | Constraint                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------- |
| CON-01 | The application must be deployable as a Docker container on Google Cloud Run.                           |
| CON-02 | The data store is MongoDB Atlas; no relational databases shall be used.                                 |
| CON-03 | The editor must be TipTap (ProseMirror-based). Competing editors (e.g., Quill, Slate) are out of scope. |
| CON-04 | The AI provider is Google Gemini. Third-party providers (OpenAI, Anthropic) are out of scope for v1.    |
| CON-05 | Next.js 14 App Router must be used. Pages Router is disallowed.                                         |
| CON-06 | All new code must be TypeScript with strict mode. Plain JavaScript is not acceptable.                   |
| CON-07 | shadcn/ui + Tailwind CSS are required as the UI component and styling system.                           |
| CON-08 | Secrets must not be committed to git history; `.env.local` must be `.gitignored`.                       |

---

## 7. Assumptions & Dependencies

### 7.1 Assumptions

- Users have a modern browser with JavaScript enabled; no IE 11 support is required.
- The Google Cloud project is owned/controlled by the development team during deployment.
- The Gemini API provides sufficient rate limit quota for the expected user base in early releases.
- MongoDB Atlas will provide connection strings and manages backups externally.

### 7.2 Dependencies

| Dependency            | Version (approx.) | Purpose                           |
| --------------------- | ----------------- | --------------------------------- |
| Next.js               | 14.x              | Full-stack web framework          |
| TypeScript            | 5.x               | Type safety                       |
| TipTap / ProseMirror  | 2.x               | Rich block editor                 |
| shadcn/ui             | latest            | Accessible UI component library   |
| Tailwind CSS          | 3.x               | Utility-first CSS                 |
| Zustand               | 4.x               | Global state management           |
| Mongoose              | 8.x               | MongoDB ODM                       |
| next-auth             | 5.x               | Authentication                    |
| Vercel AI SDK         | latest            | AI streaming abstraction          |
| @ai-sdk/google        | latest            | Gemini provider for Vercel AI SDK |
| assistant-ui          | latest            | Pre-built AI chat UI components   |
| D3.js                 | 7.x               | Force-directed graph rendering    |
| KaTeX                 | 0.x               | LaTeX math rendering              |
| Mermaid.js            | 10.x              | Diagram rendering                 |
| @google-cloud/storage | latest            | GCS SDK for Node.js               |
| bcrypt                | 5.x               | Password hashing                  |

---

## 8. Appendix — Glossary

| Term              | Definition                                                                          |
| ----------------- | ----------------------------------------------------------------------------------- |
| **App Router**    | Next.js 14 routing system using the `app/` directory with React Server Components   |
| **Debounce**      | Delay mechanism that prevents a function from executing until a pause in events     |
| **IDOR**          | Insecure Direct Object Reference — accessing resources owned by another user        |
| **ISR**           | Incremental Static Regeneration — SSR page re-rendered on a time or on-demand basis |
| **Presigned URL** | Time-limited URL generated by GCS allowing direct client-to-storage upload          |
| **TipTap**        | Open-source, headless rich text editor built on ProseMirror                         |
| **Slug**          | Human-readable, URL-safe string derived from a title (e.g., `my-first-post`)        |
| **Wiki-link**     | `[[slug]]` notation creating hyperlinks between notes, popularised by Obsidian      |
