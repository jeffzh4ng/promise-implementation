enum STATE {
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
  state: STATE
  value: unknown

  constructor(executor: ExecutorFn) {
    // initial state of Promise is pending
    this.state = STATE.PENDING

    // call executor immediately
    callExecutor(this, executor)
  }

  then(onFulfilled: FulfillHandler | null, onRejected: FulfillHandler | null) {
    handleResolved(this, onFulfilled, onRejected)
  }
}

const callExecutor = (promise: APromise, executor: ExecutorFn) => {
  // To the client, api of fulfill and reject only take 1 param. In reality, it takes the promise
  // object in which it mutates state.
  const wrappedFulfill = (value: unknown) => fulfill(promise, value)
  const wrappedReject = (error: unknown) => reject(promise, error)

  executor(wrappedFulfill, wrappedReject)
}

// fulfill and reject definitions are outside of APromise class to make it cleaner. These functions
// need to take APromise object because they will be called in the client provided executor function
// which has it's own `this` context.
const fulfill = (promise: APromise, result: unknown) => {
  promise.state = STATE.FULFILLED
  promise.value = result
}

const reject = (promise: APromise, error: unknown) => {
  promise.state = STATE.REJECTED
  promise.value = error
}

const handleResolved = (promise: APromise, onFulfilled, onRejected) => {
  const handler = promise.state === STATE.FULFILLED ? onFulfilled : onRejected
  if (handler === null) throw new Error()

  handler(promise.value)
}
