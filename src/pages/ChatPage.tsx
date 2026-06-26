import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { useChatController } from "@/hooks/useChatController";
import { useAppStore } from "@/store/useAppStore";
import type { HealthStatus, OllamaModel } from "@/types/ollama";

interface ChatPageProps {
  models: OllamaModel[];
  health?: HealthStatus;
  isLoadingModels: boolean;
  onRefreshModels: () => void;
}

export function ChatPage({
  models,
  health,
  isLoadingModels,
  onRefreshModels,
}: ChatPageProps) {
  const { activeConversation, send, stop } = useChatController();
  const isStreaming = useAppStore((state) => state.isStreaming);
  const hasMessages = Boolean(activeConversation?.messages.length);

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        {hasMessages ? (
          <MessageList messages={activeConversation?.messages ?? []} />
        ) : (
          <WelcomeScreen
            models={models}
            health={health}
            isLoadingModels={isLoadingModels}
            onRefreshModels={onRefreshModels}
            onPromptSelect={send}
          />
        )}
      </div>

      <ChatInput
        models={models}
        isStreaming={isStreaming}
        onSend={send}
        onStop={stop}
      />
    </main>
  );
}
