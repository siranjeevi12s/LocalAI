import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatMessageItem } from "@/components/chat/ChatMessageItem";
import type { ChatMessage } from "@/types/chat";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastMessageContent = messages.at(-1)?.content;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, lastMessageContent]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 md:px-8">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  );
}
