export { dedent as dd } from 'ts-dedent'

export function isAsyncIter(val: any): val is AsyncIterable<any> {
  return !!val && typeof val[Symbol.asyncIterator] === 'function'
}

export function isFn<T extends Function>(val: any): val is T {
  return typeof val === 'function'
}

export function isStr(val: any): val is string {
  return typeof val === 'string'
}