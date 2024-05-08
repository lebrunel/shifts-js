import { describe, expect, test } from 'bun:test'
import { isAsyncIter, isFn, isStr } from '@util'

describe('isAsyncIter()', () => {
  test('returns true for async iterable', () => {
    const iter = (async function*() {
      yield 1
      yield 2
      yield 3
    })()
    expect(isAsyncIter(iter)).toBeTrue()
  })

  test('resturns false for sync iterable', () => {
    const iter = (function*() {
      yield 1
      yield 2
      yield 3
    })()
    expect(isAsyncIter(iter)).toBeFalse()
  })

  test('resturns false for any other primitive', () => {
    expect(isAsyncIter(1)).toBeFalse()
    expect(isAsyncIter('foo')).toBeFalse()
    expect(isAsyncIter({foo: 'bar'})).toBeFalse()
    expect(isAsyncIter([1, 2, 3])).toBeFalse()
  })
})

describe('isFn()', () => {
  test('returns true for functions', () => {
    function fn1() {}
    const fn2 = () => {}
    class Foo {
      bar() {}
    }
    const foo = new Foo()
    expect(isFn(fn1)).toBeTrue()
    expect(isFn(fn2)).toBeTrue()
    expect(isFn(foo.bar)).toBeTrue()
  })

  test('resturns false for any other primitive', () => {
    expect(isFn(1)).toBeFalse()
    expect(isFn('foo')).toBeFalse()
    expect(isFn({foo: 'bar'})).toBeFalse()
    expect(isFn([1, 2, 3])).toBeFalse()
  })
})

describe('isStr()', () => {
  test('returns true for a string', () => {
    expect(isStr('test')).toBeTrue()
  })

  test('resturns false for any other primitive', () => {
    expect(isStr(1)).toBeFalse()
    expect(isStr({foo: 'bar'})).toBeFalse()
    expect(isStr([1, 2, 3])).toBeFalse()
  })
})