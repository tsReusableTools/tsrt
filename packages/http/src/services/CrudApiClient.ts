import { CancelTokenSource } from 'axios';
import { IPagedData } from '@tsrt/utils';

import { ICrudApiClient, IHttpServiceRequestConfig } from '../types';
import { HttpService } from './HttpService';

/* eslint-disable-next-line */
export abstract class CrudApiClient<I extends GenericObject = GenericObject, EntityList = IPagedData<I>> implements ICrudApiClient<I, EntityList> {
  private _item: I;
  private _hasPendingRequest = false;
  private _requestCancellation: CancelTokenSource;

  protected constructor(
    protected readonly httpService: HttpService,
    protected readonly baseUrl: string,
    protected readonly routeParamsResolver?: () => GenericObject,
    protected readonly reorderEndpoint: string = '/reorder',
    protected readonly bulkEndpoint: string = '/bulk',
  ) { }

  /** Gets orignal current value */
  public get item(): I { return this.cloneDeep(this._item); }

  /** Gets _hasPendingRequest value */
  public get hasPendingRequest(): boolean { return this._hasPendingRequest; }

  /**
   *  Creates new entity record.
   *
   *  @param body - Entity data.
   *  @param [query] - Additional query params.
   */
  public async create(body: I, query?: IQueryParams): Promise<I>;
  public async create(body: I[], query?: IQueryParams): Promise<I[]>;
  public async create(body: I | I[], query: IQueryParams = { }): Promise<I | I[]> {
    if (!body) {
      this.debugError('Please, provide data for create operation.');
      return;
    }

    const config = this.createRequestConfig({ params: query }, this.baseUrl);

    const result = await this.httpService.client.post<I | I[]>(config.url, body, config);
    this.afterRequest();

    if (result.status >= 400) return;

    const data = this.retrieveDataFromResponse<I | I[]>(result);
    if (!Array.isArray(result)) this._item = data as I;
    return data;
  }

  /**
   *  Reads entity by id / list of entities.
   *
   *  @param [query] - Additional query params.
   *  @param [id] - Specific entity id.
   */
  public async read(query?: IQueryParams, id?: null): Promise<EntityList>;
  public async read(query?: IQueryParams, id?: number | string): Promise<I>;
  public async read(query: IQueryParams = { }, id?: number | string): Promise<I | EntityList> {
    const config = this.createRequestConfig({ params: query }, this.baseUrl, id);

    const result = await this.httpService.client.get<I | EntityList>(config.url, config);
    this.afterRequest();

    if (result.status >= 400) return;

    const data = this.retrieveDataFromResponse<I | EntityList>(result);
    if (id) this._item = data as I;
    return data;
  }

  /**
   *  Updates entity by id or list of entities.
   *
   *  @param body - Entity data / list of entities.
   *  @param [id] - Entity id.
   *  @param [query] - Additional query params.
   */
  public async update(body: Array<Partial<I>>, id?: null, query?: IQueryParams): Promise<I[]>;
  public async update(body: Partial<I>, id: number | string, query?: IQueryParams): Promise<I>;
  public async update(body: Partial<I> | Array<Partial<I>>, id?: number | string, query: IQueryParams = { }): Promise<I | I[]> {
    if (!body) {
      this.debugError('Please, provide data for update.');
      return;
    }

    const config = this.createRequestConfig({ params: query }, this.baseUrl, id);

    const result = await this.httpService.client.put<I | I[]>(config.url, body, config);
    this.afterRequest();

    if (result.status >= 400) return;

    const data = this.retrieveDataFromResponse<I | I[]>(result);
    if (!Array.isArray(result)) this._item = data as I;
    return data;
  }

  /**
   *  Deletes entity by id.
   *
   *  @param id - Entity id.
   *  @param [query] - Additional query params.
   */
  public async delete(id: number | string, query: IQueryParams = { }): Promise<string> {
    if (!id) {
      this.debugError('Please, provide id for delete.');
      return;
    }

    const config = this.createRequestConfig({ params: query }, this.baseUrl, id);

    const result = await this.httpService.client.delete<string>(config.url, config);
    this.afterRequest();

    if (result.status < 400) return this.retrieveDataFromResponse<string>(result);
  }

  /**
   *  Creates or updates entities from provided list.
   *
   *  @param body - List of entities
   *  @param [query] - Additional query params.
   */
  // public async bulkCreateOrUpdate(body: Array<Partial<I>>, query: IQueryParams = { }): Promise<ICrudBulkResponse<I>> {
  //   if (!this.bulkEndpoint) return;
  //   if (!body) {
  //     this.debugError('Please, provide data for bulk create or update.');
  //     return;
  //   }

  //   const config = this.createRequestConfig({ params: query }, baseUrl);

  //   const result = await this.requestService.post(config.url, body, config);
  //   this.afterRequest();

  //   if (result.status < 400) return result.data as ICrudBulkResponse<CustomEntity>;
  //   return this.BulkCreateOrUpdate(`${this.baseUrl}${this.bulkEndpoint}`, body, query);
  // }

  /**
   *  Updates order for list of entities.
   *
   *  @param body - List of entities to reorder / list of new orders where each item is { id: id, order: order };
   *  @param [query] - Additional query params
   */
  public async updateItemsOrder(body: Array<Partial<I>>, query: IQueryParams = { }): Promise<I[]> {
    if (!this.reorderEndpoint) return;
    if (!body) {
      this.debugError('Please, provide data for updating order.');
      return;
    }

    const config = this.createRequestConfig({ params: query }, this.baseUrl);

    const result = await this.httpService.client.post<I[]>(config.url, body, config);
    this.afterRequest();

    if (result.status < 400) return this.retrieveDataFromResponse<I[]>(result);
  }

  /**
   *  Cancels current request.
   *
   *  @param [message] - Message to show after request canceled.
   */
  public cancel(message?: string): void {
    this._requestCancellation.cancel(message);
    this.afterRequest();
  }

  /** Resets value of current item */
  public reset(): void {
    this._item = undefined;
  }

  /** Method to retrieve data from custom response structure  */
  /* eslint-disable-next-line */
  protected retrieveDataFromResponse<T>(data: any): T {
    return data.data;
  }

  /**
   *  Makes appropriate changes before request start.
   *
   *  @param [noCancelation=false] - Whether not to cancel previous request (don't use cancel token automatically).
   */
  private beforeRequest(noCancelation = false): void {
    if (this._hasPendingRequest && !noCancelation) this.cancel();

    this._hasPendingRequest = true;
    this._requestCancellation = this.httpService.createCancelToken();
  }

  /** Makes appropriate changes after request ends */
  private afterRequest(): void {
    this._hasPendingRequest = false;
    this._requestCancellation = undefined;
  }

  /** Shows provided debug error */
  private debugError(msg: string): void {
    console.warn(`[DEBUG]: ${msg}`);
  }

  /**
   *  Extracts actual data from API response, which could be w/ pager.
   *
   *  @param data - API response data
   */
  private extractDataFromApiResponse<T>(data: T | IPagedData<T>): T | T[] {
    return 'value' in data ? data.value : data;
  }

  /**
   *  Creates axios request config
   *
   *  @param [customConfig={ }] - Custom config props
   *  @param [baseUrl] - Base endPoint
   *  @param [id] - Optional resource id
   */
  private createRequestConfig(
    customConfig: GenericObject = { }, baseUrl?: string, id?: string | number,
  ): IHttpServiceRequestConfig {
    this.beforeRequest(customConfig.params ? customConfig.params.noCancelation : null);

    const config: IHttpServiceRequestConfig = { ...customConfig };

    config.cancelToken = this._requestCancellation.token;

    if (config.params && config.params.noCancelation) delete config.params.noCancelation;
    if (baseUrl) config.url = this.getUrl(baseUrl, id, config.params ? config.params.routeParams : { });

    return config;
  }

  /**
   *  Composes baseUrl + optional id.
   *
   *  @param baseUrl - Base endPoint.
   *  @param [id] - Optional resource id.
   *  @param [routeParams] - Optional route params values used for params replacement.
   */
  private getUrl(baseUrl: string, id?: string | number, routeParams: GenericObject = { }): string {
    return this.parseUrl(`${baseUrl}${id ? `/${id}` : ''}`, routeParams);
  }

  /** Parses url and replaces params placeholders w/ real data */
  private parseUrl(originalUrl: string, routeParams: GenericObject = { }): string {
    let url = originalUrl;
    const params = this.routeParamsResolver ? { ...this.routeParamsResolver(), ...routeParams } : { ...routeParams };
    Object.entries(params).forEach(([key, value]) => { url = url.replace(`:${key}`, value); });
    return url;
  }

  private cloneDeep<T extends GenericObject>(data: T): T {
    return JSON.parse(JSON.stringify(data));
  }
}
