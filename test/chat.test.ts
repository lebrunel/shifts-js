import { beforeEach, describe, expect, mock, test, type Mock } from 'bun:test'
import { sumTool } from './support/tools'
import { mock as m, anthropicAsyncGen } from './support/mocking'
import { Chat, type ChatMessage, ChatStatus } from '@chat'
import { LLMAdapter } from '@llm'
import { AnthropicLLM, useAnthropic } from '@llms/anthropic'
import { defineTool } from '@tool'

const llm = useAnthropic({
  model: 'claude-3-haiku-20240307',
  stream: true
}, {
  fetch: m.fetch
})

function setupMock() {
  m.response(anthropicAsyncGen({
    id: "msg_01YNpZt8R398nui7m9vF7Kro",
    type: "message",
    role: "assistant",
    model: "claude-3-haiku-20240307",
    stop_sequence: null,
    usage: {
      input_tokens: 13,
      output_tokens: 29,
    },
    content: [
      {
        type: "text",
        text: "Feline grace and charm,\nPurring softly by the fire,\nCats, masters of poise.",
      }
    ],
    stop_reason: "end_turn",
  }))
}

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
      llm
    })
    expect(chat.system).toEqual('a')
    expect(chat.messages).toBeArrayOfSize(1)
    expect(chat.tools).toBeArrayOfSize(1)
    expect(chat.llm).toBeInstanceOf(AnthropicLLM)
  })

  test('new with event handlers', async () => {
    setupMock()
    let onMessage = mock(() => {})
    let onMessageDelta = mock(() => {})

    const chat = new Chat({
      llm,
      onMessage,
      onMessageDelta,
    })

    chat.addMessage({ role: 'user', content: 'Write a haiku about cats' })
    await chat.generateNextMessage()
    expect(onMessage).toBeCalledTimes(2)
    expect(onMessageDelta).toBeCalledTimes(15)
  })
})

describe('Chat getters', () => {
  test('#status is complete when not waiting for a response', () => {
    const chat = new Chat()
    expect(chat.status).toEqual(ChatStatus.Pending)
    chat.addMessage({ role: 'user', content: 'a' })
    expect(chat.status).toEqual(ChatStatus.Ready)
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
  let chat: Chat
  let onMessage: Mock<() => void>
  let onMessageDelta: Mock<() => void>
  beforeEach(() => {
    onMessage = mock(() => {})
    onMessageDelta = mock(() => {})
    chat = new Chat({ onMessage, onMessageDelta })
  })

  test('pushes a message onto stack', () => {
    expect(chat.messages).toBeArrayOfSize(0)
    chat.addMessage({ role: 'user', content: 'Write a haiku about cats' })
    expect(chat.messages).toBeArrayOfSize(1)
  })

  test('emits and event', () => {
    chat.addMessage({ role: 'user', content: 'Write a haiku about cats' })
    expect(onMessage).toBeCalledTimes(1)
  })

  test('throws when pushing an unexpected message role', () => {
    expect(() => chat.addMessage({ role: 'chatbot', content: 'cant be first' })).toThrow()
    chat.addMessage({ role: 'user', content: 'first message' })
    expect(() => chat.addMessage({ role: 'user', content: 'must be chatbot' })).toThrow()
    chat.addMessage({ role: 'chatbot', content: 'reply 1' })
    expect(() => chat.addMessage({ role: 'chatbot', content: 'must be user' })).toThrow()
    chat.addMessage({ role: 'user', content: 'reply 2' })
    expect(chat.messages).toBeArrayOfSize(3)
  })
})

describe('Chat#generatNextMessage()', () => {
  let chat: Chat
  beforeEach(() => {
    setupMock()
    chat = new Chat({ llm, prompt: 'Write a haiku about cats' })
  })

  test('uses LLM to generate a new chatbot response', async () => {
    expect(chat.messages).toBeArrayOfSize(1)
    await chat.generateNextMessage()
    expect(chat.messages).toBeArrayOfSize(2)
    expect(chat.output).toEqual("Feline grace and charm,\nPurring softly by the fire,\nCats, masters of poise.")
  })

  test('throws error if chatbot response is already present', async () => {
    await chat.generateNextMessage()
    setupMock()
    expect(() => chat.generateNextMessage()).toThrow('chat not ready')
  })
})

describe('Chat#handleToolUse()', () => {
  let chat: Chat
  beforeEach(() => {
    const llm = useAnthropic({ model: 'claude-3-haiku-20240307' }, { fetch: m.fetch })
    const dateTool = defineTool({
      name: 'date_tool',
      description: "Returns today's the date in ISO-8601 format",
      params: {},
      handler: (_args) => '2024-05-13',
    })
    chat = new Chat({
      tools: [dateTool],
      llm
    })
  })

  test('uses the chat tools when the LLM requests', async () => {
    chat.addMessage({ role: 'user', content: 'What is the date today?' })
    chat.addMessage({ role: 'chatbot', content: '', tools: [{
      id: "toolu_01BaWLBNunUdmqDBgJVUj8cc",
      name: "date_tool",
      input: {},
    }] })
    expect(chat.messages).toBeArrayOfSize(2)

    m.response({
      id: "msg_017tXeh3z17Bo4H5o1jPwutx",
      type: "message",
      role: "assistant",
      model: "claude-3-haiku-20240307",
      stop_sequence: null,
      usage: {
        input_tokens: 381,
        output_tokens: 16,
      },
      content: [
        {
          type: "text",
          text: "The date today is 2024-05-13.",
        }
      ],
      stop_reason: "end_turn",
    })

    await chat.handleToolUse()
    expect(chat.messages).toBeArrayOfSize(4)
    expect(chat.output).toEqual('The date today is 2024-05-13.')
  })

  test('returns with NOOP if no tool calls are requested', async () => {
    chat.addMessage({ role: 'user', content: 'What is the date today?' })
    chat.addMessage({ role: 'chatbot', content: "The date today is 2024-05-13." })
    expect(chat.messages).toBeArrayOfSize(2)
    await chat.handleToolUse()
    expect(chat.messages).toBeArrayOfSize(2)
  })

  test('throws error if chatbot response is not present', () => {
    chat.addMessage({ role: 'user', content: 'What is the date today?' })
    expect(() => chat.handleToolUse()).toThrow('chat not complete')
  })
})

describe('Chat#on()', () => {
  test('attaches event handlers', async () => {
    setupMock()
    const chat = new Chat({ llm })
    let onMessage = mock(() => {})
    let onMessageDelta = mock(() => {})
    chat.on('message', onMessage)
    chat.on('message_delta', onMessageDelta)
    chat.addMessage({ role: 'user', content: 'Write a haiku about cats' })
    await chat.generateNextMessage()

    expect(onMessage).toBeCalledTimes(2)
    expect(onMessageDelta).toBeCalledTimes(15)
  })
})