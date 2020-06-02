// 柯里化函数实现

function sum(a: number, b: number, c: number): number {
  return a + b + c;
}

function isDef(v: any): boolean {
  return v !== null && v !== undefined;
}

function isUndef(v: any): boolean {
  return !isDef(v);
}

type AnyFuncton = (...args: any[]) => any;

function currying(fn: AnyFuncton, ...args: any[]): any {
  args = args.filter((v) => isDef(v));
  return args.length >= fn.length
    ? fn(...args)
    : (...ars: any[]) => currying(fn.bind(null, ...args), ...ars);
}

function currying2(fn: AnyFuncton, ...args: any[]): any {
  args = args.filter((v) => isDef(v));
  return args.length >= fn.length
    ? fn(...args)
    : (...ars: any[]) => currying2(fn, ...args.concat(ars));
}
