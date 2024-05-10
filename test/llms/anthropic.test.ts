import { beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { Anthropic as A } from '@anthropic-ai/sdk'
import { AnthropicLLM, useAnthropic } from '@llms/anthropic'
import { Chat } from '@chat'
import { mock } from '../support/mocking'

async function* asyncGen(message: A.Message): AsyncGenerator<A.MessageStreamEvent> {
  yield { type: 'message_start', message: { ...message, content: [], stop_reason: null, stop_sequence: null } }
  
  for (let idx = 0; idx < message.content.length; idx++) {
    const content = message.content[idx]!;
    yield { type: 'content_block_start', index: idx, content_block: { type: content.type, text: '' } }
    for (let chunk = 0; chunk * 5 < content.text.length; chunk++) {
      yield { type: 'content_block_delta', index: idx, delta: { type: 'text_delta', text: content.text.slice(chunk * 5, (chunk + 1) * 5) } }
    }
    yield { type: 'content_block_stop', index: idx }
  }

  yield { type: 'message_delta', delta: { stop_reason: message.stop_reason, stop_sequence: message.stop_sequence }, usage: { output_tokens: 6 } }
  yield { type: 'message_stop' }
}

describe('Anthropic', () => {
  let llm: AnthropicLLM,
      chat: Chat;

  beforeAll(() => {
    llm = useAnthropic({ model: 'claude-3-haiku-20240307', stream: true }, { fetch: mock.fetch })
  })

  beforeEach(() => {
    chat = new Chat({ llm, prompt: 'Hello Claude.' })
    mock.response(asyncGen({
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