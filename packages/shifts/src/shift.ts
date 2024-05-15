import { Job } from './job'
import { Chore, type ChoreParams } from './chore'
import type { Worker, WorkerParams } from '@worker';

export function defineShift<J extends ShiftJobMap = any>(
  setupShift: (ctx: ShiftSetupContext<J>
) => void): Shift<J> {
  const shift = new Shift<J>()
  setupShift({
    defineJob: (name, jobStartFn) => shift.defineJob(name, jobStartFn),
    defineChore: (name, choreInitFn) => shift.defineChore(name, choreInitFn),
    defineWorker: (name, workerInitFn) => shift.defineWorker(name, workerInitFn),
    afterExec: (name, afterExecFn) => shift.afterExec(name, afterExecFn)
  })
  return shift
}

export class Shift<J extends ShiftJobMap = any, T = J[keyof J]> {
  #afterHooks: Map<string, Array<JobCallback<T>>> = new Map();
  #jobs: Map<keyof J, JobSetup<T>> = new Map();
  chores: Map<string, ChoreInitFn<T>> = new Map();
  workers: Map<string, WorkerInitFn<T>> = new Map();

  defineJob<N extends keyof J>(name: N, jobStartFn: JobCallback<J[N]>): void {
    if (this.#jobs.has(name)) { throw new Error('duplicate job name') } // todo better error
    this.#jobs.set(name, {
      init: (input: T) => new Job(this, input),
      start: jobStartFn,
    })
  }

  defineChore(name: string, choreInitFn: ChoreInitFn<T>): void {
    if (this.chores.has(name)) { throw new Error('duplicate chore name') } // todo better error
    this.chores.set(name, choreInitFn)
  }

  defineWorker(name: string, workerInitFn: WorkerInitFn<T>): void {
    if (this.workers.has(name)) { throw new Error('duplicate chore name') } // todo better error
    this.workers.set(name, workerInitFn)
  }

  afterExec(name: string, afterExecFn: JobCallback<T>): void {
    if (!this.chores.has(name)) { throw new Error('chore not defined') } // todo better error
    const hooks = this.#afterHooks.get(name) || []
    hooks.push(afterExecFn)
    this.#afterHooks.set(name, hooks)
  }

  afterHooks(name: string): Array<JobCallback<T>> {
    if (!this.chores.has(name)) { throw new Error('chore not defined') } // todo better error
    return this.#afterHooks.get(name) || []
  }

  startJob<N extends keyof J>(name: N, input: J[N]): Job<J[N]> {
    if (!this.#jobs.has(name)) { throw new Error('job not defined') } // todo better error
    const config = this.#jobs.get(name)!
    const job = config.init(input) as Job<J[N]>
    setTimeout(() => config.start(job))
    return job
  }
}

// Types

export interface ShiftSetupContext<J extends ShiftJobMap, T = J[keyof J]> {
  defineJob<N extends keyof J>(name: N, jobStartFn: JobCallback<J[N]>): void;
  defineChore(name: string, choreInitFn: ChoreInitFn<T>): void;
  defineWorker(name: string, workerInitFn: WorkerInitFn<T>): void;
  afterExec(name: string, afterExecFn: JobCallback<T>): void;
}

interface ShiftJobMap {
  [key: string]: any;
}

interface JobSetup<T> {
  init: (input: T) => Job<T>;
  start: JobCallback<any>;
}

type JobCallback<T> = (job: Job<T>) => any
type ChoreInitFn<T> = (job: Job<T>) => string | ChoreParams | Chore
type WorkerInitFn<T> = (job: Job<T>) => WorkerParams | Worker
