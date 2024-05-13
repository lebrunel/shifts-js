import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { sumTool } from './support/tools'
import { mock as m, anthropicAsyncGen } from './support/mocking'
import { Chore } from '@chore'
import { Worker } from '@worker'
import { OllamaHermesProLLM, useOllamaHermesPro } from '@llms/ollama-hermes-pro'
import { useAnthropic } from '@llms/anthropic'
import { ChatStatus, type ChatMessage } from '@chat'

describe('Chore()', () => {
  test('new with defaults', () => {
    const chore = new Chore({ task: 'a' })

    expect(chore.task).toEqual('a')
    expect(chore.output).toBeUndefined()
    expect(chore.context).toBeUndefined()
    expect(chore.tools).toBeEmpty()
    expect(chore.worker).toBeUndefined()
    expect(chore.llm).toBeUndefined()
  })

  test('chore with full params', () => {
    const worker = new Worker({ role: 'a', goal: 'b' })
    const chore = new Chore({
      task: 'a',
      output: 'b',
      context: 'c',
      tools: [sumTool],
      worker: worker,
      llm: useOllamaHermesPro({ model: 'nous-hermes-pro' }),
    })

    expect(chore.output).toEqual('b')
    expect(chore.context).toEqual('c')
    expect(chore.tools).toBeArrayOfSize(1)
    expect(chore.tools[0]).toEqual(sumTool)
    expect(chore.worker).toEqual(worker)
    expect(chore.llm).toBeInstanceOf(OllamaHermesProLLM)
  })
})

describe('Chore#prompt()', () => {
  test('just task', () => {

    const chore = new Chore({
      task: 'a',
    })

    expect(chore.prompt()).toEqual('a')
  })

  test('with output', () => {
    const chore = new Chore({
      task: 'a',
      output: 'b',
    })

    expect(chore.prompt()).toMatch(/^a\n\nThis is the expected output.+: b$/)
  })

  test('with output and context', () => {
    const chore = new Chore({
      task: 'a',
      output: 'b',
      context: 'c',
    })

    expect(chore.prompt()).toMatch(/^a\n\nThis is the context.+:\nc\n\nThis is the expected output.+: b$/)
  })
})

describe('Chore#exec()', () => {
  const llm = useAnthropic({
    model: 'claude-3-haiku-20240307',
    stream: true
  }, {
    fetch: m.fetch
  })

  beforeEach(() => {
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
  })

  // todo - need to mock these tests
  test('returns a completed chat chat', async () => {
    const chore = new Chore({
      task: 'Write a haiku about cats',
      llm
    })
    const chat = await chore.exec()
    expect(chat.status).toEqual(ChatStatus.Complete)
    expect(chat.output).toEqual("Feline grace and charm,\nPurring softly by the fire,\nCats, masters of poise.")
  })

  test('attached event handlers', async () => {
    const chore = new Chore({
      task: 'Write a haiku about cats',
      llm
    })

    const onMessage = mock(() => {})
    const onMessageDelta = mock(() => {})

    await chore.exec({
      onMessage,
      onMessageDelta,
    })

    expect(onMessage).toBeCalledTimes(2)
    expect(onMessageDelta).toBeCalledTimes(15)
  })
})
