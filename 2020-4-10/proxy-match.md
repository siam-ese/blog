# 2. vue.config.js 中 devServer.proxy 匹配规则

vue-cli3 中是利用 **http-proxy-middleware** 这个库进行匹配

proxy 配置时的 key 是 **string** 的形式,会在 http-proxy-middleware 库匹配时走到

```js
// single path
if (isStringPath(context)) {
  return matchSingleStringPath(context, uri);
}
```

这个函数里直接调用了一个函数返回，再看 **matchSingleStringPath** 这个函数

```js
function matchSingleStringPath(context, uri) {
  const pathname = getUrlPathName(uri);
  return pathname.indexOf(context) === 0;
}
```

matchSingleStringPath 函数里的 **getUrlPathName** 就是引用了 url 这个库，对 uri 进行 parse，然后返回 uri 的 pathname 的值，使用 indexOf 对 proxy 声明时的 key 为 context 进行匹配

如：同时声明了/api 和/api1 两个 proxy 配置，在对/api1 进行代理时会出现冲突的情况
