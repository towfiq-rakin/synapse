import { Download, PanelRight, Share, User } from "lucide-react";
import { useRef, useState } from "react";
import { EDITOR_MENU_USERS, type EditorMenuUser } from "@/components/editor/editor-menu-users";

interface EditorMenuProps {
  onExport: (format: "pdf" | "docx" | "odt") => void;
  user: EditorMenuUser;
  setUser: (user: EditorMenuUser) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  disabled?: boolean;
}

export function EditorMenu({
  onExport,
  user,
  setUser,
  sidebarOpen,
  onToggleSidebar,
  disabled,
}: EditorMenuProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleBlur = (e: React.FocusEvent) => {
    if (!exportRef.current?.contains(e.relatedTarget as Node)) {
      setExportOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-2 py-2 sm:px-4">
      <div className="hidden gap-1.5 sm:flex">
        <div className="h-3 w-3 rounded-full bg-red-400" />
        <div className="h-3 w-3 rounded-full bg-amber-400" />
        <div className="h-3 w-3 rounded-full bg-green-400" />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div
          className={`flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 sm:gap-2 ${disabled ? "opacity-50" : ""}`}
        >
          <User className="h-3 w-3 text-stone-500" />
          <select
            className="w-20 bg-transparent text-xs outline-none sm:w-25"
            value={user.id}
            onChange={(e) => {
              const selectedUser = EDITOR_MENU_USERS.find((u) => u.id === e.target.value);
              if (selectedUser) {
                setUser(selectedUser);
              }
            }}
            disabled={disabled}
          >
            {EDITOR_MENU_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>

        <div className="mx-1 h-4 w-px bg-stone-300 sm:mx-2" />

        <div
          className={`flex gap-1 ${disabled ? "pointer-events-none opacity-50" : ""}`}
        >
          <button
            className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            disabled={disabled}
          >
            <Share className="size-3.5 shrink-0 text-stone-700" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <div className="relative" ref={exportRef} onBlur={handleBlur}>
            <button
              className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
              disabled={disabled}
              onClick={() => setExportOpen(!exportOpen)}
            >
              <Download className="size-3.5 shrink-0 text-stone-700" />
              <span className="hidden sm:inline">Export</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-10 flex w-20 flex-col rounded-md border border-stone-200 bg-white py-1 shadow-md">
                <button
                  className="px-3 py-1 text-left text-xs hover:bg-stone-50"
                  onClick={() => {
                    onExport("pdf");
                    setExportOpen(false);
                  }}
                >
                  PDF
                </button>
                <button
                  className="px-3 py-1 text-left text-xs hover:bg-stone-50"
                  onClick={() => {
                    onExport("docx");
                    setExportOpen(false);
                  }}
                >
                  DOCX
                </button>
                <button
                  className="px-3 py-1 text-left text-xs hover:bg-stone-50"
                  onClick={() => {
                    onExport("odt");
                    setExportOpen(false);
                  }}
                >
                  ODT
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mx-1 hidden h-4 w-px bg-stone-300 sm:block sm:mx-2" />

        <button
          className={`hidden items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-xs hover:bg-stone-50 sm:flex ${
            sidebarOpen
              ? "bg-stone-100 text-stone-900"
              : "bg-white text-stone-500"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
          disabled={disabled}
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}