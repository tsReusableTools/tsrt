/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosInstance, AxiosStatic } from 'axios';
import { IStringifyOptions } from 'qs';

import '@tsrt/types';

export interface IHttpServiceSettings {
  httpClient?: AxiosStatic | AxiosInstance;
  withCredentials?: boolean;
  requestTimeout?: number;
  shouldCatchErrors?: boolean;
  debug?: boolean;
  queryStringifyOptions?: IStringifyOptions;
}
