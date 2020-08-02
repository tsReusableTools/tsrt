/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  /** Generic Type for object like type */
  export type GenericObject<T = any> = { [x: string]: T };

  /** Generic any type */
  export type GenericAny<T = any> = GenericObject<T> | number | string | boolean | T[];

  /** Generic Type for id */
  export type GenericId = number | string;

  /** Generic type for constructor */
  export type Constructor<T = any> = new (...args: any[]) => T;

  /** Interface for common query params */
  export interface IQueryParams {
    limit?: number | string;
    skip?: number;
    select?: string;
    getBy?: string;
    sort?: string;
    include?: string | string[];
    filter?: GenericObject;
  }

  /** Interface for HttpError like object */
  export interface IHttpError<T = any> {
    message: string;
    data: T;
    status: number;
    statusText: string;
    code?: number | string;
  }

  /** Interface for common API response */
  export interface IApiResponse<T = any> {
    status: number;
    statusText: string;
    requestFrom: string;
    method: string;
    endPoint: string;
    params?: GenericObject;
    commit?: string;
    data: T;
  }
}

export {};
