import type { Shift } from './shift'

export class Job<T> {
  constructor(public shift: Shift, public input: T) {}
}