// 1. infer typescript中 infer是对一个泛型的推导

interface GenericsObject<T> {
  key: T;
}
type GenericsFunction<T> = (...args: any[]) => T;

const numberToString: GenericsFunction<string> = (num: number) =>
  num.toString();
const numberObject: GenericsObject<number> = {
  key: 0,
};

type InferObjectType<T> = T extends GenericsObject<infer P> ? P : T;
type InferReturnType<T> = T extends GenericsFunction<infer P> ? P : T;

type ObjectType = InferObjectType<typeof numberObject>; // infer object generics type is number
type RtType = InferReturnType<typeof numberToString>; // infer function generics type is number
