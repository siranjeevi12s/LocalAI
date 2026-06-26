export type ThemeMode = "dark" | "light" | "system";

export interface AppSettings {
  defaultModel: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  theme: ThemeMode;
  autoSaveChats: boolean;
  sidebarCollapsed: boolean;
}

export interface ExportedLocalMindData {
  version: 1;
  exportedAt: string;
  settings: AppSettings;
  conversations: import("./chat").Conversation[];
}
