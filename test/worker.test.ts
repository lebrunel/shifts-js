import { describe, expect, test } from 'bun:test'
import { Worker } from '@worker'
import { defineTool } from '@tool'
import { OllamaHermesProLLM, useOllamaHermesPro } from '@llms/ollama-hermes-pro'

describe('Worker()', () => {
  test('new with defaults', () => {
    const worker = new Worker({
      role: 'a',
      goal: 'b',
    })

    expect(worker.role).toEqual('a')
    expect(worker.goal).toEqual('b')
    expect(worker.story).toBeUndefined()
    expect(worker.tools).toBeEmpty()
    expect(worker.llm).toBeUndefined()
  })

  test('worker with tools', () => {
    const tool = defineTool<{
      a: number;
      b: number;
    }>({
      name: 'sum',
      description: 'test',
      params: {
        a: { type: 'number', description: 'test' },
        b: { type: 'number', description: 'test' },
      },
      handler({ a, b }) {
        return (a + b).toString()
      }
    })
    const worker = new Worker({
      role: 'a',
      goal: 'b',
      tools: [tool]
    })

    expect(worker.tools).toBeArrayOfSize(1)
    expect(worker.tools[0]).toEqual(tool)
  })

  test('worker with llm', () => {
    const worker = new Worker({
      role: 'a',
      goal: 'b',
      llm: useOllamaHermesPro({ model: 'nous-hermes-pro' })
    })

    expect(worker.llm).toBeInstanceOf(OllamaHermesProLLM)
  })
})

describe('workerPrompt()', () => {
  test('with story', () => {

    const worker = new Worker({
      role: 'a',
      goal: 'b',
      story: 'c',
    })

    expect(worker.prompt()).toMatch(/^Your role.+a\.\nc\n\nYour.+goal: b$/)
  })

  test('without story', () => {
    const worker = new Worker({
      role: 'a',
      goal: 'b',
    })

    expect(worker.prompt()).toMatch(/^Your role.+a\.\n\nYour.+goal: b$/)
  })
})
