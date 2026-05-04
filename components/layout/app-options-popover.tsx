"use client"

import {
  BookOpenText,
  Code2,
  Ellipsis,
  FileCode2,
  FileDown,
  FolderInput,
  PencilLine,
  Replace,
  ScanSearch,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

type AppOptionsPopoverProps = {
  exportDisabled?: boolean
  onExportMarkdown?: () => void
  onExportPdf?: () => void
}

export function AppOptionsPopover({
  exportDisabled = false,
  onExportMarkdown,
  onExportPdf,
}: AppOptionsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Open note options"
          className="shrink-0"
        >
          <Ellipsis />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        alignOffset={-4}
        collisionPadding={{ right: 16, top: 8, bottom: 8, left: 8 }}
        className="w-56 p-1.5"
      >
        <div className="space-y-0.5">
          <Button type="button" variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal">
            <BookOpenText className="size-4" />
            Reading view
          </Button>
          <Button type="button" variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal">
            <Code2 className="size-4" />
            Source mode
          </Button>
          <Button type="button" variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal">
            <PencilLine className="size-4" />
            Rename
          </Button>
          <Button type="button" variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal">
            <FolderInput className="size-4" />
            Move file to
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
            disabled={exportDisabled}
            onClick={onExportPdf}
          >
            <FileDown className="size-4" />
            Export to PDF
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
            disabled={exportDisabled}
            onClick={onExportMarkdown}
          >
            <FileCode2 className="size-4" />
            Export to Markdown
          </Button>
          <Button type="button" variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal">
            <ScanSearch className="size-4" />
            Find...
          </Button>
          <Button type="button" variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal">
            <Replace className="size-4" />
            Replace...
          </Button>
        </div>
        <Separator className="my-1" />
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal text-red-600 hover:text-red-600"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </PopoverContent>
    </Popover>
  )
}
