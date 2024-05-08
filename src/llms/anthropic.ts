import { Anthropic as A, type ClientOptions } from '@anthropic-ai/sdk'
import { useConfig } from '@config'
import { LLMAdapter, type LLMChatParams, type LLMInitializer } from '@llm'
import type { ChatBotMessage, ChatMessage } from '@chat'
import type { Tool } from '@tool'

type AParams = A.Beta.Tools.MessageCreateParams
type AResponse = A.Beta.Tools.ToolsBetaMessage

export const useAnthropic: LLMInitializer<ClientOptions, Partial<AParams>> = (params, opts) => {
  const $config = useConfig()
  const apiKey = $config.apiKeys.anthropic
  const client = new A({ apiKey, ...opts })
  return new AnthropicLLM(client, { max_tokens: 1024, ...params })
}

export class AnthropicLLM extends LLMAdapter<A, AParams, AResponse> {
  async handleChatRequest({ system, messages, tools }: LLMChatParams) {
    return this.client.beta.tools.messages.create({
      ...this.params,
      system,
      messages: messages.map(toMessageParam),
      tools: tools.map(toToolParam),
    } as AParams)
  }

  handleStreamEvent(event: A.MessageStreamEvent, response: A.Message) {
    let text: string | undefined

    switch(event.type) {
      case 'message_start':
        response = event.message
        break
      case 'content_block_start':
        response.content[event.index] = event.content_block
        break
      case 'content_block_delta':
        text = event.delta.text
        response.content[event.index].text += event.delta.text
        break
      case 'message_delta':
        Object.assign(response, event.delta)
        Object.assign(response.usage, event.usage)
        break
    }

    return { response, text }
  }

  getChatMessage(response: AResponse): ChatMessage {
    return response.content.reduce<ChatBotMessage>((msg, block) => {
      if (block.type === 'text') {
        msg.content = block.text
      } else if (block.type === 'tool_use') {
        msg.tools?.push({
          id: block.id,
          name: block.name,
          input: block.input as any,
        })
      }
      return msg
    }, { role: 'chatbot', content: '', tools: [] })
  }
}

function toMessageParam(msg: ChatMessage): A.Beta.Tools.ToolsBetaMessageParam {
  const content: Array<A.TextBlockParam | A.Beta.Tools.ToolUseBlockParam | A.Beta.Tools.ToolResultBlockParam> = []

  if (msg.content.length) {
    content.push({ type: 'text', text: msg.content })
  }
  if (msg.role === 'chatbot') {
    msg.tools?.forEach(block => {
      content.push({ type: 'tool_use', id: block.id!, name: block.name, input: block.input })
    })
    return { role: 'assistant', content }
  } else {
    msg.tools?.forEach(block => {
      content.push({ type: 'tool_result', tool_use_id: block.id!, content: [
        { type: 'text', text: block.output }
      ]})
    })
    return { role: 'user', content }
  }
}

function toToolParam(tool: Tool): A.Beta.Tools.Tool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties: tool.params,
      required: Object.keys(tool.params)
    }
  }
}