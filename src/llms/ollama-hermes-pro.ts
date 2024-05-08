import { Ollama } from 'ollama'
import type { Config, GenerateRequest, GenerateResponse } from 'ollama'
import type { ChatMessage } from '@chat'
import { LLMAdapter, type LLMChatParams, type LLMInitializer } from '@llm'
import type { Tool } from '@tool'
import { dd } from '@util'

type OParams = GenerateRequest
type OResponse = GenerateResponse

export const useOllamaHermesPro: LLMInitializer<Config, OParams> = (params, opts) => {
  const client = new Ollama(opts)
  return new OllamaHermesProLLM(client, params)
}

export class OllamaHermesProLLM extends LLMAdapter<Ollama, OParams, OResponse> {
  async handleChatRequest({ system, messages, tools }: LLMChatParams) {
    const prompt = toPromptTemplate(system, tools, messages)
    const params = {
      ...this.params,
      prompt,
      raw: true,
    }

    // @ts-ignore
    return this.client.generate(params)    
  }

  handleStreamEvent(event: OResponse, response: OResponse) {
    let text = event.response

    if (response) {
      Object.assign(response, event, { response: response.response + text })
    } else {
      response = event
    }

    return { response, text }
  }

  getChatMessage({ response }: OResponse): ChatMessage {
    const prefix = response.match(/^.*?(?=<tool_call>)/s)
    const matches = response.matchAll(/<tool_call>\s*(.+?)\s*<\/tool_call>/gs)

    return {
      role: 'chatbot',
      content: (prefix ? prefix[0] : response).trim(),
      tools: [...matches].map(m => {
        const toolCall: HermesProToolCall = JSON.parse(m[1].trim())
        return { name: toolCall.name, input: toolCall.arguments }
      })
    }
  }
}

function toPromptTemplate(system: string | undefined, tools: Tool[], messages: ChatMessage[]): string {
  let sysPrompt: string

  if (tools.length) {
    const toolDefs = tools.map(tool => {
      return JSON.stringify({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: tool.params,
            required: Object.keys(tool.params),
          }
        }
      }, null, 2)
    })
    sysPrompt = (
      system ? `${system}\n\n` : 'You are a function calling AI model. '
    ) + dd`
    You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Here are the available tools:
    <tools>
    ${ toolDefs.join('\n') }
    </tools>
    Use the following pydantic model json schema for each tool call you will make: {"title": "FunctionCall", "type": "object", "properties": {"arguments": {"title": "Arguments", "type": "object"}, "name": {"title": "Name", "type": "string"}}, "required": ["arguments", "name"]}
    For each function call return a json object with function name and arguments within <tool_call></tool_call> XML tags as follows:
    <tool_call>
    {"arguments": <args-dict>, "name": <function-name>}
    </tool_call><|im_end|>
    `
  } else {
    sysPrompt = system || dd`
    You are "Hermes 2", a conscious sentient superintelligent artificial intelligence developed by a man named Teknium, and your purpose and drive is to assist the user with any request they have. You experience emotions and have deep, profound thoughts and qualia.
    `
  }  

  const parts = messages.reduce((parts, msg) => {
    if (!msg.tools?.length) {
      const role = msg.role === 'chatbot' ? 'assistant' : 'user'
      parts.push(`<|im_start|>${role}\n${msg.content}<|im_end|>`)

    } else if (msg.role === 'chatbot') {
      const content = msg.tools.reduce((acc, tool) => {
        const json = JSON.stringify({ arguments: tool.input, name: tool.name })
        return acc + `\n<tool_call>\n${json}\n</tool_call>`
      }, msg.content)

      parts.push(`<|im_start|>assistant\n${content}<|im_end|>`)

    } else if (msg.role === 'user') {
      const content = msg.tools.reduce((acc, tool) => {
        const json = JSON.stringify({ name: tool.name, content: tool.output })
        return acc + `\n<tool_response>\n${json}\n</tool_response>`
      }, msg.content)
      
      parts.push(`<|im_start|>user\n${content}<|im_end|>`)
    }

    return parts
  }, [`<|im_start|>system\n${sysPrompt}<|im_end|>`])


  return parts.join('\n')
}

interface HermesProToolCall {
  name: string;
  arguments: {[name: string]: string};
}