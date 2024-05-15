import { createNanoEvents, type Unsubscribe } from 'nanoevents'
import { Chat } from '@chat'
import { Chore } from '@chore'
import type { JobEvents } from '@events'
import type { Shift } from '@shift'
import { Worker } from '@worker'


export class Job<T> {
  #events = createNanoEvents<JobEvents<T>>();
  #status: JobStatus = JobStatus.Pending;
  readonly promise: Promise<Job<T>>;
  readonly executionTape: JobExecution[] = [];

  constructor(readonly shift: Shift, readonly input: T) {
    this.promise = new Promise((resolve, reject) => {
      this.on('success', resolve)
      this.on('failure', reject)
    })
  }

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
    this.#events.emit('success', this)
  }

  async exec(name: string): Promise<Chat> {
    const chore = this.getChore(name)
    const index = this.executionTape.length
    const chat = await chore.exec({
      onMessage: (message, chat) => {
        this.#events.emit('chat.message', { name, index, message, chat }, this)
      },
      onMessageDelta: (event, chat) => {
        const { text, snapshot } = event
        this.#events.emit('chat.message_delta', { name, index, text, snapshot, chat }, this)
      },
    })
    this.executionTape.push({ name, chat })
    this.#events.emit('chat.success', { name, index, chat }, this)
    await this.callAfterHooks(name)
    return chat
  }

  worker(name: string): Worker {
    return this.getWorker(name)
  }

  on<K extends keyof JobEvents<T>>(
    event: K,
    handler: JobEvents<T>[K]
  ) : Unsubscribe {
    return this.#events.on(event, handler)
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