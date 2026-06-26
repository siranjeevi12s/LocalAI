import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { ConversationList } from "@/components/sidebar/ConversationList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  mobileOpen,
  onMobileOpenChange,
  onOpenSettings,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const conversations = useAppStore((state) => state.conversations);
  const settings = useAppStore((state) => state.settings);
  const createConversation = useAppStore((state) => state.createConversation);
  const setSettings = useAppStore((state) => state.setSettings);

  const filteredConversations = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return conversations;

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.title,
        ...conversation.messages.map((message) => message.content),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [conversations, query]);

  const collapsed = settings.sidebarCollapsed;

  const content = (
    <aside
      className={cn(
        "glass-panel flex h-full shrink-0 flex-col border-r transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-[304px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 px-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">LocalMind AI</h1>
            <p className="truncate text-xs text-muted-foreground">
              Private local chat
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto hidden md:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setSettings({ sidebarCollapsed: !collapsed })}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto md:hidden"
          aria-label="Close sidebar"
          onClick={() => onMobileOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 px-3 pb-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn("w-full", collapsed && "px-0")}
              variant="default"
              onClick={() => {
                createConversation();
                onMobileOpenChange(false);
              }}
              aria-label="New chat"
            >
              <MessageSquarePlus className="h-4 w-4" />
              {!collapsed && <span>New Chat</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">New Chat</TooltipContent>}
        </Tooltip>

        {!collapsed && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Search chats"
            />
          </div>
        )}
      </div>

      <Separator />

      <ConversationList
        conversations={filteredConversations}
        collapsed={collapsed}
        onSelect={() => onMobileOpenChange(false)}
      />

      <div className="border-t p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn("w-full justify-start", collapsed && "px-0")}
              onClick={onOpenSettings}
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
              {!collapsed && <span>Settings</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Settings</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block">{content}</div>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-background/72 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onMobileOpenChange(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 md:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
