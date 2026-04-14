"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor, type Editor } from "@tiptap/react"
import { Sigma } from "lucide-react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import {
  Mathematics,
  createMathMigrateTransaction,
} from "@tiptap/extension-mathematics"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"
import { Button as ShadcnButton } from "@/components/ui/button"
import {
  Popover as ShadcnPopover,
  PopoverContent as ShadcnPopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger as ShadcnPopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"
import { MarkdownMathInputExtension } from "@/components/tiptap-extension/markdown-math-input-extension"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import content from "@/components/tiptap-templates/simple/data/content.json"

const AUTO_MATH_MIGRATION_META_KEY = "autoMathMigration"
const INLINE_MATH_MIGRATION_REGEX = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g
const DEFAULT_MATH_FORMULA = "\\sum_{i=1}^{n} i"

function createBlockMathMigrateTransaction(editor: Editor, tr: Editor["state"]["tr"]) {
  const blockMath = editor.schema.nodes.blockMath

  if (!blockMath) {
    return tr
  }

  const matches: Array<{ from: number; to: number; latex: string }> = []

  tr.doc.descendants((node, pos) => {
    if (!node.isTextblock || node.childCount !== 1) {
      return
    }

    const firstChild = node.firstChild

    if (!firstChild?.isText || !firstChild.text) {
      return
    }

    const match = firstChild.text.match(/^\$\$([^$]+?)\$\$$/)

    if (!match) {
      return
    }

    const latex = match[1]?.trim()

    if (!latex) {
      return
    }

    matches.push({
      from: pos,
      to: pos + node.nodeSize,
      latex,
    })
  })

  for (const match of matches.reverse()) {
    const resolvedFrom = tr.doc.resolve(match.from)
    const parent = resolvedFrom.parent
    const index = resolvedFrom.index()

    if (!parent.canReplaceWith(index, index + 1, blockMath)) {
      continue
    }

    tr.replaceWith(match.from, match.to, blockMath.create({ latex: match.latex }))
  }

  return tr
}

const MathFormulaPopover = ({ editor }: { editor: Editor | null }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [latex, setLatex] = useState(DEFAULT_MATH_FORMULA)
  const trimmedLatex = latex.trim()
  const canInsert = Boolean(editor) && trimmedLatex.length > 0

  const handleInsertMath = useCallback(
    (type: "inline" | "block") => {
      if (!editor || !trimmedLatex) {
        return
      }

      const chain = editor.chain().focus()

      if (type === "inline") {
        chain.insertInlineMath({ latex: trimmedLatex }).run()
      } else {
        chain.insertBlockMath({ latex: trimmedLatex }).run()
      }

      setIsOpen(false)
    },
    [editor, trimmedLatex]
  )

  return (
    <ShadcnPopover open={isOpen} onOpenChange={setIsOpen}>
      <ShadcnPopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          tabIndex={-1}
          tooltip="Math Formula"
          aria-label="Math Formula"
          data-active-state={isOpen ? "on" : "off"}
          disabled={!editor}
        >
          <Sigma className="tiptap-button-icon" />
        </Button>
      </ShadcnPopoverTrigger>

      <ShadcnPopoverContent className="w-80" align="center" sideOffset={8}>
        <PopoverHeader>
          <PopoverTitle>Math Formula</PopoverTitle>
          <PopoverDescription>
            Enter LaTeX and insert it as inline or block math.
          </PopoverDescription>
        </PopoverHeader>

        <Textarea
          value={latex}
          onChange={(event) => setLatex(event.target.value)}
          placeholder={DEFAULT_MATH_FORMULA}
          aria-label="Math formula LaTeX input"
          rows={4}
          autoFocus
        />

        <div className="flex items-center justify-end gap-2">
          <ShadcnButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleInsertMath("inline")}
            disabled={!canInsert}
          >
            Insert Inline
          </ShadcnButton>

          <ShadcnButton
            type="button"
            size="sm"
            onClick={() => handleInsertMath("block")}
            disabled={!canInsert}
          >
            <Sigma className="size-4" />
            Insert Block
          </ShadcnButton>
        </div>
      </ShadcnPopoverContent>
    </ShadcnPopover>
  )
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  editor,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  editor: Editor | null
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MathFormulaPopover editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor() {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
      MarkdownMathInputExtension,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content,
    onCreate({ editor: currentEditor }) {
      let migrationTr = createBlockMathMigrateTransaction(
        currentEditor,
        currentEditor.state.tr
      )
      migrationTr = createMathMigrateTransaction(
        currentEditor,
        migrationTr,
        INLINE_MATH_MIGRATION_REGEX
      )

      if (migrationTr.steps.length === 0) {
        return
      }

      migrationTr.setMeta(AUTO_MATH_MIGRATION_META_KEY, true)
      currentEditor.view.dispatch(migrationTr)
    },
    onTransaction({ editor: currentEditor, transaction }) {
      if (!transaction.docChanged || transaction.getMeta(AUTO_MATH_MIGRATION_META_KEY)) {
        return
      }

      let migrationTr = createBlockMathMigrateTransaction(
        currentEditor,
        currentEditor.state.tr
      )
      migrationTr = createMathMigrateTransaction(
        currentEditor,
        migrationTr,
        INLINE_MATH_MIGRATION_REGEX
      )
      migrationTr = createBlockMathMigrateTransaction(currentEditor, migrationTr)

      if (migrationTr.steps.length === 0) {
        return
      }

      migrationTr.setMeta(AUTO_MATH_MIGRATION_META_KEY, true)
      migrationTr.setMeta("addToHistory", false)
      currentEditor.view.dispatch(migrationTr)
    },
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarHeight,
  })

  useEffect(() => {
    const toolbarElement = toolbarRef.current

    if (!toolbarElement) {
      return
    }

    const updateToolbarHeight = () => {
      setToolbarHeight(toolbarElement.getBoundingClientRect().height)
    }

    updateToolbarHeight()

    const resizeObserver = new ResizeObserver(updateToolbarHeight)
    resizeObserver.observe(toolbarElement)

    window.addEventListener("resize", updateToolbarHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateToolbarHeight)
    }
  }, [])

  const toolbarView = isMobile ? mobileView : "main"

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {toolbarView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              editor={editor}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={toolbarView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}
