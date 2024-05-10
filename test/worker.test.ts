import { describe, expect, test } from 'bun:test'
import { sumTool } from './support/tools'
import { Worker } from '@worker'
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

  test('worker with full params', () => {
    const worker = new Worker({
      role: 'a',
      goal: 'b',
      story: 'c',
      tools: [sumTool],
      llm: useOllamaHermesPro({ model: 'nous-hermes-pro' }),
    })

    expect(worker.story).toEqual('c')
    expect(worker.tools).toBeArrayOfSize(1)
    expect(worker.tools[0]).toEqual(sumTool)
    expect(worker.llm).toBeInstanceOf(OllamaHermesProLLM)
  })
})

describe('Worker#prompt()', () => {
  test('without story', () => {

    const worker = new Worker({
      role: 'a',
      goal: 'b',
      story: 'c',
    })

    expect(worker.prompt()).toMatch(/^Your role.+a\.\nc\n\nYour.+goal: b$/)
  })

  test('with story', () => {
    const worker = new Worker({
      role: 'a',
      goal: 'b',
    })

    expect(worker.prompt()).toMatch(/^Your role.+a\.\n\nYour.+goal: b$/)
  })
})
