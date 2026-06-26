export type ChatRole = "system" | "user" | "assistant";

export type MessageStatus = "complete" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  status?: MessageStatus;
  model?: string;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  messages: ChatMessage[];
}

export interface ChatRequestMessage {
  role: ChatRole;
  content: string;
}

export interface ChatGenerationOptions {
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface StreamChatRequest {
  model: string;
  messages: ChatRequestMessage[];
  options: ChatGenerationOptions;
}

export type StreamEvent =
  | { type: "token"; content: string }
  | { type: "done"; stats?: Record<string, unknown> }
  | { type: "error"; message: string };
