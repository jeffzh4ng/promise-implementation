import { APromise, PROMISE_STATE } from './index'

// =================================================================================================
//                                          PROMISE STATE
// =================================================================================================

// A Promise is just a state machine, with three states. Pending, fulfilled, and rejected.
// Initially, the Promise is in the pending state, and can transition into the fulfilled state or
// rejected state.

// Implementation wise, the Promise makes this transition with the executor. The executor is a function
// the client passes to the constructor with two params - fulfill and reject. The executor gets called
// immediately, where a call to fulfill will transition the state of the promise from
// pending -> fulfilled and a call to reject will transition the state of the promise from
// pendign -> rejected.

describe('State', () => {
  it('receives an executor function when constructed which is called immediately', () => {
    const executor = jest.fn() // mock exector with spy
    const promise = new APromise(executor)

    expect(executor.mock.calls.length).toBe(1)

    expect(typeof executor.mock.calls[0][0]).toBe('function')
    expect(typeof executor.mock.calls[0][1]).toBe('function')
  })

  it('is in PENDING state', () => {
    const promise = new APromise(function executor(fulfill, reject) {})
    expect(promise.state).toBe(PROMISE_STATE.PENDING)
  })

  it('transitions to the FULFILLED state with a value', () => {
    const value = 'fulfilled'
    const promise = new APromise(function executor(fulfill, reject) {
      fulfill(value)
    })

    expect(promise.state).toBe(PROMISE_STATE.FULFILLED)
  })

  it('transitions to the REJECTED state with a value', () => {
    const reason = 'rejected'

    const promise = new APromise(function executor(fulfill, reject) {
      reject(reason)
    })

    expect(promise.state).toBe(PROMISE_STATE.REJECTED)
  })
})

// =================================================================================================
//                                         OBSERVING CHANGES
// =================================================================================================

// The client of a promise observes changes with the .then() method on a Promise. The method receives
// two parameters from the client. A function called onFulfilled, that will be called by the Promise
// when Promise is in a FULFILLED state, and a function called onRejected, that will be called by
// the Promise when Promise in in a REJECTED state. Both of these functions will be called with the
// corresponding value/error. From now on, these functions will be referred to as handlers.

describe('Observing changes', () => {
  it('should have a then method', () => {
    const promise = new APromise(() => {})
    expect(typeof promise.then).toBe('function')
  })

  it('should call the onFulfilled handler when a promise is in a FULFILLED state', () => {
    const value = 'fulfilled'
    const onFulfilled = jest.fn()

    const promise = new APromise((fulfill, reject) => {
      fulfill(value)
    }).then(onFulfilled, null)

    expect(onFulfilled.mock.calls.length).toBe(1)
    expect(onFulfilled.mock.calls[0][0]).toBe(value)
  })

  it('should call the onRejected handler when a promise is in a REJECTED state', () => {
    const reason = 'rejected'
    const onRejected = jest.fn()

    const promise = new APromise((fulfill, reject) => {
      reject(reason)
    }).then(null, onRejected)

    expect(onRejected.mock.calls.length).toBe(1)
    expect(onRejected.mock.calls[0][0]).toBe(reason)
  })
})

// =================================================================================================
//                                         One-way Transitions
// =================================================================================================

// Once the state of a Promise transitions to FULFILLED or REJECTED, it should not transition to any
// other state.

describe('One-way transitions', () => {
  const value = 'fulfilled'
  const reason = 'rejected'

  it('does not reject after being fulfilled', () => {
    const onFulfilled = jest.fn()
    const onRejected = jest.fn()

    const promise = new APromise((fulfill, reject) => {
      fulfill(value)
      reject(reason)
    })

    promise.then(onFulfilled, onRejected)

    expect(onFulfilled.mock.calls.length).toBe(1)
    expect(onFulfilled.mock.calls[0][0]).toBe(value)
    expect(onRejected.mock.calls.length).toBe(0)
    expect(promise.state).toBe(PROMISE_STATE.FULFILLED)
  })

  it('does not fulfill after being rejected', () => {
    const onFulfilled = jest.fn()
    const onRejected = jest.fn()

    const promise = new APromise((fulfill, reject) => {
      reject(reason)
      fulfill(value)
    })

    promise.then(onFulfilled, onRejected)

    expect(onRejected.mock.calls.length).toBe(1)
    expect(onRejected.mock.calls[0][0]).toBe(reason)
    expect(onFulfilled.mock.calls.length).toBe(0)
    expect(promise.state).toBe(PROMISE_STATE.REJECTED)
  })
})

// =================================================================================================
//                                        Handling Executor Errors
// =================================================================================================

// The promise should transition to REJECTED state if the executor throws an error.
describe('Handling executor errors', () => {
  it('when the executor throws the promise should transition to the REJECTED state', () => {
    const reason = 'i failed :('
    const onRejected = jest.fn()
    const promise = new APromise((resolve, reject) => {
      throw reason
    })

    promise.then(null, onRejected)
    expect(onRejected.mock.calls.length).toBe(1)
    expect(onRejected.mock.calls[0][0]).toBe(reason)
    expect(promise.state).toBe(PROMISE_STATE.REJECTED)
  })
})
