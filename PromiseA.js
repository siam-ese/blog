const STATUS = {
  pending: 0,
  fulfilled: 1,
  rejected: 2
}

// 2.3 The Promise Resolution Procedure
function resolvePromise(promise, x, onFulfilled, onRejected) {
  if (promise === x) {
    return onRejected(new TypeError('x and promise is same object'));
  }
  if (x instanceof PromiseA) {
    if (x.status === STATUS.pending) {
      x.then((y) => {
        resolvePromise(promise, y, onFulfilled, onRejected);
      }, onRejected)
    } else {
      x.then(onFulfilled, onRejected)
    }
    return;
  }
  let called = false;
  if ((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) {
    try {
      const then = x.then;
      if (typeof then === 'function') {
        then.call(x, function (y) {
          if (called) return;
          this.called = true;
          return resolvePromise(promise, y, onFulfilled, onRejected)
        }, function (r) {
          if (called) return;
          this.called = true;
          return onRejected(r);
        })
      } else {
        onFulfilled(x);
      }
    } catch (e) {
      if (called) return;
      this.called = true;

      return onRejected(e);
    }
  } else {
    onFulfilled(x);
  }
}

class PromiseA {
  constructor(executor) {
    this.status = STATUS.pending;
    this.resolveList = [];
    this.rejectList = [];
    let self = this;
    function resolve(v) { // thenable 需要call this 不能为箭头函数
      if (v instanceof PromiseA) {
        return v.then(resolve, reject)
      }
      queueMicrotask(() => {
        if (self.status === STATUS.pending) {
          self.value = v;
          self.status = STATUS.fulfilled;
          for (const func of self.resolveList) {
            func(v)
          }
        }
      })
    };
    function reject(v) { // thenable 需要call this 不能为箭头函数
      queueMicrotask(() => {
        if (self.status === STATUS.pending) {
          self.value = v;
          self.status = STATUS.rejected;
          for (const func of self.rejectList) {
            func(v)
          }
        }
      })
    };
    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e)
    }

  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (v) { return v };
    onRejected = typeof onRejected === 'function' ? onRejected : function (r) { throw r };

    let promise;
    if (this.status === STATUS.pending) {
      return promise = new PromiseA((resolve, reject) => {
        this.resolveList.push((v) => {
          try {
            resolvePromise(promise, onFulfilled(v), resolve, reject)
          } catch (e) {
            reject(e)
          }
        });
        this.rejectList.push((v) => {
          try {
            resolvePromise(promise, onRejected(v), resolve, reject)
          } catch (e) {
            reject(e)
          }
        });
      })
    }

    if (this.status === STATUS.fulfilled) {
      return promise = new PromiseA((resolve, reject) => {
        queueMicrotask(() => {
          try {
            resolvePromise(promise, onFulfilled(this.value), resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      })
    }

    if (this.status === STATUS.rejected) {
      return promise = new PromiseA((resolve, reject) => {
        queueMicrotask(() => {
          try {
            resolvePromise(promise, onRejected(this.value), resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      })
    }

  }
  catch(onRejected) {
    return this.then(null, onRejected)
  }
  static defer() {
    var dfd = {}
    dfd.promise = new PromiseA(function (resolve, reject) {
      dfd.resolve = resolve
      dfd.reject = reject
    })
    return dfd
  }
  static deferred() {
    var dfd = {}
    dfd.promise = new PromiseA(function (resolve, reject) {
      dfd.resolve = resolve
      dfd.reject = reject
    })
    return dfd
  }
}


module.exports = PromiseA;