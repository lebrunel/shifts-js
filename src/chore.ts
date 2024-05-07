import { Chat } from '@chat'

export class Chore {
  task: string;
  output?: string;
  context?: string;
  //tools: Tool[];
  //worker?: Worker;
  //llm?: LLM;

  constructor(init: ChoreParams) {
    this.task = init.task
    this.output = init.output
    this.context = init.context
  }

  async exec(): Promise<Chat> {
    return new Chat()
  }

  prompt(): string {
    const chunks = [this.task]
    if (this.context) chunks.push(`This is the context you're working with:\n${this.context}`)
    if (this.output) chunks.push(`This is the expected output for your final answer: ${this.output}`)
    return chunks.join('\n\n')
  }
}

export interface ChoreParams {
  task: string;
  output?: string;
  context?: string;
  //tools?: Tool[];
  //worker?: Worker;
  //llm?: LLM;
}