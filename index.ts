export enum PROMISE_STATE {
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  REJECTED = 'REJECTED',
}

interface FulfillFn {
  (value: unknown): void
}

interface RejectFn {
  (value: unknown): void
}

interface ExecutorFn {
  (fulfill: FulfillFn, reject: RejectFn): void
}

type FulfillHandler = FulfillFn
type RejectHandler = RejectFn

export class APromise {
  state: PROMISE_STATE
  value: unknown

  constructor(executor: ExecutorFn) {
    // initial state of Promise is pending
    this.state = PROMISE_STATE.PENDING

    // call executor immediately
    callExecutor(this, executor)
  }

  then(onFulfilled: FulfillHandler | null, onRejected: FulfillHandler | null) {
    handleResolved(this, onFulfilled, onRejected)
  }
}

const callExecutor = (promise: APromise, executor: ExecutorFn) => {
  let called = false

  // To the client, api of fulfill and reject only take 1 param. In reality, it takes the promise
  // object in which it mutates state.
  const wrappedFulfill = (value: unknown): void => {
    if (called) return
    called = true
    fulfill(promise, value)
  }

  const wrappedReject = (error: unknown): void => {
    if (called) return
    called = true
    reject(promise, error)
  }

  try {
    executor(wrappedFulfill, wrappedReject)
  } catch (e) {
    wrappedReject(e)
  }
}

// fulfill and reject definitions are outside of APromise class to make it cleaner. These functions
// need to take APromise object because they will be called in the client provided executor function
// which has it's own `this` context.
const fulfill = (promise: APromise, result: unknown) => {
  promise.state = PROMISE_STATE.FULFILLED
  promise.value = result
}

const reject = (promise: APromise, error: unknown) => {
  promise.state = PROMISE_STATE.REJECTED
  promise.value = error
}

const handleResolved = (
  promise: APromise,
  onFulfilled: FulfillHandler,
  onRejected: RejectHandler
) => {
  const handler = promise.state === PROMISE_STATE.FULFILLED ? onFulfilled : onRejected

  handler(promise.value)
}
