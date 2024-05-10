import { describe, expect, test } from 'bun:test'
import { sumTool } from './support/tools'
import { Chore } from '@chore'
import { Worker } from '@worker'
import { OllamaHermesProLLM, useOllamaHermesPro } from '@llms/ollama-hermes-pro'

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
  // todo - need to mock these tests
  test.todo('returns a completed chat chat')
  test.todo('attached event handlers')
})
