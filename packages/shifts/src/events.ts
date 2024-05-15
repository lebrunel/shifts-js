import type { Chat, ChatMessage } from '@chat'
import type { Job } from '@job'

export interface JobEvents<T> {
  ['chat.message']: (event: {
    name: string;
    index: number;
    message: ChatMessage;
    chat: Chat;
  }, job: Job<T>) => void;

  ['chat.message_delta']: (event: {
    name: string;
    index: number;
    text: string;
    snapshot: string;
    chat: Chat;
  }, job: Job<T>) => void;

  ['chat.success']: (event: {
    name: string;
    index: number;
    chat: Chat;
  }, job: Job<T>) => void;

  ['success']: (job: Job<T>) => void;
  ['failure']: (error: Error, job: Job<T>) => void;
}

export interface ChatEvents {
  ['message']: (message: ChatMessage, chat: Chat) => void;
  ['message_delta']: (event: ChatMessageDeltaEvent, chat: Chat) => void;
}

export interface LLMEvents {
  ['content']: (event: LLMContentDeltaEvent) => void;
}

export interface ChatMessageDeltaEvent {
  text: string;
  snapshot: string;
  index: number;
}

type LLMContentDeltaEvent = Omit<ChatMessageDeltaEvent, 'index'>

