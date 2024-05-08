import type { LLM } from '@llm'

export class Chat {}

// Types

export interface ChatInitParams {
  llm?: LLM;
  system?: string;
  prompt?: string;
  tools?: any[];
}

export type ChatMessage = ChatBotMessage | ChatUserMessage;

export interface ChatBotMessage extends ChatBaseMessage {
  role: 'chatbot';
  tools?: ChatToolUse[];
}

export interface ChatUserMessage extends ChatBaseMessage {
  role: 'user';
  tools?: ChatToolResult[];
}

interface ChatBaseMessage {
  role: string;
  content: string;
}

interface ChatToolUse {
  id?: string;
  name: string;
  input: { [name: string]: string; };
}

interface ChatToolResult {
  id?: string;
  name: string;
  output: string;
}
