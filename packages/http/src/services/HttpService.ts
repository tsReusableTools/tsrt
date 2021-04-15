import axios, { AxiosRequestConfig, AxiosError, CancelTokenSource } from 'axios';
import qs from 'qs';

import { isEmpty, msg } from '@tsrt/utils';

import { IHttpServiceSettings, IHttpServiceHttpClient, IHttpServiceResponse } from '../types';

export class HttpService {
  private readonly _httpClient: IHttpServiceHttpClient;
  private _pendingRequests = 0;
  private _isOffline = false;
  private readonly _settings: IHttpServiceSettings = {
    withCredentials: true,
    requestTimeout: 3000 * 1000,
    shouldCatchErrors: true,
    debug: false,
    queryStringifyOptions: { arrayFormat: 'comma', strictNullHandling: true, encode: false },
  };
  private _requestProgress: { event: ProgressEvent; value: number };

  public constructor(settings: IHttpServiceSettings = { }) {
    this._httpClient = settings.httpClient || axios.create({ });
    this._settings = { ...this._settings, ...settings, httpClient: this._httpClient };
    this.setupHttpClientInterceptors(this._settings);
    this.patchHttpClientRequestMethod(this._settings);
  }

  public get client(): IHttpServiceHttpClient {
    return this._httpClient;
  }

  public get pendingRequests(): number {
    return this._pendingRequests;
  }

  public get isOffline(): boolean {
    return this._isOffline;
  }

  public get requestProgress(): { event: ProgressEvent; value: number } {
    return this._requestProgress;
  }

  public createCancelToken(): CancelTokenSource {
    return axios.CancelToken.source();
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable no-param-reassign */
  protected patchHttpClientRequestMethod({ httpClient, withCredentials = true }: IHttpServiceSettings): void {
    const { request } = httpClient;

    const patchedRequest = async <T = any, R = IHttpServiceResponse<T>>(config: AxiosRequestConfig): Promise<R> => {
      const newConfig: AxiosRequestConfig = { ...config, withCredentials };
      if (newConfig.data && !newConfig.headers['Content-Type']) newConfig.headers['Content-Type'] = 'application/json';
      newConfig.data = this.convertDataIntoFormData(config.data);
      return request(newConfig);
    };

    httpClient.request = patchedRequest;
  }

  /**
   *  Converts request body into FormData if any file detected.
   *
   *  @param data - Request body.
   */
  protected convertDataIntoFormData(data: any): any {
    if (!data) return;

    let convertedData = data;
    const files = this.getFiles(data, true);

    if (!isEmpty(files)) {
      const form = new FormData();

      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (!(item instanceof File)) form.append(item, JSON.stringify(item));
        });
      } else if (typeof data === 'object') {
        Object.keys(data).forEach((key) => {
          if (!(data[key] instanceof File)) form.append(key, JSON.stringify(data[key]));
        });
      }

      Object.keys(files).forEach((key) => {
        form.append(key, new Blob([files[key]], { type: files[key].type }), files[key].name);
      });

      convertedData = form;
    }

    return convertedData;
  }

  /**
   *  Defines whether there any files in provided body.
   *
   *  @param body - Data structure to check.
   *  @param [removeFromBody] - Whether to remove found files from initial body.
   */
  protected getFiles(body: GenericObject, removeFromBody = false): GenericObject<File> {
    let files: GenericObject<File> = { };

    if (Array.isArray(body)) {
      body.forEach((item, i) => {
        if (item instanceof File) files[`file_${i}`] = item;
      });
    } else if (body && typeof body === 'object') {
      Object.keys(body).forEach((key) => {
        if (body[key] instanceof File) {
          files[key] = body[key];
          if (removeFromBody) delete body[key];
          return;
        }

        if (typeof body[key] === 'object') {
          const nestedFiles = this.getFiles(body[key]);
          if (removeFromBody && !isEmpty(nestedFiles)) delete body[key];
          files = { ...files, ...nestedFiles };
        }
      });
    }

    return files;
  }

  protected setupHttpClientInterceptors({
    httpClient, requestTimeout, shouldCatchErrors, debug, queryStringifyOptions,
  }: IHttpServiceSettings): void {
    httpClient.defaults.timeout = requestTimeout;

    httpClient.defaults.onUploadProgress = (e): void => this.setRequestProgress(e);

    httpClient.defaults.onDownloadProgress = (e): void => this.setRequestProgress(e);

    httpClient.defaults.paramsSerializer = (params): string => qs.stringify(params, queryStringifyOptions);

    httpClient.interceptors.request.use(
      (config) => {
        this.increasePendingRequestsCounter();
        return config;
      },
      (err) => Promise.reject(err),
    );

    httpClient.interceptors.response.use(
      (res) => {
        this.decreasePendingRequestsCounter();
        return res;
        // return shouldExtractResponse ? { ...res, ...res.data } : res;
      },
      (err) => {
        const isCancel = axios.isCancel(err);
        if (debug) this.logError(err, isCancel);
        this.decreasePendingRequestsCounter();
        this.checkIfOffline();
        return shouldCatchErrors ? this.catchError(err, isCancel) : Promise.reject(err);
      },
    );
  }

  protected setRequestProgress(event: ProgressEvent): void {
    this._requestProgress = { event, value: Math.floor((event.loaded * 100) / event.total) };
  }

  protected increasePendingRequestsCounter(): void {
    this._pendingRequests++;
  }

  protected decreasePendingRequestsCounter(): void {
    this._pendingRequests--;
  }

  protected checkIfOffline(): void {
    this._isOffline = window.navigator.onLine;
  }

  protected logError(err: AxiosError, isCancel?: boolean): void {
    const catchedError = this.catchError(err, isCancel);
    if (isCancel) console.warn('HttpService cancelled request: ', catchedError);
    else console.error('HttpService catched Error: ', catchedError);
  }

  protected catchError(err: AxiosError, isCancel?: boolean): IHttpError & { errors?: IValidationError[] } {
    const status = isCancel ? 499 : err?.response?.status || 500;
    const message = isCancel ? 'Request was cancelled from client' : err?.response?.data?.data || 'Some error occured during request';
    return err?.response?.data && typeof err?.response?.data === 'object' ? err?.response?.data : msg(status, message);
  }
}

export const httpService = new HttpService();
