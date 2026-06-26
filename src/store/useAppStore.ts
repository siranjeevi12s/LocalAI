import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { ChatMessage, Conversation } from "@/types/chat";
import type { AppSettings, ExportedLocalMindData } from "@/types/settings";
import { createConversationTitle } from "@/utils/title";
import { createId } from "@/utils/ids";

const now = () => new Date().toISOString();

const defaultSettings: AppSettings = {
  defaultModel: "",
  selectedModel: "",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  theme: "system",
  autoSaveChats: true,
  sidebarCollapsed: false,
};

interface AppState {
  conversations: Conversation[];
  activeConversationId?: string;
  settings: AppSettings;
  isStreaming: boolean;
  createConversation: (initialPrompt?: string) => string;
  selectConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearConversations: () => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  setStreaming: (isStreaming: boolean) => void;
  importData: (data: ExportedLocalMindData) => void;
  exportData: () => ExportedLocalMindData;
}

function ensureConversationTitle(conversation: Conversation, prompt: string) {
  if (conversation.title !== "New chat" || !prompt.trim()) return conversation;

  return {
    ...conversation,
    title: createConversationTitle(prompt),
  };
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        conversations: [],
        activeConversationId: undefined,
        settings: defaultSettings,
        isStreaming: false,
        createConversation: (initialPrompt) => {
          const id = createId("chat");
          const createdAt = now();

          const conversation: Conversation = {
            id,
            title: initialPrompt
              ? createConversationTitle(initialPrompt)
              : "New chat",
            createdAt,
            updatedAt: createdAt,
            model: get().settings.selectedModel || get().settings.defaultModel,
            messages: [],
          };

          set((state) => ({
            conversations: [conversation, ...state.conversations],
            activeConversationId: id,
          }));

          return id;
        },
        selectConversation: (id) => {
          set({ activeConversationId: id });
        },
        renameConversation: (id, title) => {
          const trimmed = title.trim();
          if (!trimmed) return;

          set((state) => ({
            conversations: state.conversations.map((conversation) =>
              conversation.id === id
                ? { ...conversation, title: trimmed, updatedAt: now() }
                : conversation
            ),
          }));
        },
        deleteConversation: (id) => {
          set((state) => {
            const conversations = state.conversations.filter(
              (conversation) => conversation.id !== id
            );
            const activeConversationId =
              state.activeConversationId === id
                ? conversations[0]?.id
                : state.activeConversationId;

            return { conversations, activeConversationId };
          });
        },
        clearConversations: () => {
          set({ conversations: [], activeConversationId: undefined });
        },
        addMessage: (conversationId, message) => {
          set((state) => ({
            conversations: state.conversations.map((conversation) => {
              if (conversation.id !== conversationId) return conversation;

              const titledConversation =
                message.role === "user"
                  ? ensureConversationTitle(conversation, message.content)
                  : conversation;

              return {
                ...titledConversation,
                updatedAt: now(),
                model: state.settings.selectedModel || conversation.model,
                messages: [...conversation.messages, message],
              };
            }),
          }));
        },
        updateMessage: (conversationId, messageId, updates) => {
          set((state) => ({
            conversations: state.conversations.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    updatedAt: now(),
                    messages: conversation.messages.map((message) =>
                      message.id === messageId
                        ? { ...message, ...updates }
                        : message
                    ),
                  }
                : conversation
            ),
          }));
        },
        setSettings: (settings) => {
          set((state) => ({
            settings: { ...state.settings, ...settings },
          }));
        },
        setStreaming: (isStreaming) => {
          set({ isStreaming });
        },
        importData: (data) => {
          set({
            conversations: data.conversations,
            settings: { ...defaultSettings, ...data.settings },
            activeConversationId: data.conversations[0]?.id,
          });
        },
        exportData: () => ({
          version: 1,
          exportedAt: now(),
          settings: get().settings,
          conversations: get().conversations,
        }),
      }),
      {
        name: "localmind-ai",
        version: 1,
        partialize: (state) => ({
          conversations: state.settings.autoSaveChats
            ? state.conversations
            : [],
          activeConversationId: state.settings.autoSaveChats
            ? state.activeConversationId
            : undefined,
          settings: state.settings,
        }),
        merge: (persisted, current) => {
          const data = persisted as Partial<AppState> | undefined;

          return {
            ...current,
            ...data,
            conversations: Array.isArray(data?.conversations)
              ? data.conversations
              : current.conversations,
            settings: {
              ...defaultSettings,
              ...data?.settings,
            },
          };
        },
      }
    )
  )
);
