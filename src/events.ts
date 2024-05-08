import type { Chat, ChatMessage } from '@chat'

export interface ChatEvents {
  ['message']: (message: ChatMessage, chat: Chat) => void,
  ['message_delta']: (event: ChatMessageDeltaEvent, chat: Chat) => void,
}

export interface LLMEvents {
  ['content']: (event: LLMContentDeltaEvent) => void
}

export interface ChatMessageDeltaEvent {
  text: string;
  snapshot: string;
  index: number;
}

type LLMContentDeltaEvent = Omit<ChatMessageDeltaEvent, 'index'>

