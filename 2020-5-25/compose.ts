// 1. compose 函数
type AnyFunction = (...args: any[]) => any;
type FunctionArray = AnyFunction[];

function compose(fns: FunctionArray) {
  return (x: any) => {
    const composer = fns.reduce(
      (cpr, fn) => {
        return () => fn(cpr());
      },
      () => x
    );
    return composer();
  };
}

// 2. koa 中间件
// koa middleware
// function ((ctx, next) => {
// })
// koa-compose源码实现也差不多 这里可以看到next调用时直接调用的 所以在中间件内部要自己去await next整个模型才是洋葱圈的模型
function KoaCompose(middlewares: FunctionArray) {
  return (ctx: any) => {
    function run(index: number) {
      let fn = middlewares[index];
      if (!fn) return Promise.resolve();
      try {
        const ret = fn(ctx, run.bind(null, index + 1));
        return Promise.resolve(ret);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    return run(0);
  };
}
