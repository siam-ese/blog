type ParamsType<T> = T extends (params: infer P) => any ? P : T;
type ResultType<T> = T extends (...args: any[]) => infer R ? R : T;
