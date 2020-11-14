import { IPagedData } from '@tsrt/utils';

export interface ICrudApiClient<I extends GenericObject = GenericObject, EntityList = IPagedData<I>> {
  item: I;
  hasPendingRequest: boolean;

  /**
   *  Creates new entity record.
   *
   *  @param body - Entity data.
   *  @param [query] - Additional query params.
   */
  create(body: I, query?: IQueryParams): Promise<I>;
  create(body: I[], query?: IQueryParams): Promise<I[]>;
  create(body: I | I[], query?: IQueryParams): Promise<I | I[]>;

  /**
   *  Reads entity by id / list of entities.
   *
   *  @param [query] - Additional query params.
   *  @param [id] - Specific entity id.
   */
  read(query?: IQueryParams, id?: null): Promise<EntityList>;
  read(query?: IQueryParams, id?: number | string): Promise<I>;
  read(query?: IQueryParams, id?: number | string): Promise<I | EntityList>;

  /**
   *  Updates entity by id or list of entities.
   *
   *  @param body - Entity data / list of entities.
   *  @param [id] - Entity id.
   *  @param [query] - Additional query params.
   */
  update(body: Array<Partial<I>>, id?: null, query?: IQueryParams): Promise<I[]>;
  update(body: Partial<I>, id: number | string, query?: IQueryParams): Promise<I>;
  update(body: Partial<I> | Array<Partial<I>>, id?: number | string, query?: IQueryParams): Promise<I | I[]>;

  /**
   *  Deletes entity by id.
   *
   *  @param id - Entity id.
   *  @param [query] - Additional query params.
   */
  delete(id: number | string, query?: IQueryParams): Promise<string>;

  /**
   *  Creates or updates entities from provided list.
   *
   *  @param body - List of entities
   *  @param [query] - Additional query params.
   */
  // bulkCreateOrUpdate(body: Array<Partial<I>>, query?: IQueryParams): Promise<ICrudBulkResponse<I>>;

  /**
   *  Updates order for list of entities.
   *
   *  @param body - List of entities to reorder / list of new orders where each item is { id: id, order: order };
   *  @param [query] - Additional query params
   */
  updateItemsOrder(body: Array<Partial<I>>, query?: IQueryParams): Promise<I[]>;

  /**
   *  Cancels current request.
   *
   *  @param [message] - Message to show after request canceled
   */
  cancel(message?: string): void;

  /** Resets value of current item */
  reset(): void;
}
