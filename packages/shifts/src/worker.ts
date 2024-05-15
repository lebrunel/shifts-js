import type { LLM } from '@llm'
import type { Tool } from '@tool'
import { dd } from '@util'

export class Worker {
  role: string;
  goal: string;
  story?: string;
  tools: Tool[];
  llm?: LLM;

  constructor(params: WorkerParams) {
    this.role = params.role,
    this.goal = params.goal,
    this.story = params.story,
    this.tools = params.tools || [],
    this.llm = params.llm
  }

  prompt() {
    return dd`
    Your role is ${this.role}.
    ${this.story ? `${this.story}\n` : ''}
    Your personal goal: ${this.goal}
    `
  }
}

// Types

export interface WorkerParams {
  role: string;
  goal: string;
  story?: string;
  tools?: Tool[];
  llm?: LLM;
}