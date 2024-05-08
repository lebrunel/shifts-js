import { describe, expect, test } from 'bun:test'
import { Worker } from '@worker'

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

  test.todo('worker with tools')
  test.todo('worker with llm')
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
