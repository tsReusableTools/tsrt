import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import qs from 'qs';

import { isEmpty, msg } from '@tsd/utils';

import { IHttpServiceSettings, IHttpServiceCancellation, IHttpServiceHttpClient, IHttpServiceResponse } from './types';

export class HttpService {
  private readonly _httpClient: IHttpServiceHttpClient;
  private _hasPendingRequests = false;
  private _pendingRequests = 0;
  private _isOffline = false;
  private readonly _settings: IHttpServiceSettings = {
    withCredentials: true,
    requestTimeout: 3000 * 1000,
    shouldExtractResponse: true,
    shouldCatchErrors: true,
    debug: false,
    queryStringifyOptions: { arrayFormat: 'comma', strictNullHandling: true, encode: false },
  };
  private _downloadProgressEvent: ProgressEvent;
  private _downloadProgress: number;
  private _uploadProgressEvent: ProgressEvent;
  private _uploadProgress: number;

  public constructor(settings: IHttpServiceSettings = { }) {
    this._httpClient = settings.httpClient || axios.create({ });
    this._settings = { ...this._settings, ...settings, httpClient: this._httpClient };
    this.setupHttpClientInterceptors(this._settings);
    this.patchHttpClientRequestMethod(this._settings);
  }

  public get httpClient(): IHttpServiceHttpClient {
    return this._httpClient;
  }

  public get settings(): IHttpServiceSettings {
    return this._settings;
  }

  public get hasPendingRequests(): boolean {
    return this._hasPendingRequests;
  }

  public get pendingRequests(): number {
    return this._pendingRequests;
  }

  public get isOffline(): boolean {
    return this._isOffline;
  }

  public get downloadProgressEvent(): ProgressEvent {
    return this._downloadProgressEvent;
  }

  public get downloadProgress(): number {
    return this._downloadProgress;
  }

  public get uploadProgressEvent(): ProgressEvent {
    return this._uploadProgressEvent;
  }

  public get uploadProgress(): number {
    return this._uploadProgress;
  }

  public createCancelToken(): IHttpServiceCancellation {
    return axios.CancelToken.source();
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable no-param-reassign */
  private patchHttpClientRequestMethod({ httpClient, withCredentials = true }: IHttpServiceSettings): void {
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
  private convertDataIntoFormData(data: any): any {
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
  private getFiles(body: GenericObject, removeFromBody = false): GenericObject<File> {
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

  private setupHttpClientInterceptors({
    httpClient, requestTimeout, shouldExtractResponse, shouldCatchErrors, debug, queryStringifyOptions,
  }: IHttpServiceSettings): void {
    httpClient.defaults.timeout = requestTimeout;

    httpClient.defaults.onUploadProgress = (e): void => {
      this._uploadProgressEvent = e;
      this._uploadProgress = Math.floor((e.loaded * 100) / e.total);
    };

    httpClient.defaults.onDownloadProgress = (e): void => {
      this._downloadProgressEvent = e;
      this._downloadProgress = Math.floor((e.loaded * 100) / e.total);
    };

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
        return shouldExtractResponse ? { ...res, ...res.data } : res;
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

  private increasePendingRequestsCounter(): void {
    this._pendingRequests++;
    this._hasPendingRequests = !!this._pendingRequests;
  }

  private decreasePendingRequestsCounter(): void {
    this._pendingRequests--;
    this._hasPendingRequests = !!this._pendingRequests;
  }

  private checkIfOffline(): void {
    this._isOffline = window.navigator.onLine;
  }

  private logError(err: AxiosError, isCancel?: boolean): void {
    const catchedError = this.catchError(err, isCancel);
    if (isCancel) console.warn('HttpService cancelled request: ', catchedError);
    else console.error('HttpService catched Error: ', catchedError);
  }

  private catchError(err: AxiosError, isCancel?: boolean): IHttpError {
    const status = isCancel ? 499 : err?.response?.status || 500;
    const message = isCancel ? 'Request was cancelled from client' : err?.response?.data || 'Some error occured during request';
    return msg(status, message);
  }
}

export const httpService = new HttpService();
