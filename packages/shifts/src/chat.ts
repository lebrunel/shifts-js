import { createNanoEvents, type Unsubscribe } from 'nanoevents'
import { useConfig } from '@config'
import type { ChatEvents } from '@events'
import type { LLM } from '@llm'
import type { Tool } from '@tool'

export class Chat {
  #events = createNanoEvents<ChatEvents>()
  llm: LLM;
  system?: string;
  messages: ChatMessage[] = [];
  tools: Tool[];

  constructor(params: ChatInitParams & ChatEventHandlers = {}) {
    const $config = useConfig()

    this.system = params.system
    this.tools = params.tools || []
    this.llm = params.llm || $config.defaultLLM()

    this.llm.on('content', e => {
      const index = this.messages.length
      this.#events.emit('message_delta', { ...e, index }, this)
    })

    if (params.onMessage) { this.on('message', params.onMessage) }
    if (params.onMessageDelta) { this.on('message_delta', params.onMessageDelta) }

    if (params.prompt) {
      this.addMessage({ role: 'user', content: params.prompt })
    }
  }

  get status(): ChatStatus {
    if (!this.messages.length) return ChatStatus.Pending
    return this.messages.at(-1)?.role === 'user' ? ChatStatus.Ready : ChatStatus.Complete
  }

  get input(): string {
    if (!this.messages.length) throw new Error('no messages') // todo better error
    return this.messages.at(0)!.content
  }

  get output(): string {
    if (this.status !== ChatStatus.Complete) throw new Error('not complete') // todo better error
    return this.messages.at(-1)!.content
  }

  addMessage(message: ChatMessage): this {
    if (message.role === 'user' && this.status === ChatStatus.Ready) {
      throw new Error('expecting chatbot message') // todo better error
    } else if (message.role === 'chatbot' && this.status !== ChatStatus.Ready) {
      throw new Error('expecting user message') // todo better error
    }

    this.messages.push(message)
    this.#events.emit('message', message, this)
    return this
  }

  async generateNextMessage(): Promise<this> {
    if (this.status !== ChatStatus.Ready) {
      throw new Error('chat not ready') // todo better error
    }
    const message = await this.llm.generateNextMessage({
      system: this.system,
      messages: this.messages,
      tools: this.tools,
    })
    return this.addMessage(message)
  }

  async handleToolUse(): Promise<this> {
    if (this.status !== ChatStatus.Complete) {
      throw new Error('chat not complete') // todo better error
    }
    const lastMsg = this.messages.at(-1)
    if (lastMsg && lastMsg.role === 'chatbot' && lastMsg.tools?.length) {
      const nextMsg: ChatUserMessage = { role: 'user', content: '', tools: [] }
      for (const toolUse of lastMsg.tools) {
        const tool = this.tools.find(t => t.name === toolUse.name)
        if (tool) {
          const output = await tool.invoke(toolUse.input)
          nextMsg.tools!.push({ id: toolUse.id, name: toolUse.name, output })
        } else {
          console.error(`tool not found for tool_use: ${toolUse.name}`)
        }
      }

      this.addMessage(nextMsg)
      await this.generateNextMessage()
      return this.handleToolUse()
    } else {
      return this
    }
  }

  on<K extends keyof ChatEvents>(
    event: K,
    handler: ChatEvents[K]
  ) : Unsubscribe {
    return this.#events.on(event, handler)
  }
}

export enum ChatStatus {
  Pending,
  Ready,
  Complete,
}

// Types

export interface ChatInitParams {
  llm?: LLM;
  system?: string;
  prompt?: string;
  tools?: Tool[];
}

export interface ChatEventHandlers {
  onMessage?: ChatEvents['message'];
  onMessageDelta?: ChatEvents['message_delta'];
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
