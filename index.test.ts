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
    setTimeout(() => {
      expect(promise.state).toBe(PROMISE_STATE.PENDING)
    }, 10)
  })

  it('transitions to the FULFILLED state with a value', () => {
    const value = 'fulfilled'
    const promise = new APromise(function executor(fulfill, reject) {
      fulfill(value)
    })

    setTimeout(() => {
      expect(promise.state).toBe(PROMISE_STATE.FULFILLED)
    }, 10)
  })

  it('transitions to the REJECTED state with a value', () => {
    const reason = 'rejected'

    const promise = new APromise(function executor(fulfill, reject) {
      reject(reason)
    })

    setTimeout(() => {
      expect(promise.state).toBe(PROMISE_STATE.REJECTED)
    }, 10)
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

  it('should call the onFulfilled handler when a promise is in a FULFILLED state', (done) => {
    const value = 'fulfilled'
    const onFulfilled = jest.fn()

    const promise = new APromise((fulfill, reject) => {
      fulfill(value)
    }).then(onFulfilled, null)

    setTimeout(() => {
      expect(onFulfilled.mock.calls.length).toBe(1)
      expect(onFulfilled.mock.calls[0][0]).toBe(value)
      done()
    }, 10)
  })

  it('should call the onRejected handler when a promise is in a REJECTED state', (done) => {
    const reason = 'rejected'
    const onRejected = jest.fn()

    const promise = new APromise((fulfill, reject) => {
      reject(reason)
    }).then(null, onRejected)

    setTimeout(() => {
      expect(onRejected.mock.calls.length).toBe(1)
      expect(onRejected.mock.calls[0][0]).toBe(reason)
      done()
    })
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

  it('does not reject after being fulfilled', (done) => {
    const onFulfilled = jest.fn()
    const onRejected = jest.fn()

    const promise = new APromise((fulfill, reject) => {
      fulfill(value)
      reject(reason)
    })

    promise.then(onFulfilled, onRejected)

    setTimeout(() => {
      expect(onFulfilled.mock.calls.length).toBe(1)
      expect(onFulfilled.mock.calls[0][0]).toBe(value)
      expect(onRejected.mock.calls.length).toBe(0)
      expect(promise.state).toBe(PROMISE_STATE.FULFILLED)
      done()
    }, 10)
  })

  it('does not fulfill after being rejected', (done) => {
    const onFulfilled = jest.fn()
    const onRejected = jest.fn()

    const promise = new APromise((fulfill, reject) => {
      reject(reason)
      fulfill(value)
    })

    promise.then(onFulfilled, onRejected)

    setTimeout(() => {
      expect(onRejected.mock.calls.length).toBe(1)
      expect(onRejected.mock.calls[0][0]).toBe(reason)
      expect(onFulfilled.mock.calls.length).toBe(0)
      expect(promise.state).toBe(PROMISE_STATE.REJECTED)
      done()
    }, 10)
  })
})

// =================================================================================================
//                                        Handling Executor Errors
// =================================================================================================

// The promise should transition to REJECTED state if the executor throws an error.
describe('Handling executor errors', () => {
  it('when the executor throws the promise should transition to the REJECTED state', (done) => {
    const reason = 'i failed :('
    const onRejected = jest.fn()
    const promise = new APromise((resolve, reject) => {
      throw reason
    })

    promise.then(null, onRejected)

    setTimeout(() => {
      expect(onRejected.mock.calls.length).toBe(1)
      expect(onRejected.mock.calls[0][0]).toBe(reason)
      expect(promise.state).toBe(PROMISE_STATE.REJECTED)
      done()
    }, 10)
  })
})

// =================================================================================================
//                                        Aynchronous Executor
// =================================================================================================

// If the executor is asynchronous, and calls the fulfill/reject functions not immediately, then
// our .then method will fail because the handlers get executed immediately. The handlers get executed
// when our Promise state is PENDING.

// The .then method should queue handlers if Promise is in a PENDING state.

it('should queue handlers when the promise is not fulfilled immediately', (done) => {
  const value = 'fulfilled'
  const promise = new APromise((fulfill, reject) => {
    setTimeout(fulfill, 1, value) // calls fulfill asynchronously
  })

  const onFulfilled = jest.fn()

  promise.then(onFulfilled, null)

  setTimeout(() => {
    expect(onFulfilled.mock.calls.length).toBe(1)
    expect(onFulfilled.mock.calls[0][0]).toBe(value)

    promise.then(onFulfilled, null)
  }, 5)

  // at this point executor has not called fulfill yet, it's queued for the event loop after current execution context
  expect(onFulfilled.mock.calls.length).toBe(0)

  setTimeout(() => {
    expect(onFulfilled.mock.calls.length).toBe(2)
    expect(onFulfilled.mock.calls[1][0]).toBe(value)
    done()
  }, 10)
})

it('should queue handlers when the promise is not rejected immediately', (done) => {
  const reason = 'fulfilled'
  const promise = new APromise((fulfill, reject) => {
    setTimeout(reject, 1, reason) // calls fulfill asynchronously
  })

  const onRejected = jest.fn()

  promise.then(null, onRejected)

  setTimeout(() => {
    expect(onRejected.mock.calls.length).toBe(1)
    expect(onRejected.mock.calls[0][0]).toBe(reason)

    promise.then(null, onRejected)
  }, 5)

  // at this point executor has not called fulfill yet, it's queued for the event loop after current execution context
  expect(onRejected.mock.calls.length).toBe(0)

  setTimeout(() => {
    expect(onRejected.mock.calls.length).toBe(2)
    expect(onRejected.mock.calls[1][0]).toBe(reason)
    done()
  }, 10)
})

// =================================================================================================
//                                          Chaining Promises
// =================================================================================================

// Our .then() method should return a promise, allowing us to chain .then() statements.

describe('Chaining promises', () => {
  it('.then() should return a promise', (done) => {
    const value = 'fulfilled'
    const qOnFulfilled = jest.fn()
    const rOnFulfilled = jest.fn()

    setTimeout(() => {
      expect(() => {
        const p = new APromise((fulfill, reject) => fulfill(value))
        const q = p.then(qOnFulfilled, null)
        const r = q.then(rOnFulfilled, null)
        done()
      }).not.toThrow()
    }, 10)
  })

  it('if onFulfilled handler in .then is called without errors then promise from .then should transition to FULFILLED', (done) => {
    const value = 'fulfilled'
    const f1 = jest.fn()
    const promise = new APromise((fulfill, reject) => {
      fulfill(null)
    })
      .then(() => value, null)
      .then(f1, null)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      done()
    }, 10)
  })

  it('if onRejected handler in .then is called without errors then promise from .then should transition to FULFILLED', (done) => {
    const value = 'fulfilled'
    const f1 = jest.fn()
    const promise = new APromise((fulfill, reject) => {
      reject(null)
    })
      .then(null, () => value)
      .then(f1, null)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      setTimeout(done)
    })
  })

  it('if onFulfilled handler in .then throws promise should transition to REJECTED', (done) => {
    const reason = new Error('I failed :(')
    const f1 = jest.fn()
    new APromise((fulfill, reject) => fulfill(null))
      .then(() => {
        throw reason
      }, null)
      .then(null, f1)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(reason)
      done()
    }, 10)
  })

  it('if onFulfilled handler in .then throws promise should transition to REJECTED', (done) => {
    const reason = new Error('I failed :(')
    const f1 = jest.fn()
    new APromise((fulfill, reject) => reject(null))
      .then(null, () => {
        throw reason
      })
      .then(null, f1)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(reason)
      done()
    }, 10)
  })
})

// =================================================================================================
//                                          Async Handlers
// =================================================================================================

// We should be able to support asynchronous handlers as well. That is, handlers that return promises
// themselves.

describe('Async handlers', () => {
  it('if a handler returns a Promise, the entire promise should adopt the state of the returned promise', (done) => {
    const value = ':)'
    const f1 = jest.fn()
    new APromise((fulfill, reject) => fulfill(null))
      .then(() => new APromise((fulfill, reject) => fulfill(value)), null)
      .then(f1, null)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      done()
    }, 10)
  })

  it('if a handler returns a Promise in the future, the entire promise should adopt its value', (done) => {
    const value = ':)'
    const f1 = jest.fn()

    new APromise((fulfill, reject) => setTimeout(fulfill, 0))
      .then(() => new APromise((fulfill, reject) => setTimeout(fulfill, 0, value)), null)
      .then(f1, null)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      done()
    }, 10)
  })
})

// =================================================================================================
//                                     Execute handlers after event loop
// =================================================================================================

// One of the requirements in the Promise spec is to call handlers after the event loop has finished
// processing it's current stack. This makes promise resolution consistent by ensuring all observers
// are called in the future even if the executor/handlers are synchronous.

describe('Handler execution', () => {
  it('promise calls the handlers after the event loop', (done) => {
    const value = ':)'
    const f1 = jest.fn()
    let resolved = false

    const p = new APromise((fulfill, reject) => {
      fulfill(value)
      resolved = true
    }).then(f1, null)

    expect(f1.mock.calls.length).toBe(0)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      expect(resolved).toBe(true)
      done()
    }, 10)
  })
})

// =================================================================================================
//                            Allow promises to reject with resolved promise
// =================================================================================================
describe('Reject resolved promise', () => {
  it('rejects with a resolved promise', (done) => {
    const value = ':)'
    const reason = new APromise((fulfill, reject) => fulfill(value))

    const r1 = jest.fn()
    const p = new APromise((fulfill, reject) => fulfill(null))
      .then(() => {
        throw reason
      }, null)
      .then(null, r1)

    expect(r1.mock.calls.length).toBe(0)

    setTimeout(function () {
      expect(r1.mock.calls.length).toBe(1)
      expect(r1.mock.calls[0][0]).toBe(reason)
      done()
    }, 10)
  })
})

describe('Disallow promises resolving with themselves', () => {
  it('should throw when attempted to be resolved with itself', (done) => {
    const r1 = jest.fn()
    const p = new APromise((fulfill) => fulfill(null))
    const q = p.then(() => q, null)
    q.then(null, r1)

    setTimeout(function () {
      expect(r1.mock.calls.length).toBe(1)
      expect(r1.mock.calls[0][0] instanceof TypeError).toBe(true)
      done()
    }, 10)
  })
})
