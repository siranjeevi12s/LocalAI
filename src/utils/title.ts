const DEFAULT_TITLE = "New chat";

export function createConversationTitle(prompt: string) {
  const cleaned = prompt.replace(/\s+/g, " ").trim();

  if (!cleaned) return DEFAULT_TITLE;
  if (cleaned.length <= 48) return cleaned;

  return `${cleaned.slice(0, 45).trim()}...`;
}
