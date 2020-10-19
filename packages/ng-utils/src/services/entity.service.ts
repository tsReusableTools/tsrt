import { IPagedData } from '@tsd/utils';
import { IHttpServiceCancellation, IHttpServiceRequestConfig, HttpService } from '@tsd/http';

import { IEntityService } from '../types';
import { RouterService } from './router.service';

/* eslint-disable-next-line */
export abstract class EntityService<I extends GenericObject = GenericObject, EntityList = IPagedData<I>> implements IEntityService<I, EntityList> {
  private _item: I;
  private _pendingRequest = false;
  private _requestCancellation: IHttpServiceCancellation;

  protected constructor(
    protected readonly httpService: HttpService,
    protected readonly http: HttpService,
    protected readonly routerService: RouterService,
    protected readonly baseUrl: string,
    protected readonly reorderEndpoint: string = '/reorder',
    protected readonly bulkEndpoint: string = '/bulk',
  ) { }

  /** Gets orignal current value */
  public get item(): I { return this.cloneDeep(this._item); }

  /** Gets _pendingRequest value */
  public get pendingRequest(): boolean { return this._pendingRequest; }

  /**
   *  Creates new entity record.
   *
   *  @param body - Entity data.
   *  @param [query] - Additional query params.
   */
  public async create(body: I, query?: IQueryParams): Promise<I>;
  public async create(body: I[], query?: IQueryParams): Promise<I[]>;
  public async create(body: I | I[], query: IQueryParams = { }): Promise<I | I[]> {
    /* eslint-disable-next-line */
    const result = await this.Create(this.baseUrl, body as any, query);
    if (!Array.isArray(result)) this._item = result;
    return result;
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
    const result = await this.Read(this.baseUrl, query, id);
    if (id && result) this._item = result;
    return result;
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
    /* eslint-disable-next-line */
    const result = await this.Update(this.baseUrl, body as any, id, query);
    if (!Array.isArray(result)) this._item = result;
    return result;
  }

  /**
   *  Deletes entity by id.
   *
   *  @param id - Entity id.
   *  @param [query] - Additional query params.
   */
  public async delete(id: number | string, query: IQueryParams = { }): Promise<string> {
    return this.Delete(this.baseUrl, id, query);
  }

  /**
   *  Creates or updates entities from provided list.
   *
   *  @param body - List of entities
   *  @param [query] - Additional query params.
   */
  // public async bulkCreateOrUpdate(body: Array<Partial<I>>, query: IQueryParams = { }): Promise<ICrudBulkResponse<I>> {
  //   if (!this.bulkEndpoint) return;
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
    /* eslint-disable-next-line */
    return this.UpdateItemsOrder(`${this.baseUrl}${this.reorderEndpoint}`, body as any [], query);
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

  /**
   *  General method for POST requests. Creates new entity record.
   *
   *  @param baseUrl - Base url, upon which to make API call.
   *  @param body - Entity data.
   *  @param [query] - Additional query params
   */
  protected async Create<CustomEntity extends GenericObject = I, CustomEntityList = I[]>(
    baseUrl: string, body: Partial<CustomEntity>, query?: IQueryParams,
  ): Promise<CustomEntity>;
  protected async Create<CustomEntity extends GenericObject = I, CustomEntityList = I[]>(
    baseUrl: string, body: Array<Partial<CustomEntity>>, query?: IQueryParams,
  ): Promise<CustomEntityList>;
  protected async Create<CustomEntity extends GenericObject = I, CustomEntityList = I[]>(
    baseUrl: string, body: Partial<CustomEntity> | Array<Partial<CustomEntity>>, query: IQueryParams = { },
  ): Promise<CustomEntity | CustomEntityList> {
    if (!body) {
      this.debugError('Please, provide data for create.');
      return;
    }

    const config = this.createRequestConfig({ params: query }, baseUrl);

    const result = await this.httpService.httpClient.post<CustomEntity | CustomEntityList>(config.url, body, config);
    this.afterRequest();

    if (result.status < 400) return result.data;
  }

  /**
   *  General method for GET requests. Reads entity by id or entity list.
   *
   *  @param baseUrl - Base url, upon which to make API call.
   *  @param [query] - Additional query params
   *  @param [id] - Specific item id
   */
  protected async Read<CustomEntity extends GenericObject = I, CustomEntityList = EntityList>(
    baseUrl: string, query?: IQueryParams,
  ): Promise<CustomEntityList>;
  protected async Read<CustomEntity extends GenericObject = I, CustomEntityList = EntityList>(
    baseUrl: string, query?: IQueryParams, id?: number | string,
  ): Promise<CustomEntity>;
  protected async Read<CustomEntity extends GenericObject = I, CustomEntityList = EntityList>(
    baseUrl: string, query: IQueryParams = { }, id?: number | string,
  ): Promise<CustomEntity | CustomEntityList> {
    const config = this.createRequestConfig({ params: query }, baseUrl, id);

    const result = await this.httpService.httpClient.get<CustomEntity | CustomEntityList>(config.url, config);
    this.afterRequest();

    if (result.status < 400) return result.data;
  }

  /**
   *  General method for PUT requests. Updates entity by id or entity list
   *
   *  @param baseUrl - Base url, upon which to make API call.
   *  @param body - Entity data / list of entities
   *  @param id - Id of entity
   *  @param [query] - Additional query params.
   */
  protected async Update<CustomEntity extends GenericObject = I, CustomEntityList = I[]>(
    baseUrl: string, body: Array<Partial<CustomEntity>>, id: null, query?: IQueryParams,
  ): Promise<CustomEntityList>;
  protected async Update<CustomEntity extends GenericObject = I, CustomEntityList = I[]>(
    baseUrl: string, body: Partial<CustomEntity>, id: number | string, query?: IQueryParams,
  ): Promise<CustomEntity>;
  protected async Update<CustomEntity extends GenericObject = I, CustomEntityList = I[]>(
    baseUrl: string, body: Partial<CustomEntity> | Array<Partial<CustomEntity>>, id: number | string | null, query: IQueryParams = { },
  ): Promise<CustomEntity | CustomEntityList> {
    if (!body) {
      this.debugError('Please, provide data for update.');
      return;
    }

    const config = this.createRequestConfig({ params: query }, baseUrl, id);

    const result = await this.httpService.httpClient.put<CustomEntity | CustomEntityList>(config.url, body, config);
    this.afterRequest();

    if (result.status < 400) return result.data;
  }

  /**
   *  General method for DELETE requests. Deletes entity by id.
   *
   *  @param baseUrl - Base url, upon which to make API call.
   *  @param id - Entity id.
   *  @param [query] - Additional query params.
   */
  protected async Delete(baseUrl: string, id: number | string, query: IQueryParams = { }): Promise<string> {
    if (!id) {
      this.debugError('Please, provide id for delete.');
      return;
    }

    const config = this.createRequestConfig({ params: query }, baseUrl, id);

    const result = await this.httpService.httpClient.delete<string>(config.url, config);
    this.afterRequest();

    if (result.status < 400) return result.data;
  }

  /**
   *  General method for BULK create or update. Creates or updates entities from provided list.
   *
   *  @param baseUrl - Base url, upon which to make API call.
   *  @param body - List of entities
   *  @param [query] - Additional query params.
   */
  // protected async BulkCreateOrUpdate<CustomEntity extends GenericObject = I>(
  //   baseUrl: string, body: Array<Partial<CustomEntity>>, query: IQueryParams = { },
  // ): Promise<ICrudBulkResponse<CustomEntity>> {
  //   if (!body) {
  //     this.debugError('Please, provide data for bulk create or update.');
  //     return;
  //   }

  //   const config = this.createRequestConfig({ params: query }, baseUrl);

  //   const result = await this.requestService.post(config.url, body, config);
  //   this.afterRequest();

  //   if (result.status < 400) return result.data as ICrudBulkResponse<CustomEntity>;
  // }

  /**
   *  General method for reordering. Updates order for list of entities.
   *
   *  @param baseUrl - Base url, upon which to make API call.
   *  @param body - List of entities to reorder / list of new orders where each item is { id: id, order: order };
   *  @param [query] - Additional query params
   */
  protected async UpdateItemsOrder<CustomEntity extends GenericObject = I>(
    baseUrl: string, body: Array<Partial<CustomEntity>>, query: IQueryParams = { },
  ): Promise<CustomEntity[]> {
    if (!body) {
      this.debugError('Please, provide data for updating order.');
      return;
    }

    const config = this.createRequestConfig({ params: query }, baseUrl);

    const result = await this.httpService.httpClient.post<CustomEntity>(config.url, body, config);
    this.afterRequest();

    if (result.status < 400) return result.data as unknown as CustomEntity[];
  }

  /**
   *  Makes appropriate changes before request start.
   *
   *  @param [noCancelation=false] - Whether not to cancel previous request (don't use cancel token automatically).
   */
  private beforeRequest(noCancelation = false): void {
    if (this._pendingRequest && !noCancelation) this.cancel();

    this._pendingRequest = true;
    this._requestCancellation = this.httpService.createCancelToken();
  }

  /** Makes appropriate changes after request ends */
  private afterRequest(): void {
    this._pendingRequest = false;
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
    Object.entries({ ...this.routerService.routeParams, ...routeParams }).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
    return url;
  }

  private cloneDeep<T extends GenericObject>(data: T): T {
    return JSON.parse(JSON.stringify(data));
  }
}
