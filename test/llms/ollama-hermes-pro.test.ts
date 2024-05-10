import { beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { OllamaHermesProLLM, useOllamaHermesPro } from '@llms/ollama-hermes-pro'
import { Chat } from '@chat'
import { mock } from '../support/mocking'

describe('OllamaHermesPro', () => {
  let llm: OllamaHermesProLLM,
      chat: Chat;

  beforeAll(() => {
    llm = useOllamaHermesPro({ model: 'nous-hermes-pro' }, { fetch: mock.fetch })
  })

  beforeEach(() => {
    chat = new Chat({ llm, prompt: 'Hello Hermes.' })
    mock.response({
      model: "nous-hermes-pro",
      created_at: "2024-04-24T18:33:25.172791Z",
      response: " \n\nI am feeling rather down today. Can you cheer me up?",
      done: true,
      total_duration: 2880877667,
      load_duration: 2173828084,
      prompt_eval_count: 72,
      prompt_eval_duration: 262439000,
      eval_count: 17,
      eval_duration: 443511000,
    })
  })

  test('generateNextMessage() returns an llm response', async () => {
    const msg = await llm.generateNextMessage(chat)
    expect(msg.role).toEqual('chatbot')
    expect(msg.content).toEqual("I am feeling rather down today. Can you cheer me up?")
  })
})