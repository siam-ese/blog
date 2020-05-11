# 2020-4-27

## viod 0 和 undefined

为什么很多的代码中想要表达 **undefined** 值却不直接使用 **undefeind** 而是写 **void 0**

```js
// 因为undefined关键字是可以继续赋值的
undefined = 1;
console.log(undefined); // 1
// 而void是关键字是不能被赋值的
void = 1 // Uncaught SyntaxError: Unexpected token '='
console.log(void 0); // undefined
```

## es6 - WeakMap

### 1. **WeakMap** 数据结构的特点

```txt
    1. key必须是Object类型
    2. key是弱引用的可以被垃圾回收
```

### 2. **WeakMap** 范例

```js
var map = new WeakMap();
var obj = {
  a: 1,
};
map.set(obj, 2);
console.log('obj value is ', map.get(obj)); // obj value is  2
obj = void 0;
// 无法引用后 被垃圾回收
console.log('map has obj key ?', map.has(obj)); // map has obj key ? false
```
