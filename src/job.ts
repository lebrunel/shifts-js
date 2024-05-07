import { Chat } from '@chat'
import { Chore } from '@chore'
import type { Shift } from '@shift'

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
    return this.executionTape.find(ex => ex.name === name)
  }

  findAll(name: string): Chat[] {
    return this.executionTape.filter(ex => ex.name === name)
  }

  findLast(name: string): Chat | undefined {
    return this.executionTape.findLast(ex => ex.name === name)
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

  private async callAfterHooks(name: string): Promise<void> {
    for (const hook of this.shift.getAfterHooks(name)) {
      await hook(this)
    }
  }

  private getChore(name: string): Chore {
    const choreInit = this.shift.getChore(name)(this)
    if (choreInit instanceof Chore) { return choreInit }
    else if (typeof choreInit === 'string') { return new Chore({ task: choreInit }) }
    else { return new Chore(choreInit) }
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