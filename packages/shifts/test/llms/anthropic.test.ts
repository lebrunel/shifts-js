import { beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { AnthropicLLM, useAnthropic } from '@llms/anthropic'
import { Chat } from '@chat'
import { mock, anthropicAsyncGen } from '../support/mocking'

describe('Anthropic', () => {
  let llm: AnthropicLLM,
      chat: Chat;

  beforeAll(() => {
    llm = useAnthropic({ model: 'claude-3-haiku-20240307', stream: true }, { fetch: mock.fetch })
  })

  beforeEach(() => {
    chat = new Chat({ llm, prompt: 'Hello Claude.' })
    mock.response(anthropicAsyncGen({
      id: "msg_015S8zkpv75gaPtDJzCyiKLT",
      type: "message",
      role: "assistant",
      model: "claude-3-haiku-20240307",
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        output_tokens: 32,
      },
      content: [
        {
          type: "text",
          text: "Hello! I'm Claude, an AI assistant created by Anthropic. It's nice to meet you. How can I assist you today?",
        }
      ],
      stop_reason: "end_turn",
    }))
  })

  test('generateNextMessage() returns a chat message', async () => {
    const chunks: any[] = []
    llm.on('content', chunk => chunks.push(chunk))

    const msg = await llm.generateNextMessage(chat)
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    expect(msg.role).toEqual('chatbot')
    expect(msg.content).toEqual("Hello! I'm Claude, an AI assistant created by Anthropic. It's nice to meet you. How can I assist you today?")
  })
})