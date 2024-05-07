import { Job } from './job'
import { Chore, type ChoreParams } from './chore'

export class Shift<K extends JobInputMap = any> {
  #chores: Map<string, ChoreInitFn<K[keyof K]>> = new Map();
  #jobs: Map<keyof K, JobSetup<K[keyof K]>> = new Map();

  defineJob<T extends K[keyof K], N extends keyof K & string>(name: N, jobStartFn: JobStartFn<T>): void {
    if (this.#jobs.has(name)) { throw new Error('duplicate job name') } // todo better error
    this.#jobs.set(name, {
      init: (input: T) => new Job(this, input),
      start: jobStartFn,
    })
  }

  defineChore<T extends K[keyof K]>(name: string, choreInitFn: ChoreInitFn<T>): void {
    if (this.#chores.has(name)) { throw new Error('duplicate job name') } // todo better error
    this.#chores.set(name, choreInitFn)
  }

  getChore<T extends K[keyof K]>(name: string, job: Job<T>): Chore {
    if (!this.#chores.has(name)) { throw new Error('chore not defined') } // todo better error
    const chore = this.#chores.get(name)!(job)
    return chore instanceof Chore ? chore : new Chore(chore)
  }

  startJob<N extends keyof K>(name: N, input: K[N]): Job<K[N]> {
    if (!this.#jobs.has(name)) { throw new Error('job not defined') } // todo better error
    const config = this.#jobs.get(name)!
    const job = config.init(input) as Job<K[N]>
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
  start: JobStartFn<T>;
}

type JobStartFn<T> = (job: Job<T>) => void
type ChoreInitFn<T> = (job: Job<T>) => Chore | ChoreParams
