import { describe, expect, test } from 'bun:test'
import { type ChatMessage } from '@chat'
import { LLMAdapter, LLMResponse, LLMStreamResponse, type LLMChatParams, type LLMResponseUpdate } from '@llm'

describe('LLMResponse', () => {
  test('getFinalResponse() returns the full response', async () => {
    const llmRes = new LLMResponse<{foo: string}>({ foo: 'bar' })
    expect(await llmRes.getFinalResponse()).toEqual({ foo: 'bar' })
  })
})

describe('LLMStreamResponse', () => {
  async function* asyncGen(array: string[]): AsyncGenerator<string> {
    for (const item of array) {
      yield item
    }
  }

  class MyLLM extends LLMAdapter<any, any, {foo: string}> {
    handleStreamEvent(event: string, response: {foo: string}): LLMResponseUpdate<{foo: string}> {
      response.foo ||= ''
      response.foo += event
      return {
        text: event,
        response: response,
      }
    }

    async handleChatRequest(params: LLMChatParams): Promise<{foo: string} | AsyncIterable<any>> {
      throw new Error('noop')
    }

    getChatMessage(response: {foo: string}): ChatMessage {
      throw new Error('noop')
    }
    
  }

  test('getFinalResponse() returns the full response', async () => {
    const llm = new MyLLM({}, {})
    const llmRes = new LLMStreamResponse<{foo: string}>(asyncGen(['a', 'b', 'c', 'd', 'e']), llm)
    expect(await llmRes.getFinalResponse()).toEqual({foo: 'abcde' })
  })
})