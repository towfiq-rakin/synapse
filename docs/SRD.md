# Synapse — Software Requirements Document (SRD)

> **Document type:** Software Requirements Document — Stakeholder & Business Requirements  
> **Project:** Synapse — Production-ready, Notion-inspired knowledge management & blogging platform  
> **Version:** 1.0  
> **Date:** 2026-03-05  
> **Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context & Opportunity](#2-business-context--opportunity)
3. [Stakeholders](#3-stakeholders)
4. [Business Requirements](#4-business-requirements)
5. [User Requirements](#5-user-requirements)
6. [Traceability Matrix](#6-traceability-matrix)
7. [Acceptance Criteria](#7-acceptance-criteria)
8. [Release Strategy](#8-release-strategy)
9. [Risks and Mitigations](#9-risks-and-mitigations)
10. [Out of Scope](#10-out-of-scope)

---

## 1. Executive Summary

**Synapse** is a multi-user, cloud-hosted knowledge management and blogging platform targeting knowledge workers, students, developers, and technical writers. The platform combines a richly capable block editor (Markdown + KaTeX + Mermaid), Obsidian-style bidirectional linking and graph visualisation, public blogging with pretty URLs, and a Gemini AI writing copilot — all backed by a scalable cloud infrastructure (Google Cloud Run + MongoDB Atlas + GCS).

The goal of this document is to capture the **business** and **user-level** requirements that Synapse must satisfy. It serves as the upstream source of truth from which the [SRS](./SRS.md) derives its detailed functional requirements.

---

## 2. Business Context & Opportunity

### 2.1 Problem Statement

Existing tools fragment the knowledge management workflow:

| Tool       | Strength                         | Gap                                       |
| ---------- | -------------------------------- | ----------------------------------------- |
| Notion     | Rich editor, collaborative       | No graph view, no offline/self-hosted     |
| Obsidian   | Graph view, local-first, plugins | No built-in public sharing, no AI copilot |
| Roam       | Bidirectional links, daily notes | Steep learning curve, no blog publishing  |
| Ghost/Hugo | Polished blog publishing         | No interlinked note graph, no AI writing  |

No single tool combines all four attributes: **bidirectional linking + graph view + public blogging + AI assistance** in a cloud-native, multi-user platform.

### 2.2 Opportunity

There is a growing segment of users who:

1. Build a private **personal knowledge base** (PKM) with interlinked notes.
2. Want to **selectively publish** specific notes or blog posts (the "digital garden" model).
3. Want **AI assistance** inline without switching tools or pasting into a chatbot.
4. Prefer owning their data in a **cloud workspace** rather than locally (backup, multi-device sync).

**Synapse** directly addresses this gap.

### 2.3 Platform Vision

> _Synapse is a second brain in the cloud — where you write, connect ideas, and share with the world, with an AI copilot always at your side._

---

## 3. Stakeholders

| Stakeholder            | Role                       | Interests / Expectations                                  |
| ---------------------- | -------------------------- | --------------------------------------------------------- |
| **Project Owner**      | Product owner, lead dev    | Delivery of MVP on schedule; extensible codebase          |
| **Registered Users**   | Primary end users          | Fast, reliable editor; data privacy; intuitive publishing |
| **Public Visitors**    | Readers of published notes | Fast page loads; readable content; no broken links        |
| **Admin Users**        | Platform operators         | User management tools; ability to moderate content        |
| **Google Cloud (GCP)** | Infrastructure provider    | Correct usage of GCS, Cloud Run, Secret Manager           |
| **MongoDB Atlas**      | Database provider          | Stable connection, correct index design, appropriate tier |
| **Google Gemini API**  | AI provider                | Correct API usage within quota; no key leakage            |

---

## 4. Business Requirements

Business requirements (BR) define **what the business needs** Synapse to achieve, independent of implementation details. Each BR is assigned a priority: **Critical**, **High**, or **Medium**.

### 4.1 Core Platform

**BR-01 (Critical):** Synapse must be a production-ready, multi-user web platform accessible from any modern browser without requiring software installation.

**BR-02 (Critical):** The platform must allow each registered user to maintain a private workspace of notes and folders that is completely isolated from other users' workspaces.

**BR-03 (Critical):** The platform must provide a rich text editor with Markdown, inline math (KaTeX), and diagram (Mermaid) rendering, meeting the quality bar of leading PKM tools.

**BR-04 (Critical):** The platform must support publicly sharing individual notes or blogs via clean, human-readable URLs (e.g., `Synapse.app/rakin/compiler/example`), without requiring the visitor to have an account.

**BR-05 (High):** The platform must visualise connections between notes as an interactive graph view, inspired by Obsidian's graph feature, to support non-linear knowledge exploration.

**BR-06 (High):** The platform must embed an AI writing assistant that is context-aware (reads the current note) and capable of summarising, continuing, editing, and answering questions.

**BR-07 (High):** The platform must store uploaded images reliably on a cloud CDN (GCS) rather than embedding data URIs or relying on external image hosts.

**BR-08 (Medium):** The platform must expose an admin dashboard that allows designated admin users to view, manage, and moderate registered accounts.

### 4.2 Security and Data Ownership

**BR-09 (Critical):** The platform must ensure that a user's private notes cannot be accessed, inferred, or enumerated by any other user or unauthenticated visitor.

**BR-10 (Critical):** User passwords must never be stored in plain text. A secure hashing algorithm (bcrypt, cost ≥ 12) must be used.

**BR-11 (High):** All secrets (database credentials, API keys) must be stored outside the codebase using a managed secrets service (Google Cloud Secret Manager).

**BR-12 (High):** All data in transit must be encrypted (HTTPS/TLS). No plaintext HTTP endpoints shall be exposed.

### 4.3 Performance and Reliability

**BR-13 (Critical):** The editing experience must feel instantaneous — the editor must auto-save in the background with no perceived interruption to writing.

**BR-14 (High):** Public note and blog pages must load quickly enough to achieve Google Core Web Vitals "Good" ratings (LCP ≤ 2.5 s) to support discoverability and SEO.

**BR-15 (High):** The platform must remain available 99.5% of the time (monthly SLO), with automatic recovery from single-instance failures.

### 4.4 Extensibility

**BR-16 (Medium):** The codebase architecture must follow clean-separation principles (API routes, shared types, data models in dedicated modules) so that new features can be added without large-scale refactoring.

**BR-17 (Medium):** The platform must be deployable as a Docker container on any OCI-compatible container runtime, not tied to a single vendor's deployment product.

---

## 5. User Requirements

User requirements (UR) describe workflows from the **user's perspective**, written as user stories in the form: _"As a [role], I want [goal] so that [reason]."_

### 5.1 Authentication

| ID     | User Story                                                                                                            | Priority |
| ------ | --------------------------------------------------------------------------------------------------------------------- | -------- |
| UR-A01 | As a visitor, I want to create a new account with my email and a chosen username so that I can start using Synapse.  | Must     |
| UR-A02 | As a registered user, I want to log in with my email and password so that I can access my private workspace.          | Must     |
| UR-A03 | As a registered user, I want my session to persist across browser restarts so that I don't have to log in every day.  | Must     |
| UR-A04 | As a registered user, I want to log in via GitHub or Google OAuth so that I don't have to manage a separate password. | Should   |
| UR-A05 | As a registered user, I want to reset my password via email so that I can regain access if I forget it.               | Should   |
| UR-A06 | As a registered user, I want to log out from the settings page so that I can secure my account on shared devices.     | Must     |

### 5.2 Note Management

| ID     | User Story                                                                                                                   | Priority |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| UR-N01 | As a registered user, I want to create a new note by clicking a button in the sidebar so I can start writing immediately.    | Must     |
| UR-N02 | As a registered user, I want to organise my notes into nested folders so that I can maintain a structured knowledge base.    | Must     |
| UR-N03 | As a registered user, I want my notes to be auto-saved as I type so that I never lose work due to a browser crash.           | Must     |
| UR-N04 | As a registered user, I want to rename, move, and delete notes and folders so that I can keep my workspace tidy.             | Must     |
| UR-N05 | As a registered user, I want to search across all my notes by title or content so that I can quickly find information.       | Must     |
| UR-N06 | As a registered user, I want to tag notes and filter the sidebar by tag so that I can organise notes by topic.               | Should   |
| UR-N07 | As a registered user, I want to drag and drop notes and folders to reorder them so that I can customise my workspace layout. | Should   |
| UR-N08 | As a registered user, I want to export a note as a Markdown file so that I can back it up or use it in another tool.         | Should   |
| UR-N09 | As a registered user, I want to export a note as PDF so that I can share it in a universally readable format.                | Could    |

### 5.3 Editor

| ID     | User Story                                                                                                                                               | Priority |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| UR-E01 | As a registered user, I want to write in Markdown using a pleasant block editor so that formatting is easy and distraction-free.                         | Must     |
| UR-E02 | As a registered user, I want my LaTeX math notation (KaTeX) to render inline as I write so that I can author mathematical content.                       | Must     |
| UR-E03 | As a registered user, I want Mermaid diagram code blocks to render as live diagrams in the editor so that I don't need an external tool.                 | Must     |
| UR-E04 | As a registered user, I want a formatting toolbar with bold, italic, heading, and list controls so that I can format without memorising Markdown syntax. | Should   |
| UR-E05 | As a registered user, I want to insert an image by uploading from my device so that I can enrich my notes with visuals.                                  | Should   |
| UR-E06 | As a registered user, I want to see the last-saved time in the editor so that I know my changes are persisted.                                           | Must     |

### 5.4 Linking and Graph

| ID     | User Story                                                                                                                                                       | Priority |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| UR-L01 | As a registered user, I want to type `[[note-slug]]` to create a link to another note so that I can build a connected knowledge graph.                           | Must     |
| UR-L02 | As a registered user, I want to click a wiki-link in the editor to navigate directly to the linked note so that exploring connections is fast.                   | Must     |
| UR-L03 | As a registered user, I want to see a list of backlinks (notes that link to the current note) in the right panel so that I understand what references this idea. | Must     |
| UR-L04 | As a registered user, I want to see an interactive graph of linked notes in the right panel so that I can explore my knowledge graph visually.                   | Must     |
| UR-L05 | As a registered user, I want to click a graph node to open that note so that navigation within the graph is intuitive.                                           | Must     |
| UR-L06 | As a registered user, I want a full-page graph view of all my notes so that I can see the complete picture of my knowledge base.                                 | Should   |

### 5.5 Publishing and Blogging

| ID     | User Story                                                                                                                                           | Priority |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| UR-P01 | As a registered user, I want to publish a note with one click so that it becomes publicly accessible.                                                | Must     |
| UR-P02 | As a registered user, I want to share a published note via a clean URL (e.g., `Synapse.app/myname/topic/note`) so that the link looks professional. | Must     |
| UR-P03 | As a registered user, I want to copy the public URL of a note from the Share modal so that I can share it easily.                                    | Must     |
| UR-P04 | As a registered user, I want to unpublish a note and immediately make it private again so that I can control visibility at any time.                 | Must     |
| UR-P05 | As a registered user, I want to mark a note as a blog post so that it appears on the public blog listing page.                                       | Should   |
| UR-P06 | As a registered user, I want my public blog posts to include Open Graph metadata so that links shared on social media have a preview.                | Should   |
| UR-P07 | As a public visitor, I want to read a published note without needing an account so that shared content is freely accessible.                         | Must     |
| UR-P08 | As a public visitor, I want a published note's math and diagrams to render correctly so that the content is fully readable.                          | Must     |
| UR-P09 | As a public visitor, I want a user's profile page to list all their published notes so that I can discover more of their writing.                    | Should   |

### 5.6 AI Copilot

| ID      | User Story                                                                                                                      | Priority |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| UR-AI01 | As a registered user, I want to open an AI chat panel from the editor with one click so that help is always within reach.       | Must     |
| UR-AI02 | As a registered user, I want to ask the AI to summarise my note so that I can get a quick overview without re-reading.          | Must     |
| UR-AI03 | As a registered user, I want to ask the AI to expand a paragraph so that I can overcome writer's block.                         | Must     |
| UR-AI04 | As a registered user, I want to ask the AI to fix grammar in my note so that I can polish writing efficiently.                  | Must     |
| UR-AI05 | As a registered user, I want the AI to answer questions about my note's content so that I can explore ideas conversationally.   | Must     |
| UR-AI06 | As a registered user, I want to stop an ongoing AI response mid-stream so that I don't have to wait for a bad answer to finish. | Should   |
| UR-AI07 | As a registered user, I want the AI responses to render with Markdown formatting so that code blocks and lists are readable.    | Should   |

### 5.7 Settings and Profile

| ID     | User Story                                                                                                                           | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| UR-S01 | As a registered user, I want to switch between light, dark, and system theme modes so that Synapse is comfortable in any lighting.  | Must     |
| UR-S02 | As a registered user, I want to update my display name, bio, and avatar so that my public profile is personalised.                   | Should   |
| UR-S03 | As a registered user, I want to change my account password after confirming the current one so that I can maintain account security. | Should   |

### 5.8 Admin

| ID       | User Story                                                                                              | Priority |
| -------- | ------------------------------------------------------------------------------------------------------- | -------- |
| UR-ADM01 | As an admin, I want to view a list of all registered users so that I can monitor platform usage.        | Should   |
| UR-ADM02 | As an admin, I want to suspend a user account so that I can remove abusive or violating accounts.       | Should   |
| UR-ADM03 | As an admin, I want to promote a user to admin role so that I can delegate moderation responsibilities. | Could    |

---

## 6. Traceability Matrix

This matrix links **User Requirements** to the corresponding **Functional Requirements** in the [SRS](./SRS.md).

| UR ID    | Description (short)          | SRS Functional Req(s)                          |
| -------- | ---------------------------- | ---------------------------------------------- |
| UR-A01   | Register account             | FR-AUTH-01, FR-AUTH-08, FR-AUTH-09, FR-AUTH-10 |
| UR-A02   | Login with email/password    | FR-AUTH-03, FR-AUTH-05                         |
| UR-A03   | Session persistence          | FR-AUTH-05                                     |
| UR-A04   | OAuth login                  | FR-AUTH-04                                     |
| UR-A05   | Password reset               | FR-AUTH-11                                     |
| UR-A06   | Logout                       | FR-AUTH-07                                     |
| UR-N01   | Create note                  | FR-NOTE-01                                     |
| UR-N02   | Nested folders               | FR-NOTE-07, FR-NOTE-08                         |
| UR-N03   | Auto-save                    | FR-NOTE-06                                     |
| UR-N04   | Rename / move / delete       | FR-NOTE-02, FR-NOTE-03, FR-NOTE-07             |
| UR-N05   | Search across notes          | FR-NOTE-10                                     |
| UR-N06   | Tags & filtering             | FR-NOTE-12                                     |
| UR-N07   | Drag-and-drop reorder        | FR-NOTE-09                                     |
| UR-N08   | Export as Markdown           | FR-EXPORT-01                                   |
| UR-N09   | Export as PDF                | FR-EXPORT-02                                   |
| UR-E01   | Block Markdown editor        | FR-EDIT-01                                     |
| UR-E02   | KaTeX rendering              | FR-EDIT-02                                     |
| UR-E03   | Mermaid rendering            | FR-EDIT-03                                     |
| UR-E04   | Formatting toolbar           | FR-EDIT-06                                     |
| UR-E05   | Image upload                 | FR-UPLOAD-01, FR-UPLOAD-02                     |
| UR-E06   | Last-saved indicator         | FR-EDIT-08                                     |
| UR-L01   | Wiki-link syntax             | FR-LINK-01, FR-LINK-03                         |
| UR-L02   | Click wiki-link to navigate  | FR-LINK-02                                     |
| UR-L03   | Backlinks panel              | FR-LINK-04, FR-LINK-05                         |
| UR-L04   | Graph view in right panel    | FR-GRAPH-01, FR-GRAPH-02, FR-GRAPH-05          |
| UR-L05   | Click node in graph          | FR-GRAPH-03                                    |
| UR-L06   | Full-page graph              | FR-GRAPH-06                                    |
| UR-P01   | Publish note                 | FR-PUB-01, FR-PUB-02                           |
| UR-P02   | Pretty public URL            | FR-PUB-03                                      |
| UR-P03   | Copy public URL              | FR-PUB-09                                      |
| UR-P04   | Unpublish note               | FR-PUB-02                                      |
| UR-P05   | Blog post type               | FR-PUB-05                                      |
| UR-P06   | Open Graph meta tags         | FR-PUB-06, FR-PUB-07                           |
| UR-P07   | Public reading (no account)  | FR-PUB-03                                      |
| UR-P08   | Math/diagrams on public page | FR-EDIT-02, FR-EDIT-03 (public renderer)       |
| UR-P09   | User profile page            | FR-PUB-10                                      |
| UR-AI01  | Open Copilot panel           | FR-AI-01, FR-AI-02                             |
| UR-AI02  | Summarise note               | FR-AI-06                                       |
| UR-AI03  | Expand paragraph             | FR-AI-06                                       |
| UR-AI04  | Fix grammar                  | FR-AI-06                                       |
| UR-AI05  | Q&A over note                | FR-AI-05, FR-AI-06                             |
| UR-AI06  | Abort AI response            | FR-AI-07                                       |
| UR-AI07  | Markdown in AI response      | FR-AI-08                                       |
| UR-S01   | Theme toggle                 | FR-SET-02                                      |
| UR-S02   | Update profile               | FR-SET-03                                      |
| UR-S03   | Change password              | FR-SET-04                                      |
| UR-ADM01 | View all users               | FR-AUTH-12                                     |
| UR-ADM02 | Suspend user                 | FR-AUTH-12                                     |
| UR-ADM03 | Promote to admin             | FR-AUTH-12                                     |

---

## 7. Acceptance Criteria

Acceptance criteria define the **conditions that must be met** for each major feature area to be considered done. These are used during QA and stakeholder sign-off.

### 7.1 Authentication

| AC ID   | Criterion                                                                                  |
| ------- | ------------------------------------------------------------------------------------------ |
| AC-A-01 | A visitor can complete registration with email + username + password within 60 seconds.    |
| AC-A-02 | Registering with a username in the reserved list (e.g., "admin") returns an error message. |
| AC-A-03 | A registered user can log in and see their notes within 3 seconds of submitting the form.  |
| AC-A-04 | An unauthenticated request to `/app/notes/[id]` redirects to `/login`.                     |
| AC-A-05 | After logout, the JWT session is invalidated; navigating to `/app` redirects to `/login`.  |

### 7.2 Note Editor

| AC ID   | Criterion                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------- |
| AC-E-01 | Creating a note and typing in the editor triggers an auto-save within 2 seconds of pausing.       |
| AC-E-02 | The editor correctly renders `$E = mc^2$` as inline KaTeX.                                        |
| AC-E-03 | A fenced ` ```mermaid ` block renders as an SVG diagram in the editor.                            |
| AC-E-04 | Uploading a JPEG image embeds it in the note and the image is subsequently served from a GCS URL. |
| AC-E-05 | Uploading a file > 10 MB shows an error toast and does not upload.                                |
| AC-E-06 | Uploading a `.exe` file (non-image) returns an error.                                             |
| AC-E-07 | The last-saved timestamp updates after each successful auto-save.                                 |

### 7.3 Wiki-Links and Graph

| AC ID   | Criterion                                                                                     |
| ------- | --------------------------------------------------------------------------------------------- |
| AC-L-01 | Typing `[[another-note]]` renders a styled highlighted span in the editor.                    |
| AC-L-02 | Clicking the wiki-link navigates the editor to the target note.                               |
| AC-L-03 | The Backlinks panel correctly lists all notes that contain `[[current-note-slug]]`.           |
| AC-L-04 | The graph view in the right panel shows the current note and its linked notes as nodes/edges. |
| AC-L-05 | Clicking a graph node opens the corresponding note.                                           |

### 7.4 Publishing

| AC ID   | Criterion                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------ |
| AC-P-01 | Setting a note to `public` makes it accessible at `/{username}/{...path}` in an incognito browser.     |
| AC-P-02 | Setting a note back to `private` makes the URL return HTTP 404 in an incognito browser.                |
| AC-P-03 | A private note and a non-existent path return identical 404 responses (no distinguishable difference). |
| AC-P-04 | The public page renders KaTeX and Mermaid without a login.                                             |
| AC-P-05 | The Share modal displays the correct pretty URL and clicking "Copy" places it in the clipboard.        |
| AC-P-06 | A public page includes `<meta property="og:title">` with the note title.                               |

### 7.5 AI Copilot

| AC ID    | Criterion                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| AC-AI-01 | Opening the Copilot and asking "summarise this note" returns a summary that references actual note content. |
| AC-AI-02 | The first token of the AI response appears in the chat panel within 2 seconds of submission.                |
| AC-AI-03 | Clicking "Stop" halts the streaming response immediately.                                                   |
| AC-AI-04 | An unauthenticated request to `POST /api/ai/chat` returns HTTP 401.                                         |

### 7.6 Security

| AC ID   | Criterion                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------- |
| AC-S-01 | User A cannot read, update, or delete User B's note by guessing the note's `_id`.                       |
| AC-S-02 | The MongoDB `notes` collection stores `passwordHash` for the User model — no plain-text password field. |
| AC-S-03 | The application does not expose `.env` values in client-side JavaScript bundles.                        |
| AC-S-04 | All pages load over HTTPS; HTTP requests are redirected to HTTPS.                                       |

---

## 8. Release Strategy

Synapse is delivered across **five incremental phases**, aligned with the project plan:

### Phase 1 — MVP (Weeks 1–3)

**Goal:** A working multi-user note platform with editor, auth, and basic publishing.

| Feature                         | Priority | Acceptance            |
| ------------------------------- | -------- | --------------------- |
| User registration & login       | Must     | AC-A-01 – AC-A-05     |
| Note & folder CRUD              | Must     | AC-E-01, AC-E-07      |
| TipTap editor + KaTeX + Mermaid | Must     | AC-E-02 – AC-E-03     |
| Left sidebar tree               | Must     | UR-N01, UR-N02        |
| Table of Contents (right panel) | Must     | FR-TOC-01 – FR-TOC-03 |
| Per-note public/private toggle  | Must     | AC-P-01 – AC-P-03     |
| Public note SSR route           | Must     | AC-P-04               |
| Share modal with pretty URL     | Must     | AC-P-05               |
| User profile page `/{username}` | Must     | UR-P09                |

**Definition of Done (Phase 1):** A user can register, log in, write a Markdown note (with KaTeX + Mermaid), publish it, and share the URL with a non-authenticated visitor who can read the full rendered note.

---

### Phase 2 — Graph & Linking (Week 4)

**Goal:** Bidirectional wiki-links and interactive graph view fully operational.

| Feature                     | Priority | Acceptance        |
| --------------------------- | -------- | ----------------- |
| Wiki-link syntax + renderer | Must     | AC-L-01 – AC-L-02 |
| Backlinks index + panel     | Must     | AC-L-03           |
| D3 graph view (right panel) | Must     | AC-L-04 – AC-L-05 |
| Full-page graph `/graph`    | Should   | FR-GRAPH-06       |

**Definition of Done (Phase 2):** A user can create `[[wiki-links]]`, see the backlinks panel, and interactively explore the note graph in the right panel.

---

### Phase 3 — AI Copilot (Week 5)

**Goal:** Gemini AI assistant integrated with streaming and context injection.

| Feature                           | Priority | Acceptance |
| --------------------------------- | -------- | ---------- |
| `/api/ai/chat` streaming endpoint | Must     | AC-AI-02   |
| Copilot toggle button + panel     | Must     | AC-AI-01   |
| Note context injection            | Must     | AC-AI-01   |
| Abort streaming                   | Should   | AC-AI-03   |
| Markdown rendering in responses   | Should   | UR-AI07    |

**Definition of Done (Phase 3):** A user can open the Copilot, ask questions about their note, and receive a streamed, Markdown-rendered response drawing from the note's content.

---

### Phase 4 — Polish & Deployment (Week 6)

**Goal:** Production-ready deployment with SEO, image uploads, and performance audit.

| Feature                        | Priority | Acceptance        |
| ------------------------------ | -------- | ----------------- |
| GCS image upload               | Should   | AC-E-04 – AC-E-06 |
| Open Graph + Twitter Card meta | Should   | AC-P-06           |
| RSS feed `/feed.xml`           | Should   | FR-PUB-08         |
| Cloud Run + Dockerfile         | Critical | BR-17             |
| Secret Manager integration     | Critical | BR-11             |
| Performance audit (LCP ≤ 2.5s) | High     | NFR-PERF-01       |

**Definition of Done (Phase 4):** Application is deployed on Cloud Run, secrets are managed via Secret Manager, images upload to GCS, public pages pass Core Web Vitals.

---

### Phase 5 — Future Enhancements

| Feature                        | Priority |
| ------------------------------ | -------- |
| Note export (Markdown / PDF)   | P2       |
| Tags + sidebar filtering       | P2       |
| Drag-and-drop reorder          | P2       |
| OAuth (GitHub, Google)         | P2       |
| Admin dashboard                | P2       |
| Password reset flow            | P2       |
| Version history / snapshots    | P3       |
| Obsidian vault import          | P3       |
| Custom domain per user         | P3       |
| Webhooks / Zapier integration  | P3       |
| User follower / following feed | P3       |
| RAG pipeline over all notes    | P3       |

---

## 9. Risks and Mitigations

| #   | Risk                                                        | Likelihood | Impact   | Mitigation                                                                                            |
| --- | ----------------------------------------------------------- | ---------- | -------- | ----------------------------------------------------------------------------------------------------- |
| R01 | Gemini API quota exhausted under load                       | Medium     | High     | Implement per-user rate limiting on `/api/ai/chat`; monitor usage via GCP console; add model toggle   |
| R02 | MongoDB Atlas connection pool exhaustion under traffic      | Low        | High     | Use Mongoose singleton connection pattern; configure appropriate pool size via `MONGODB_URI` options  |
| R03 | TipTap editor incompatibility with KaTeX/Mermaid extensions | Medium     | Medium   | Pin extension versions; write integration tests for editor rendering pipeline                         |
| R04 | GCS presigned URL abuse (external uploads)                  | Low        | Medium   | Scope presigned URLs to `uploads/{userId}/` prefix; set short expiry (5 min); validate MIME on server |
| R05 | Username squatting of system routes (`/api`, `/app`)        | Medium     | High     | Enforce reserved-username blocklist at registration (FR-AUTH-09)                                      |
| R06 | Private note enumeration via timing attacks                 | Low        | High     | Return identical 404 for both private and non-existent notes (NFR-SEC-03)                             |
| R07 | XSS via Markdown in public pages                            | Medium     | High     | Sanitise HTML with `rehype-sanitize` before rendering (NFR-SEC-04)                                    |
| R08 | Cloud Run cold-start latency impacting first request UX     | Medium     | Medium   | Set minimum instances = 1 to keep one warm instance always running                                    |
| R09 | Next-auth v5 breaking changes (beta API)                    | Low        | Medium   | Pin next-auth version; write tests for auth flows; monitor release notes                              |
| R10 | Secret leakage through client-side bundle                   | Low        | Critical | All secret access server-side only; use Next.js `server-only` package on secret-using modules         |

---

## 10. Out of Scope

The following items are explicitly **not included** in Synapse v1.0 (Phase 1–4):

| #   | Out-of-Scope Item                             | Reason                                                 |
| --- | --------------------------------------------- | ------------------------------------------------------ |
| 1   | Real-time collaborative editing (multiplayer) | Requires CRDT/OT infrastructure (future phase)         |
| 2   | Native mobile applications (iOS / Android)    | Web-first; responsive browser experience covers mobile |
| 3   | Offline editing / PWA                         | Network required; complex sync logic deferred          |
| 4   | Full-text search across entire platform       | Scoped to per-user search; global search in future     |
| 5   | Custom domains per user                       | CNAME management complexity deferred to Phase 5        |
| 6   | Version history / note snapshots              | Deferred to Phase 5                                    |
| 7   | Zapier / webhook integrations                 | Deferred to Phase 5                                    |
| 8   | Comment system on public notes                | Deferred; requires moderation system                   |
| 9   | Video / audio embeds                          | Image-only for v1; media hosting cost and complexity   |
| 10  | Third-party AI providers (OpenAI, Anthropic)  | Gemini-only for v1; abstraction layer enables future   |
