import { createNanoEvents, type Unsubscribe } from 'nanoevents'
import type { ChatMessage } from '@chat'
import type { LLMEvents } from '@events'
import type { Tool } from '@tool'
import { isAsyncIter } from '@util'

export abstract class LLMAdapter<C, P, R> {
  protected events = createNanoEvents<LLMEvents>();
  constructor(public client: C, public params: Partial<P>) {}

  async generateNextMessage(params: LLMChatParams): Promise<ChatMessage> {
    let res = await this.handleChatRequest(params)

    if (isAsyncIter(res)) {
      const stream = new LLMStreamResponse<R>(res, this)
      res = await stream.getFinalResponse()
    }
    return this.getChatMessage(res)
  }

  emit<K extends keyof LLMEvents>(
    event: K,
    ...args: Parameters<LLMEvents[K]>
  ): void {
    return this.events.emit(event, ...args)
  }

  on<K extends keyof LLMEvents>(
    event: K,
    handler: LLMEvents[K]
  ) : Unsubscribe {
    return this.events.on(event, handler)
  }

  abstract handleChatRequest(params: LLMChatParams): Promise<R | AsyncIterable<any>>;
  abstract handleStreamEvent(event: any, response: Partial<R>): LLMResponseUpdate<R>;
  abstract getChatMessage(response: R): ChatMessage;
}

export class LLMResponse<R> {
  constructor(public response: Partial<R>) {}

  async getFinalResponse(): Promise<R> {
    return this.response as R
  }
}

export class LLMStreamResponse<R> extends LLMResponse<R> {
  #isComplete = false;
  message: string = ''

  constructor(
    private iter: AsyncIterable<any>,
    private llm: LLMAdapter<any, any, R>,
  ) {
    super({})
  }

  async getFinalResponse(): Promise<R> {
    if (!this.#isComplete) {
      for await (const chunk of this.iter) {
        const { response, text } = this.llm.handleStreamEvent(chunk, this.response)
        this.response = response
        if (typeof text === 'string' && text.length) {
          this.message += text
          this.llm.emit('content', { text, snapshot: this.message })
        }
      }
      this.#isComplete = true
    }
    return super.getFinalResponse()
  }

}

// Types

export type LLM = LLMAdapter<any, any, any>;

export type LLMInitializer<C, P> = (params: Partial<P>, config?: C) => LLM;

export interface LLMChatParams {
  system?: string;
  messages: ChatMessage[];
  tools: Tool[];
}

export interface LLMResponseUpdate<R> {
  response: Partial<R>;
  text?: string;
}
