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

interface HandlerInfo {
  promise: APromise
  onFulfilled: FulfillHandler
  onRejected: RejectHandler
}

export class APromise {
  state: PROMISE_STATE
  queue: Array<HandlerInfo>
  value: unknown

  constructor(executor: ExecutorFn) {
    // initial state of Promise is pending
    this.state = PROMISE_STATE.PENDING
    this.queue = []

    // call executor immediately
    callExecutor(this, executor)
  }

  then(onFulfilled: FulfillHandler | null, onRejected: FulfillHandler | null) {
    const promise = new APromise(() => {})
    handle(this, { promise, onFulfilled, onRejected })
    return promise
  }
}

const callExecutor = (promise: APromise, executor: ExecutorFn) => {
  let called = false

  // To the client, api of fulfill and reject only take 1 param. In reality, it takes the promise
  // object in which it mutates state.
  const wrappedFulfill = (value: unknown | undefined): void => {
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
  if (result === promise) {
    return reject(promise, new TypeError())
  }

  promise.state = PROMISE_STATE.FULFILLED
  promise.value = result

  // call finale if fulfill was called asynchronously
  finale(promise)
}

const reject = (promise: APromise, error: unknown) => {
  promise.state = PROMISE_STATE.REJECTED
  promise.value = error

  // call finale is reject was called asynchronously
  finale(promise)
}

// invokes all the handlers stored in the promise
const finale = (promise: APromise) => {
  for (const handler of promise.queue) {
    handle(promise, handler)
  }
}

const handleResolved = (promise: APromise, handlers: HandlerInfo) => {
  setImmediate(() => {
    const handler =
      promise.state === PROMISE_STATE.FULFILLED ? handlers.onFulfilled : handlers.onRejected

    try {
      const value = handler(promise.value)
      fulfill(handlers.promise, value)
    } catch (e) {
      reject(handlers.promise, e)
    }
  })
}

const handle = (promise: APromise, handlers: HandlerInfo) => {
  // take state of innermost promise
  while (promise.state !== PROMISE_STATE.REJECTED && promise.value instanceof APromise) {
    promise = promise.value
  }
  if (promise.state === PROMISE_STATE.PENDING) {
    // queue the handler if state is PENDING, we can't call it immediately
    promise.queue.push(handlers)
  } else {
    handleResolved(promise, handlers)
  }
}
