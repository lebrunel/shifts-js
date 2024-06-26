import { Chat, type ChatEventHandlers } from '@chat'
import type { LLM } from '@llm'
import type { Tool } from '@tool'
import type { Worker } from "@worker"

export class Chore {
  task: string;
  output?: string;
  context?: string;
  tools: Tool[];
  worker?: Worker;
  llm?: LLM;

  constructor(params: ChoreParams) {
    this.task = params.task
    this.output = params.output
    this.context = params.context
    this.tools = params.tools || []
    this.worker = params.worker
    this.llm = params.llm
  }

  async exec(params: ChatEventHandlers = {}): Promise<Chat> {
    const chat = new Chat({
      ...params,
      llm: this.worker?.llm || this.llm,
      system: this.worker?.prompt(),
      prompt: this.prompt(),
      tools: this.worker?.tools.concat(this.tools) || this.tools,
    })

    await chat.generateNextMessage()
    await chat.handleToolUse()
    return chat
  }

  prompt(): string {
    const chunks = [this.task]
    if (this.context) chunks.push(`This is the context you're working with:\n${this.context}`)
    if (this.output) chunks.push(`This is the expected output for your final answer: ${this.output}`)
    return chunks.join('\n\n')
  }
}

// Types

export interface ChoreParams {
  task: string;
  output?: string;
  context?: string;
  tools?: Tool[];
  worker?: Worker;
  llm?: LLM;
}