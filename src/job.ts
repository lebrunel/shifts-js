import { Chat } from '@chat'
import { Chore } from '@chore'
import type { Shift } from '@shift'
import { Worker } from '@worker'

export class Job<T> {
  #status: JobStatus = JobStatus.Pending;
  readonly executionTape: JobExecution[] = [];

  constructor(readonly shift: Shift, readonly input: T) {}

  get status(): JobStatus {
    return this.#status
  }

  get first(): Chat {
    if (!this.executionTape.length) throw new Error('no executions') // todo better error
    return this.executionTape.at(0)!.chat
  }

  get last(): Chat {
    if (!this.executionTape.length) throw new Error('no executions') // todo better error
    return this.executionTape.at(-1)!.chat
  }

  find(name: string): Chat | undefined {
    return this.executionTape.find(ex => ex.name === name)?.chat
  }

  findAll(name: string): Chat[] {
    return this.executionTape.filter(ex => ex.name === name).map(ex => ex.chat)
  }

  findLast(name: string): Chat | undefined {
    return this.executionTape.findLast(ex => ex.name === name)?.chat
  }

  finish(): void {
    this.#status = JobStatus.Success
  }

  async exec(name: string): Promise<Chat> {
    const chore = this.getChore(name)
    console.log(chore)
    const chat = await chore.exec()
    this.executionTape.push({ name, chat })
    await this.callAfterHooks(name)
    return chat
  }

  worker(name: string): Worker {
    return this.getWorker(name)
  }

  private async callAfterHooks(name: string): Promise<void> {
    for (const hook of this.shift.afterHooks(name)) {
      await hook(this)
    }
  }

  private getChore(name: string): Chore {
    if (!this.shift.chores.has(name)) throw new Error('chore not defined') // todo better error
    const _chore = this.shift.chores.get(name)!(this)
    if (_chore instanceof Chore) { return _chore }
    else if (typeof _chore === 'string') { return new Chore({ task: _chore }) }
    else { return new Chore(_chore) }
  }

  private getWorker(name: string): Worker {
    if (!this.shift.workers.has(name)) throw new Error('worker not defined') // todo better error
    const _worker = this.shift.workers.get(name)!(this)
    if (_worker instanceof Worker) { return _worker }
    else { return new Worker(_worker) }
  }
}

export enum JobStatus {
  Pending,
  Success,
  Failure,
}

// Types

interface JobExecution {
  name: string;
  chat: Chat;
}