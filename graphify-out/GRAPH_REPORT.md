# Graph Report - note-app  (2026-05-13)

## Corpus Check
- 253 files · ~175,839 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1800 nodes · 3242 edges · 100 communities (90 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8e30f863`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 94|Community 94]]

## God Nodes (most connected - your core abstractions)
1. `After Setup` - 68 edges
2. `connectToDatabase()` - 41 edges
3. `useTiptapEditor()` - 40 edges
4. `getAuthenticatedUserId()` - 39 edges
5. `cn()` - 34 edges
6. `Button()` - 23 edges
7. `PATCH()` - 21 edges
8. `parseShortcutKeys()` - 20 edges
9. `isNodeTypeSelected()` - 19 edges
10. `getExplorerPayload()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `Auth`  [INFERRED]
  app/api/settings/password/route.ts → docs/ARCHITECTURE.md
- `POST()` --calls--> `Auth`  [INFERRED]
  app/api/ai/chat/route.ts → docs/ARCHITECTURE.md
- `PATCH()` --calls--> `generateUniqueShareId()`  [INFERRED]
  app/api/folders/[id]/route.ts → lib/publishing/note.ts
- `PATCH()` --calls--> `buildPublishedSnapshot()`  [INFERRED]
  app/api/folders/[id]/route.ts → lib/publishing/note.ts
- `useTextAlign()` --calls--> `useTiptapEditor()`  [EXTRACTED]
  components/tiptap-ui/text-align-button/use-text-align.ts → hooks/use-tiptap-editor.ts

## Communities (100 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (69): getAuthenticatedUserId(), INoteTocItem, formatFolderLabel(), generateMetadata(), PublicProfileNotePage(), PublicProfileNotePageProps, formatDateLabel(), normalizeText() (+61 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (68): After Setup, Planner Response, Planner Response, Planner Response, Planner Response, Planner Response, Planner Response, Planner Response (+60 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (41): AppLayout(), AppLayoutProps, geist, geistMono, ibmPlexMono, jetBrainsMono, libreBaskerville, lora (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (32): BlockquoteButton, BlockquoteButtonProps, BlockquoteShortcutBadge(), CodeBlockButton, CodeBlockButtonProps, CodeBlockShortcutBadge(), ColorHighlightButton, ColorHighlightButtonProps (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (48): 1.1 Purpose, 1.2 Scope, 1.3 Definitions, Acronyms, and Abbreviations, 1.4 Overview, 1. Introduction, 2.1 Product Perspective, 2.2 Product Functions — Summary, 2.3.1 Owner / Admin (+40 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (33): AuthDivider(), AuthField(), GitHubIcon(), GoogleIcon(), PasswordField(), AuthShell(), AuthShellProps, SynapseMark() (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (21): buildTree(), compareBySort(), ExplorerFolder, ExplorerNote, ExplorerPayload, ExplorerSidebarProps, FolderOption, SortMode (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (24): useIsMobile(), AppShellProps, DesktopSidebarControl(), SidebarPanel, NavItemButton(), Sheet(), SheetContent(), SheetDescription() (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (14): Button, ButtonProps, ButtonSize, ButtonVariant, Card, CardBody, CardFooter, CardGroupLabel (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (41): 10. Deployment Topology (GCS + Cloud Run), 11. Pretty URL System, 12. Security Model, 1. High-Level System Diagram, 2. Project Folder Structure, 3.1 Note, 3.2 Folder, 3.3 User (+33 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (25): AppOptionsPopover(), AppOptionsPopoverProps, FolderItem, buildAbsoluteUrl(), NoteGetResponse, PublicProfileResponse, PublishResponse, ShareNoteDialog() (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (40): Badges & Status, Border Radius Scale, Brand Color Spectrum (echoes live product database properties), Brand & Primary, Breakpoints, Buttons, Card Tints (Pastel Feature Card Backgrounds), Cards & Containers (+32 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (38): 10. Out of Scope, 1. Executive Summary, 2.1 Problem Statement, 2.2 Opportunity, 2.3 Platform Vision, 2. Business Context & Opportunity, 3. Stakeholders, 4.1 Core Platform (+30 more)

### Community 13 - "Community 13"
Cohesion: 0.1
Nodes (30): GET(), POST(), createFolderForUser(), ExplorerFolder, ExplorerNote, ExplorerPayload, ExplorerUser, getExplorerPayload() (+22 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (21): AppSidebar(), AppSidebarProps, filterNotesByTitle(), normalizeSearchTerm(), NoteSummary, primarySidebarItems, PublicReaderSearchProps, Command() (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (25): isMarkInSchema(), canToggleMark(), getFormattedMarkName(), isMarkActive(), Mark, MARK_SHORTCUT_KEYS, markIcons, shouldShowButton() (+17 more)

### Community 16 - "Community 16"
Cohesion: 0.1
Nodes (25): AiChatMessage, VALID_ACTIONS, validateAiChatRequest(), ValidatedAiChatRequest, getGeminiClient(), ACTION_INSTRUCTIONS, AiNoteAction, buildNoteAssistantPrompt() (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (25): AutoSyncNoteEditor(), AutoSyncNoteEditorProps, buildPrintDocument(), EMPTY_FRONTMATTER, escapeHtml(), FrontmatterFieldKey, lowlight, normalizeFileName() (+17 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (26): canToggleBlockquote(), shouldShowButton(), toggleBlockquote(), useBlockquote(), UseBlockquoteConfig, canToggle(), shouldShowButton(), toggleCodeBlock() (+18 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (28): code:bash (# Run inside note-app/ directory), code:bash (mkdir -p lib/db/models), code:bash (npm run dev), code:bash (mkdir -p \), code:bash (git init), code:bash (git remote add origin https://github.com/<you>/Synapse.git), code:bash (# UI & Icons), code:bash (npx shadcn@latest add button input textarea \) (+20 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (20): isListActive(), LIST_SHORTCUT_KEYS, listIcons, listLabels, ListType, useList(), UseListConfig, canToggleAnyList() (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (12): EditorMode, SimpleMarkdownEditorProps, cn(), Badge(), badgeVariants, InputGroup(), InputGroupAddon(), inputGroupAddonVariants (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.1
Nodes (18): HEADING_SHORTCUT_KEYS, headingIcons, isHeadingActive(), Level, useHeading(), UseHeadingConfig, HeadingFiveIcon, SvgProps (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (20): DELETE(), GET(), normalizeFileName(), normalizeFolderId(), normalizeSlug(), normalizeTags(), normalizeTitle(), PATCH() (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (19): canSetTextAlign(), hasSetTextAlign(), isTextAlignActive(), setTextAlign(), shouldShowButton(), TEXT_ALIGN_SHORTCUT_KEYS, TextAlign, textAlignIcons (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (18): coercePositiveInteger(), findOwnedNote(), isValidNoteId(), normalizeOriginalFilename(), OwnedNote, CreateAssetBody, LeanAsset, normalizeFormat() (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.1
Nodes (14): Commands, ImageUploadNode, ImageUploadNodeOptions, UploadedImage, UploadFunction, FileItem, ImageUploadDragAreaProps, ImageUploadNode() (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (14): renderPrintableNoteHtml(), enhanceMermaidCodeBlocks(), findMermaidCodeBlocks(), getMermaid(), renderMermaidInHtmlString(), renderMermaidSource(), PublicNoteContentProps, createPreviewWidget() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (19): INote, isPublishVisibility(), PATCH(), PublishableNote, PublishBody, RouteContext, buildPublishedSnapshot(), clearPublishedFields() (+11 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (8): Page(), SimpleEditor(), Popover(), PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle(), PopoverTrigger()

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (14): ensureProfileIndexNote(), ensurePublishedProfileIndexNote(), findProfileIndexNote(), ProfileIndexNoteSummary, PublishableProfileIndexNote, IUser, userSchema, NotesPage() (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (9): defaultColors, LiquidEtherProps, LiquidEtherWebGL, SimOptions, TextPressureProps, SynapseLanding(), PublicTopBarProps, Button() (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (15): connectToDatabase(), EditorNote, NoteEditorPage(), NotePageProps, buildBaseUsername(), buildDisplayName(), ClerkUser, ensureLocalUserRecord() (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (15): CursorVisibilityOptions, useCursorVisibility(), ElementRectOptions, initialRect, isClientSide(), RectState, useBodyRect(), useElementRect() (+7 more)

### Community 34 - "Community 34"
Cohesion: 0.12
Nodes (13): LinkButton, LinkContent(), LinkMainProps, LinkPopover, LinkPopoverProps, CornerDownLeftIcon, SvgProps, ExternalLinkIcon (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.12
Nodes (13): findNodeAtPosition(), getSelectedNodesOfType(), handleImageUpload(), isAllowedUri(), MAC_SYMBOLS, ProtocolConfig, ProtocolOptions, sanitizeUrl() (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (12): HeadingDropdownMenu, HeadingDropdownMenuProps, getActiveHeadingLevel(), useHeadingDropdownMenu(), UseHeadingDropdownMenuConfig, useTiptapEditor(), ListDropdownMenu(), ListDropdownMenuProps (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.11
Nodes (18): 1. Vision & Goals, 2. User Roles, 3.1 Core Editor, 3.2 Navigation — Left Sidebar, 3.3 Right Panel, 3.4 AI Assistant (Copilot), 3.5 Publishing & Blogging, 3.6 Auth (+10 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (17): Add Clerk to Next.js App Router, app/layout.tsx, Chat Conversation, ✅ Clerk Integration Complete, code:bash (npx create-next-app@latest my-clerk-app --yes), code:bash (npm install @clerk/nextjs), code:typescript (import { clerkMiddleware } from '@clerk/nextjs/server'), code:typescript (import { ClerkProvider, SignInButton, SignUpButton, Show, Us) (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (11): ACTION_USER_LABELS, AiAssistantPanel(), AiAssistantPanelProps, AiChatMessage, QUICK_ACTIONS, QuickAction, MarkdownContent(), processor (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (13): toEditorContent(), looksLikeLegacyHtmlDocument(), decorateLegacyHtml(), getMarkdownSource(), normalizeLineEndings(), PublicNoteTocItem, renderMarkdownHtml(), renderPublicNote() (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (12): ColorHighlightPopoverContent(), useComposedRef(), UserRef, MenuNavigationOptions, Orientation, useMenuNavigation(), BaseProps, Toolbar (+4 more)

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (13): Redo2Icon, SvgProps, SvgProps, Undo2Icon, canExecuteUndoRedoAction(), executeUndoRedoAction(), historyActionLabels, historyIcons (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (15): 10) Recommended next hardening, 1) Is the current database schema final?, 2) Why Atlas shows a database named test, 3) When should you deploy?, 4) Files added for deployment, 5) CI/CD pipeline behavior, 6.1 Install Docker + Compose plugin, 6.2 Create deployment directory (+7 more)

### Community 44 - "Community 44"
Cohesion: 0.42
Nodes (14): generateUniqueSlug(), parseFrontmatterTitle(), createFolderAction(), createNoteAction(), createQuickNoteAction(), deleteNoteAction(), normalizeFileName(), normalizeFolderName() (+6 more)

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (12): BreakpointMode, useIsBreakpoint(), canInsertImage(), insertImage(), isImageActive(), shouldShowButton(), useImageUpload(), UseImageUploadConfig (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (13): buildTree(), flattenFolderOptions(), FolderNode, FolderOption, SidebarFolder, SidebarNote, SidebarTree(), SidebarTreeProps (+5 more)

### Community 47 - "Community 47"
Cohesion: 0.19
Nodes (11): AssetProvider, assetSchema, IAsset, folderSchema, IFolder, noteSchema, noteTocItemSchema, NoteType (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.16
Nodes (7): ColorHighlightPopoverButton, ColorHighlightPopoverContentProps, ColorHighlightPopoverProps, BanIcon, SvgProps, HighlighterIcon, SvgProps

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (11): canColorHighlight(), getHighlightColorValue(), HIGHLIGHT_COLORS, HighlightColor, HighlightMode, isColorHighlightActive(), removeHighlight(), shouldShowButton() (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (3): isInsideCodeContext(), isMathNodeName(), MarkdownMathInputExtension

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (11): 8.1 Data Model Overview, 8.2 Document Schemas, 8.3 Indexes, 8.4 Data Flow: Backlink Index, 8. Data Architecture, code:mermaid (erDiagram), code:typescript (const UserSchema = new Schema<IUser>({), code:block15 (Write path:) (+3 more)

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (12): AI Assistant — Library Comparison & Recommendation, code:block1 (Vercel AI SDK (@ai-sdk/google) ← handles all streaming + Gem), code:bash (npm i ai @ai-sdk/google @assistant-ui/react), code:typescript (// app/api/ai/chat/route.ts), code:typescript (// Using assistant-ui with Vercel AI SDK), Gemini Model Choice, Option A — Vercel AI SDK + `assistant-ui` ⭐ RECOMMENDED, Option B — Build from Scratch (+4 more)

### Community 53 - "Community 53"
Cohesion: 0.24
Nodes (8): decodeHtmlAttribute(), getImageTagAttribute(), getLeadingSpaces(), isListItemLine(), MARKDOWN_ONLY_PATTERNS, normalizeEmbeddedImageTags(), normalizeListAttachedCodeFences(), normalizeMarkdownForRendering()

### Community 54 - "Community 54"
Cohesion: 0.26
Nodes (11): CloudinaryUploadResponse, fileNameToAlt(), readErrorMessage(), requestSignature(), saveAsset(), SavedAssetResponse, SignatureResponse, UploadedNoteImageAsset (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.17
Nodes (11): 13.1 Known Risks, 13.2 Identified Technical Debt, 13. Architecture Risks & Technical Debt, 2.1 Driving Quality Attributes, 2.2 Architectural Constraints, 2. Architectural Goals & Constraints, 3.1 External System Responsibilities, 3. System Context View (+3 more)

### Community 56 - "Community 56"
Cohesion: 0.2
Nodes (9): Tooltip(), TooltipContent, TooltipContentProps, TooltipContext, TooltipContextValue, TooltipProviderProps, TooltipTrigger, TooltipTriggerProps (+1 more)

### Community 57 - "Community 57"
Cohesion: 0.18
Nodes (11): 5.1 Note Auto-Save Flow, 5.2 Public Note Resolution Flow, 5.3 AI Copilot Streaming Flow, 5.4 Image Upload Flow, 5.5 Authentication Flow (Credentials), 5. Process View — Runtime Behaviour, code:mermaid (sequenceDiagram), code:mermaid (sequenceDiagram) (+3 more)

### Community 58 - "Community 58"
Cohesion: 0.2
Nodes (10): [](#additional-setup)Additional Setup, code:block3 (import 'katex/dist/katex.min.css'), code:block4 (/* The rendered math node */), code:block5 (import Mathematics from '@tiptap/extension-mathematics'), code:block6 (import { migrateMathStrings } from '@tiptap/extension-mathem), code:block7 (import { InlineMath } from '@tiptap/extension-mathematics/in), [](#configuring-the-extension-and-updating-math-nodes)Configuring the extension and updating math nodes, [](#migrating-existing-math-decorations-to-math-nodes)Migrating existing math decorations to math nodes (+2 more)

### Community 59 - "Community 59"
Cohesion: 0.36
Nodes (8): canSetLink(), isLinkActive(), LinkHandlerProps, shouldShowLinkButton(), useLinkHandler(), useLinkPopover(), UseLinkPopoverConfig, useLinkState()

### Community 60 - "Community 60"
Cohesion: 0.22
Nodes (9): 4.1 Component Diagram, 4.2.1 Browser — App Shell, 4.2.2 Browser — Zustand Stores, 4.2.3 Server — Public RSC Routes, 4.2.4 Server — API Routes, 4.2.5 Server — Infrastructure Library (`lib/`), 4.2 Component Responsibilities, 4. Logical View — Component Decomposition (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.22
Nodes (9): 9.1 Threat Model Summary, 9.2 Authentication & Authorisation, 9.3 Content Security, 9.4 Password Security, 9.5 Secret Management, 9. Security Architecture, code:mermaid (graph LR), code:block17 (Registration:) (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.22
Nodes (9): code:block21 (import { mathMigrationRegex } from '@tiptap/extension-mathem), code:block22 (import { createMathMigrateTransaction } from '@tiptap/extens), code:block23 (import { migrateMathStrings } from '@tiptap/extension-mathem), [](#createmathmigratetransactioneditor-transaction-regex)`createMathMigrateTransaction(editor, transaction, regex)`, [](#mathmigrationregex)`mathMigrationRegex`, [](#migratemathstringseditor-regex)`migrateMathStrings(editor, regex)`, [](#params)Params, [](#params)Params (+1 more)

### Community 63 - "Community 63"
Cohesion: 0.53
Nodes (7): GET(), normalizeFileName(), normalizeNoteTitle(), normalizeSlug(), normalizeTags(), normalizeText(), POST()

### Community 64 - "Community 64"
Cohesion: 0.32
Nodes (5): ThemeToggle(), MoonStarIcon, SvgProps, SunIcon, SvgProps

### Community 65 - "Community 65"
Cohesion: 0.25
Nodes (8): 12. Quality Attribute Scenarios, QAS-01: Performance — Public Page Load, QAS-02: Performance — Auto-Save Latency, QAS-03: Security — Private Note Indistinguishability, QAS-04: Security — IDOR Prevention, QAS-05: Reliability — Auto-Save on Network Failure, QAS-06: Scalability — Traffic Spike, QAS-07: Modifiability — Adding a New Editor Extension

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (7): 11. Architecture Decision Records (ADRs), ADR-001: Next.js 14 App Router as the unified full-stack framework, ADR-002: MongoDB Atlas as the document database, ADR-003: Vercel AI SDK + assistant-ui for the AI Copilot, ADR-004: Materialised path strategy for folder/note hierarchy, ADR-005: Stateless server — no in-process session storage, ADR-006: GCS presigned URL for client-side image upload

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (7): 10.1 Error Handling Strategy, 10.2 Logging, 10.3 Caching Strategy, 10.4 Internationalisation (i18n), 10.5 Accessibility, 10.6 Observability (Future Phase 5), 10. Cross-Cutting Concerns

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (7): code:block15 (// with a specified position), code:block16 (// with a specified position), code:block17 (// with a specified position), [](#commands-inlinemath)Commands: InlineMath, [](#deleteinlinemath-pos)`deleteInlineMath({ pos })`, [](#insertinlinemath-latex-pos)`insertInlineMath({ latex, pos })`, [](#updateinlinemath-latex-pos)`updateInlineMath({ latex, pos })`

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (7): [](#blockoptions)`blockOptions`, code:block10 (import Mathematics from '@tiptap/extension-mathematics'), code:block8 (import Mathematics from '@tiptap/extension-mathematics'), code:block9 (import Mathematics from '@tiptap/extension-mathematics'), [](#inlineoptions)`inlineOptions`, [](#katexoptions)`katexOptions`, [](#settings)Settings

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (7): code:block18 (// with a specified position), code:block19 (// with a specified position), code:block20 (// with a specified position), [](#commands-blockmath)Commands: BlockMath, [](#deleteblockmath-pos)`deleteBlockMath({ pos })`, [](#insertblockmath-latex-pos)`insertBlockMath({ latex, pos })`, [](#updateblockmath-latex-pos)`updateBlockMath({ latex, pos })`

### Community 71 - "Community 71"
Cohesion: 0.47
Nodes (3): EditorMenuProps, EDITOR_MENU_USERS, EditorMenuUser

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (3): EditableBlockMath, EditableInlineMath, EditableMathematics

### Community 74 - "Community 74"
Cohesion: 0.47
Nodes (5): applyMarkdownLink(), headingInputRegexes, isInCodeContext(), LiveMarkdownInputExtension, normalizeMarkdownHref()

### Community 75 - "Community 75"
Cohesion: 0.33
Nodes (6): 7.1 Infrastructure Topology, 7.2 Cloud Run Configuration, 7.3 GCS Bucket Configuration, 7.4 MongoDB Atlas Configuration, 7. Deployment View — Physical Infrastructure, code:mermaid (flowchart TD)

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (6): 6.1 Directory Structure and Layer Map, 6.2 Layer Dependency Rules, 6.3 Key TipTap Extensions, 6. Development View — Module Structure, code:block8 (note-app/), code:mermaid (graph TD)

### Community 77 - "Community 77"
Cohesion: 0.33
Nodes (5): code:block1 (npm install @tiptap/extension-mathematics katex), code:block2 (import { Mathematics } from '@tiptap/extension-mathematics'), [](#install)Install, Mathematics extension, [](#usage)Usage

### Community 78 - "Community 78"
Cohesion: 0.4
Nodes (4): config, isProtectedRoute, isPublicRoute, url

### Community 79 - "Community 79"
Cohesion: 0.4
Nodes (3): EventTargetWithScroll, ScrollTarget, UseScrollingOptions

### Community 81 - "Community 81"
Cohesion: 0.4
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

### Community 82 - "Community 82"
Cohesion: 0.4
Nodes (5): 1.1 Purpose, 1.2 Scope, 1.3 Architectural Approach, 1.4 Definitions, 1. Introduction

### Community 83 - "Community 83"
Cohesion: 0.4
Nodes (5): code:block13 (import { BlockMath } from '@tiptap/extension-mathematics'), code:block14 (import { BlockMath } from '@tiptap/extension-mathematics'), [](#katexoptions)`katexOptions`, [](#onclick)`onClick`, [](#settings-blockmath)Settings: `BlockMath`

### Community 84 - "Community 84"
Cohesion: 0.4
Nodes (5): code:block11 (import { InlineMath } from '@tiptap/extension-mathematics'), code:block12 (import { InlineMath } from '@tiptap/extension-mathematics'), [](#katexoptions)`katexOptions`, [](#onclick)`onClick`, [](#settings-inlinemath)Settings: `InlineMath`

### Community 85 - "Community 85"
Cohesion: 0.5
Nodes (3): graphify, Ignore graphify rules, This is NOT the Next.js you know

## Knowledge Gaps
- **642 isolated node(s):** `eslintConfig`, `config`, `nextConfig`, `isPublicRoute`, `isProtectedRoute` (+637 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getAuthenticatedUserId()` connect `Community 0` to `Community 32`, `Community 44`, `Community 13`, `Community 16`, `Community 23`, `Community 25`, `Community 28`, `Community 30`, `Community 63`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `connectToDatabase()` connect `Community 32` to `Community 0`, `Community 44`, `Community 13`, `Community 16`, `Community 23`, `Community 25`, `Community 28`, `Community 30`, `Community 63`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 16` to `Community 0`, `Community 32`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `config`, `nextConfig` to the rest of the system?**
  _642 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._