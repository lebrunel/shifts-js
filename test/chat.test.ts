import { beforeEach, describe, expect, test } from 'bun:test'
import { sumTool } from './support/tools'
import { Chat, ChatStatus } from '@chat'
import { LLMAdapter } from '@llm'
import { OllamaHermesProLLM, useOllamaHermesPro } from '@llms/ollama-hermes-pro'

describe('Chat()', () => {
  test('new with defaults', () => {
    const chat = new Chat()
    expect(chat.system).toBeUndefined()
    expect(chat.messages).toBeArrayOfSize(0)
    expect(chat.tools).toBeArrayOfSize(0)
    expect(chat.llm).toBeInstanceOf(LLMAdapter)
  })

  test('new with full params', () => {
    const chat = new Chat({
      system: 'a',
      prompt: 'b',
      tools: [sumTool],
      llm: useOllamaHermesPro({ model: 'nous-hermes2-pro' }),
    })
    expect(chat.system).toEqual('a')
    expect(chat.messages).toBeArrayOfSize(1)
    expect(chat.tools).toBeArrayOfSize(1)
    expect(chat.llm).toBeInstanceOf(OllamaHermesProLLM)
  })

  test.todo('new with event handlers')
})

describe('Chat getters', () => {
  test('#status is complete when not waiting for a response', () => {
    const chat = new Chat()
    expect(chat.status).toEqual(ChatStatus.Pending)
    chat.addMessage({ role: 'user', content: 'a' })
    expect(chat.status).toEqual(ChatStatus.Pending)
    chat.addMessage({ role: 'chatbot', content: 'a' })
    expect(chat.status).toEqual(ChatStatus.Complete)
  })

  test('#input returns contents of first message', () => {
    const chat = new Chat()
    expect(() => chat.input).toThrow()
    chat.addMessage({ role: 'user', content: 'a' })
    expect(chat.input).toEqual('a')
  })

  test('#output returns contents of last chatbot response', () => {
    const chat = new Chat({ prompt: 'a' })
    expect(() => chat.output).toThrow()
    chat.addMessage({ role: 'chatbot', content: 'b' })
    expect(chat.output).toEqual('b')
  })
})

describe('Chat#addMessage()', () => {
  test.todo('pushes a message onto stack')
  test.todo('emits and event')
  test.todo('throws when pushing an unexpected message role')
})

describe('Chat#generatNextMessage()', () => {
  test.todo('uses LLM to generate a new chatbot response')
  test.todo('throws error if chatbot response is already present')
})

describe('Chat#handleToolUse()', () => {
  test.todo('uses the chat tools when the LLM requests')
  test.todo('returns with NOOP if no tool calls are requested')
  test.todo('throws error if chatbot response is not present')
})

describe('Chat#on()', () => {
  test.todo('attaches event handlers')
})