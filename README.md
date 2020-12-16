# promise-implementation
Javascript promise implementation conformant to the [Promises/A+ spec](https://promisesaplus.com/). Implementation based off this [article](https://www.promisejs.org/implementing/) from promisejs.org

# Usage
Promises are state machines that can either be pending, fulfilled, or rejected. A promise is given an executor from the client. The promise runs this executor, with fulfill and reject methods that hook into the promise's state. When the executor calls either of these methods, it transitions the state from pending to fulfilled or rejected. These transitions are one-way, meaning we can't return to a pending state. On top of giving the client control, promises are chainable with `.then()` statements. This makes running multiple asynchronous requests in succession much cleaner than callback style asynchronous programming. Moreover, the callbacks in `.then()` statements can return promises themselves, which takes over the entire state of the original promise object.

```
const value = ':)'
new APromise((fulfill, reject) => fulfill(null))
  .then(() => new APromise((fulfill, reject) => fulfill(value)), null)
```
