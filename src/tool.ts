export function defineTool<T = any>(params: ToolInitParams<T>): Tool<T> {
  return new Tool(params)
}

export class Tool<T = any> {
  #handler: ToolHandler<T>;
  readonly name: string;
  readonly description: string;
  readonly params: ToolParams<T>;

  constructor(params: ToolInitParams<T>) {
    this.name = params.name || this.constructor.name
    this.description = params.description
    this.params = params.params
    this.#handler = params.handler
  }

  invoke(args: T): string | Promise<string> {
    return this.#handler(args)
  }
}

// Types

export interface ToolInitParams<T> {
  name?: string;
  description: string;
  params: ToolParams<T>;
  handler: ToolHandler<T>;
}

interface ToolParam {
  type: 'string' | 'number';
  description: string;
}

type ToolParams<T> = { [key in keyof T]: ToolParam }
type ToolHandler<T> = (args: T) => string | Promise<string>