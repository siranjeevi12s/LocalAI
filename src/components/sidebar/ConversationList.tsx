import {
  MoreHorizontal,
  Pencil,
  Trash2,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import type { Conversation } from "@/types/chat";
import { cn } from "@/utils/cn";
import { formatRelativeTime } from "@/utils/date";

interface ConversationListProps {
  conversations: Conversation[];
  collapsed: boolean;
  onSelect: () => void;
}

export function ConversationList({
  conversations,
  collapsed,
  onSelect,
}: ConversationListProps) {
  const activeConversationId = useAppStore(
    (state) => state.activeConversationId
  );
  const selectConversation = useAppStore((state) => state.selectConversation);
  const renameConversation = useAppStore((state) => state.renameConversation);
  const deleteConversation = useAppStore((state) => state.deleteConversation);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-1 p-3">
        {conversations.length === 0 && !collapsed && (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No conversations yet.
          </div>
        )}

        {conversations.map((conversation) => {
          const selected = conversation.id === activeConversationId;

          const item = (
            <button
              type="button"
              className={cn(
                "group flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors hover:bg-secondary",
                selected && "bg-secondary text-secondary-foreground",
                collapsed && "justify-center px-0"
              )}
              onClick={() => {
                selectConversation(conversation.id);
                onSelect();
              }}
            >
              <MessageSquareText className="h-4 w-4 shrink-0 text-muted-foreground" />
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {conversation.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatRelativeTime(conversation.updatedAt)}
                    </span>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                        onClick={(event) => event.stopPropagation()}
                        aria-label="Conversation actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          const title = window.prompt(
                            "Rename conversation",
                            conversation.title
                          );
                          if (title) renameConversation(conversation.id, title);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Rename Conversation
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (window.confirm("Delete this conversation?")) {
                            deleteConversation(conversation.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </button>
          );

          if (!collapsed) return <div key={conversation.id}>{item}</div>;

          return (
            <Tooltip key={conversation.id}>
              <TooltipTrigger asChild>{item}</TooltipTrigger>
              <TooltipContent side="right">{conversation.title}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </ScrollArea>
  );
}
