import { APromise } from './index'
// A Promise is just a state machine, with three states. Pending, fulfilled, and rejected.
// Initially, the Promise is in the pending state, and can transition into the fulfilled state or
// rejected state.

// Implementation wise, the Promise makes this transition with the executor. The executor is a function
// the client passes to the constructor with two params - fulfill and reject. The executor gets called
// immediately, where a call to fulfill will transition the state of the promise from
// pending -> fulfilled and a call to reject will transition the state of the promise from
// pendign -> rejected.

it('receives an executor function when constructed which is called immediately', () => {
  const executor = jest.fn() // mock exector with spy
  const promise = new APromise(executor)

  expect(executor.mock.calls.length).toBe(1)

  expect(typeof executor.mock.calls[0][0]).toBe('function')
  expect(typeof executor.mock.calls[0][1]).toBe('function')
})

it('is in PENDING state', () => {
  const promise = new APromise(function executor(fulfill, reject) {})
  expect(promise.state).toBe('PENDING')
})

it('transitions to the FULFILLED state with a value', () => {
  const value = 'hello world'
  const promise = new APromise(function executor(fulfill, reject) {
    fulfill(value)
  })

  expect(promise.state).toBe('FULFILLED')
})

it('transitions to the REJECTED state with a value', () => {
  const value = 'bye world'

  const promise = new APromise(function executor(fulfill, reject) {
    reject(value)
  })

  expect(promise.state).toBe('REJECTED')
})
