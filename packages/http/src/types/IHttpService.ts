/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosInstance, AxiosStatic, AxiosRequestConfig, AxiosResponse } from 'axios';
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

export type IHttpServiceRequestConfig = AxiosRequestConfig;

/* eslint-disable-next-line */
export interface IHttpServiceResponse<T = any> extends Partial<AxiosResponse<T>> {};

export interface IHttpServiceHttpClient extends AxiosInstance {
  request<T = any, R = IHttpServiceResponse<T>>(config: AxiosRequestConfig): Promise<R>;
  get<T = any, R = IHttpServiceResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
  delete<T = any, R = IHttpServiceResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
  head<T = any, R = IHttpServiceResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
  options<T = any, R = IHttpServiceResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
  post<T = any, R = IHttpServiceResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
  put<T = any, R = IHttpServiceResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
  patch<T = any, R = IHttpServiceResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
}
