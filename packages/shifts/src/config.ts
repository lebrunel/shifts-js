import { merge } from "ts-deepmerge"
import { type LLM } from "@llm"
import { useAnthropic } from "@llms/anthropic"

export interface Config {
  apiKeys: { [name: string]: string };
  defaultLLM: () => LLM;
}

let $config: Config = {
  apiKeys: {},
  defaultLLM: () => useAnthropic({ model: "claude-3-haiku-20240307" }),
}

export function configure(config: Partial<Config>): void {
  $config = merge($config, config as Config)
}

export function useConfig(): Config {
  try {
    return { ...$config }
  } catch(e) {
    if (e instanceof ReferenceError) {
      throw new Error('Config module has not been fully initialized. Avoid calling `useConfig` at the global or root level directly during the module import phase.')
    } else {
      throw e
    }
  }
}
