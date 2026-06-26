import { motion } from "framer-motion";
import { Bot, UserRound } from "lucide-react";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { TypingCursor } from "@/components/chat/TypingCursor";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/utils/cn";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-3", isUser && "justify-end")}
    >
      {!isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "min-w-0 max-w-[min(100%,760px)] rounded-lg border px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground",
          message.status === "error" && "border-destructive/60"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
        ) : (
          <div className="text-sm leading-6">
            {message.content ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              <TypingCursor />
            )}
            {message.status === "streaming" && message.content && <TypingCursor />}
            {message.error && (
              <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {message.error}
              </p>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </motion.article>
  );
}
