const STATE = {
  pending: 'pending',
  fulfilled: 'fulfilled',
  rejected: 'rejected'
}

function timer(func) {
  const observer = new MutationObserver(func);
  const node = document.createTextNode('');
  observer.observe(node, { characterData: true });
  node.data = 0;
}

function flush(promise) {
  if (promise.state === STATE.pending) return;
  const callbacks = promise.state === STATE.fulfilled ? promise._fulfillCallback : promise._rejectCallback;
  const val = promise.state === STATE.fulfilled ? promise.resolved : promise.rejected;

  while (callbacks.length) {
    const callback = callbacks.shift()
    timer(() => {
      callback(val)
    })
  }
}


class PromiseA {
  constructor(executor) {
    // 初始化promsie

    // 状态还是pending得时候用两个数组存，resolve函数和reject函数
    this._fulfillCallback = [];
    this._rejectCallback = [];

    // 初始化状态
    this.state = STATE.pending;
    // 把resolve reject 传给接受的executor函数
    this._resolve = (value) => {
      this.resolved = value;
      this.state = STATE.fulfilled
      flush(this)
    };
    this._reject = (error) => {
      this.rejected = error;
      this.state = STATE.onRejected
      flush(this)
    };

    executor(this._resolve, this._reject)
  }
  catch(onRejected) {
    return this.then(null, onRejected)
  }
  then(onFulfilled, onRejected) { // then函数返回一个新的promise
    // 可能会传undefined，undefined时为接受参数返回参数的一个函数
    onFulfilled = onFulfilled || (v => v)
    onRejected = onRejected || (v => { throw v })

    let promise;
    if (this.state === STATE.pending) {
      let _onFulfilled, _onRejected; // 声明两个变量
      promise = new PromiseA((resolve, reject) => {
        _onFulfilled = v => { // 在这个新的promise 把声明的两个变量赋值为一个函数，这个函数调用时 也这个新的promise resolve函数或reject函数
          try {
            resolvePromise(promise, onFulfilled(v), onFulfilled, onRejected)
          } catch (err) {
            reject(err)
          }
        };
        _onRejected = e => {
          try {
            resolve(onRejected(e))
          } catch (err) {
            reject(err)
          }
        };
      })
      // 把两个变量放入当前promise的callback数组中
      this._fulfillCallback.push(_onFulfilled)
      this._rejectCallback.push(_onRejected)
    } else if (this.state === STATE.fulfilled) {
      promise = new PromiseA((resolve, reject) => {
        try {
          resolvePromise(promise, onFulfilled(this.resolved), resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
    } else if (this.state === STATE.rejected) {
      promise = new PromiseA((resolve, reject) => {
        try {
          resolvePromise(promise, onRejected(this.rejected), resolve, reject)
        } catch (err) {
          reject(err)
        }
      })
    }

    return promise
  }
  static race(promises) {
    let count = 0;
    return new PromiseA((resolve, reject) => {
      promises.forEach((promise) => {
        promise.then(() => {
          count += 1;
          if (count === promise.length) resolve(true)
        }).catch((err) => {
          reject(err)
        })
      })
    })
  }
  static all(promises) {
    const result = []
    let count = 0;
    return new PromiseA((resolve, reject) => {
      promises.forEach((promise, i) => {
        promise.then((v) => {
          result[i] = v;
          count += 1;
          if (count === promise.length) resolve(result)
        }).catch((err) => {
          reject(err)
        })
      })
    })
  }
  static resolve(val) {
    return new PromiseA((resolve) => {
      resolve(val)
    })
  }
  static reject(err) {
    return new PromiseA((_, reject) => {
      reject(err)
    })
  }
}

function resolvePromise(promise, x, onFulfilled, onRejected) {
  if (promise === x) throw TypeError('promise is cycly called!')
  let called = false;

  if (x instanceof Promise) { // 对应标准2.3.2节
    // 如果x的状态还没有确定，那么它是有可能被一个thenable决定最终状态和值的
    // 所以这里需要做一下处理，而不能一概的以为它会被一个“正常”的值resolve
    if (x.state === 'pending') {
      x.then(function (value) {
        resolvePromise(promise, value, onFulfilled, onRejected)
      }, reject)
    } else { // 但如果这个Promise的状态已经确定了，那么它肯定有一个“正常”的值，而不是一个thenable，所以这里直接取它的状态
      x.then(resolve, reject)
    }
    return
  }

  if ((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) { // 2.3.3
    try {
      let then = x.then
      if (typeof then === 'function') {
        then.call(
          x,
          function resolve(y) {
            if (called) return
            called = true
            return resolvePromise(promise, y, resolve, reject)
          },
          function reject(r) {
            if (called) return
            called = true
            return reject(r)
          })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true
      return reject(e)
    }
  } else { // 2.3.4
    onFulfilled(x)
  }
}

export default PromiseA