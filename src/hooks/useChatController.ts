import { useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { streamChat } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { ChatRequestMessage } from "@/types/chat";
import { createId } from "@/utils/ids";

function toRequestMessages(messages: ChatRequestMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function useChatController() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversations = useAppStore((state) => state.conversations);
  const activeConversationId = useAppStore(
    (state) => state.activeConversationId
  );
  const settings = useAppStore((state) => state.settings);
  const createConversation = useAppStore((state) => state.createConversation);
  const addMessage = useAppStore((state) => state.addMessage);
  const updateMessage = useAppStore((state) => state.updateMessage);
  const setStreaming = useAppStore((state) => state.setStreaming);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId
      ),
    [activeConversationId, conversations]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStreaming(false);
  }, [setStreaming]);

  const send = useCallback(
    async (content: string) => {
      const prompt = content.trim();
      if (!prompt) return;

      const model = settings.selectedModel || settings.defaultModel;

      if (!model) {
        toast.error("No model selected", {
          description: "Install or select an Ollama model before chatting.",
        });
        return;
      }

      const conversationId =
        activeConversationId || createConversation(prompt);
      const conversation =
        conversations.find((item) => item.id === conversationId) ??
        useAppStore
          .getState()
          .conversations.find((item) => item.id === conversationId);

      const userMessage = {
        id: createId("msg"),
        role: "user" as const,
        content: prompt,
        createdAt: new Date().toISOString(),
        status: "complete" as const,
        model,
      };
      const assistantMessage = {
        id: createId("msg"),
        role: "assistant" as const,
        content: "",
        createdAt: new Date().toISOString(),
        status: "streaming" as const,
        model,
      };

      addMessage(conversationId, userMessage);
      addMessage(conversationId, assistantMessage);
      setStreaming(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const history = [
          ...(conversation?.messages ?? []),
          userMessage,
        ].filter((message) => message.role !== "system");

        await streamChat(
          {
            model,
            messages: toRequestMessages(history),
            options: {
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,
              topP: settings.topP,
            },
          },
          {
            signal: abortController.signal,
            onToken: (token) => {
              const currentMessage = useAppStore
                .getState()
                .conversations.find((item) => item.id === conversationId)
                ?.messages.find((message) => message.id === assistantMessage.id);

              updateMessage(conversationId, assistantMessage.id, {
                content: `${currentMessage?.content ?? ""}${token}`,
              });
            },
            onDone: () => {
              updateMessage(conversationId, assistantMessage.id, {
                status: "complete",
              });
            },
            onError: (message) => {
              updateMessage(conversationId, assistantMessage.id, {
                status: "error",
                error: message,
              });
              toast.error("Generation failed", { description: message });
            },
          }
        );
      } catch (error) {
        if (abortController.signal.aborted) {
          updateMessage(conversationId, assistantMessage.id, {
            status: "complete",
          });
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unexpected streaming error.";

        updateMessage(conversationId, assistantMessage.id, {
          status: "error",
          error: message,
          content:
            "I could not complete that response. Check that Ollama is running and the selected model is available.",
        });
        toast.error("Unable to stream response", { description: message });
      } finally {
        abortControllerRef.current = null;
        setStreaming(false);
      }
    },
    [
      activeConversationId,
      addMessage,
      conversations,
      createConversation,
      setStreaming,
      settings.defaultModel,
      settings.maxTokens,
      settings.selectedModel,
      settings.temperature,
      settings.topP,
      updateMessage,
    ]
  );

  return { activeConversation, send, stop };
}
