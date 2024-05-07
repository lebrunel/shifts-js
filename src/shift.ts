import { Job } from './job'
import { Chore, type ChoreParams } from './chore'

export class Shift<J extends JobInputMap = any> {
  #afterHooks: Map<string, Array<JobCallback<J[keyof J]>>> = new Map();
  #chores: Map<string, ChoreInitFn<J[keyof J]>> = new Map();
  #jobs: Map<keyof J, JobSetup<J[keyof J]>> = new Map();

  defineJob<T extends J[keyof J], N extends keyof J & string>(name: N, jobStartFn: JobCallback<T>): void {
    if (this.#jobs.has(name)) { throw new Error('duplicate job name') } // todo better error
    this.#jobs.set(name, {
      init: (input: T) => new Job(this, input),
      start: jobStartFn,
    })
  }

  defineChore<T extends J[keyof J]>(name: string, choreInitFn: ChoreInitFn<T>): void {
    if (this.#chores.has(name)) { throw new Error('duplicate job name') } // todo better error
    this.#chores.set(name, choreInitFn)
  }

  afterExec<T extends J[keyof J]>(name: string, afterExecFn: JobCallback<T>): void {
    if (!this.#chores.has(name)) { throw new Error('chore not defined') } // todo better error
    const hooks = this.#afterHooks.get(name) || []
    hooks.push(afterExecFn)
    this.#afterHooks.set(name, hooks)
  }

  getChore<T extends J[keyof J]>(name: string, job: Job<T>): Chore {
    if (!this.#chores.has(name)) { throw new Error('chore not defined') } // todo better error
    const choreInit = this.#chores.get(name)!(job)
    if (choreInit instanceof Chore) { return choreInit }
    else if (typeof choreInit === 'string') { return new Chore({ task: choreInit }) }
    else { return new Chore(choreInit) }
  }

  startJob<N extends keyof J>(name: N, input: J[N]): Job<J[N]> {
    if (!this.#jobs.has(name)) { throw new Error('job not defined') } // todo better error
    const config = this.#jobs.get(name)!
    const job = config.init(input) as Job<J[N]>
    config.start(job)
    return job
  }
}

// Types

interface JobInputMap {
  [key: string]: any;
}

interface JobSetup<T> {
  init: (input: T) => Job<T>;
  start: JobCallback<T>;
}

type JobCallback<T> = (job: Job<T>) => void
type ChoreInitFn<T> = (job: Job<T>) => string | ChoreParams | Chore
