# for await...of

for await...of 循环调用对象上 Symbol.asyncIterator 方法

Symbol.asyncIterator 方法需要返回一个 generate function

```ts
// generate function 返回一个迭代器 迭代器
// 迭代器需要有一个next方法
interface generator {
  next: () => {
    value: any;
    done: boolean;
  };
}
// define 一个可以被for await...of循环迭代的对象
var asyncInterator = {
  [Symbol.asyncInterator]() {
    i: 0,
    next() {
      if (this.i < 3) {
        return Promise.resolve({ value: this.i++, done: false})
      } else {
        return Promise.resolve({ done: true })
      }
    }
  }
}

(async function() {
  for await (num of asyncIterable) {
    console.log(num);
    // 0
    // 1
    // 2
  }
})();
```
