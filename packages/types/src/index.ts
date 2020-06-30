declare global {
  /** Generic Type for object like type */
  /* eslint-disable-next-line */
  export type GenericObject<T = any> = { [x: string]: T };

  /** Generic any type */
  /* eslint-disable-next-line */
  export type GenericAny<T = any> = GenericObject<T> | number | string | boolean | Array<T>;

  /** Generic Type for id */
  export type GenericId = number | string;

  /** Generic type for constructor */
  /* eslint-disable-next-line */
  export type Constructor<T = any> = new (...args: any[]) => T;

  /** Interface for query params object */
  export interface IQueryParams {
    limit?: number | string;
    skip?: number;
    select?: string;
    getBy?: string;
    sort?: string;
    include?: string;
    filter?: GenericObject;
    where?: GenericObject;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /** Interface for common response */
  export interface IMsg<T = any> {
    status: number;
    statusText: string;
    requestFrom?: string;
    method?: string;
    endPoint?: string;
    params?: GenericObject;
    commit?: string;
    data?: T;
  }

  /** Interface for common response in Promise wrapper */
  export type IMsgPromise<T = any> = Promise<IMsg<T>>;
}

export {};
