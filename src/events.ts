export interface LLMEvents {
  ['content']: (event: LLMContentDeltaEvent) => void
}

export interface ChatMessageDeltaEvent {
  text: string;
  snapshot: string;
  index: number;
}

type LLMContentDeltaEvent = Omit<ChatMessageDeltaEvent, 'index'>

