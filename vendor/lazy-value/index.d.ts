export declare class Lazy<T> {
  constructor(factory: () => T);
  readonly hasValue: boolean;
  value: T;
}
