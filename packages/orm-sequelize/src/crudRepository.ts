import {
  Op, FindAndCountOptions, ProjectionAlias, FindAttributeOptions, OrderItem,
  WhereAttributeHash, Includeable, IncludeOptions, WhereOptions, FindOptions,
} from 'sequelize';
import { ModelCtor, Model } from 'sequelize-typescript';
import { singular } from 'pluralize';

import {
  IOrderedItem, msg, isEmpty, capitalize, parseTypes, reorderItemsInArray,
  hasItemsWithoutOrderOrWithEqualOrders, log,
} from '@ts-utils/utils';

import {
  IDbMultipleResponse, IBaseSequelizeCrudRepositoryMethodOptions, ICrudBulkResponse,
  IBaseSequelizeCrudRepositoryConfig, ICreateOptions, IUpdateOptions, IDeleteOptions, GenericWhere,
} from './types';
import { OrmSequelize } from './ormSequelize';

/**
 *  Abstract Sequelize Controller for general CRUD operations with DB Resources
 *
 *  @param model - Sequelize DB Model for controller usage
 *  @param permissionsNamespace - Permissions namespace for permissions check
 *  @param [config] - Optional config for default controller options
 */
export abstract class CrudRepository<M extends Model, I extends GenericObject = GenericObject> {
  public constructor(
    protected model: ModelCtor<M>,
    protected permissionsNamespace: string,
    protected config?: Partial<IBaseSequelizeCrudRepositoryConfig>,
  ) {
    this.config = {
      defaults: {
        isRemovedProp: 'isRemoved',
        limit: 10,
        order: ['id', 'asc'],
        getBy: 'id',
      },
    };

    if (config) this.config.defaults = { ...this.config.defaults, ...config.defaults };
  }

  /**
   *  Creates or updates records from provided list
   *
   *  @param body - Array of items to be created / updated
   *  @param [options] - Additional query options
   *  @param [through] - Data to which to add into association for Many to Many relations
   *  @param [checkPermissions=true] - Whether to check permissions or not
   */
  public async bulkCreateOrUpdate(
    body: I[], options?: IBaseSequelizeCrudRepositoryMethodOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<ICrudBulkResponse<I>> {
    if (!Array.isArray(body)) {
      return msg.badRequest('To update multiple items, there should be a list of them in request body') as IMsg;
    }

    const toCreateArray: I[] = [];
    const toUpdateArray: I[] = [];

    body.forEach((item) => {
      if (Object.hasOwnProperty.call(item, 'id') && item.id) toUpdateArray.push(item);
      else toCreateArray.push(item);
    });

    /* eslint-disable-next-line */
    const created = await this.bulkCreate(toCreateArray, options as any, through, checkPermissions);
    /* eslint-disable-next-line */
    const updated = await this.bulkUpdate(toUpdateArray, options as any, through, checkPermissions);

    if (created.status >= 400 && updated.status >= 400) {
      return msg.note(207, { created, updated }) as IMsg;
    }

    const result: ICrudBulkResponse<I> = { created: created.data, updated: updated.data };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    if (created.status >= 400) result.created = created as any;
    if (updated.status >= 400) result.updated = updated as any;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return msg.ok(result);
  }

  /**
   *  Public method for creating a new record / list of records.
   *
   *  If body is array of items - will create multiple items.
   *
   *  @param body - Record data / list of items to be created
   *  @param [customOptions] - Custom options for record creation. Include QueryOptions and CreateOptions
   *  @param [through] - Data to add into association for Many to Many relations
   *  @param [checkPermissions=true] - Whether to check permissions
   */
  public async create(
    body: Partial<I>, customOptions?: ICreateOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I>;
  public async create(
    body: Array<Partial<I>>, customOptions?: ICreateOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I[]>;
  public async create(
    body: Partial<I> | Array<Partial<I>>, customOptions?: ICreateOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I | I[]> {
    if (Array.isArray(body)) return this.bulkCreate(body, customOptions, through, checkPermissions);
    const result = await this.Create(body, customOptions, through, checkPermissions);
    return result as IMsg;
  }

  /**
   *  Public method for bulk creating of provided list of records.
   *
   *  @param body - List of items to be created
   *  @param [customOptions] - Custom options for record creation. Include QueryOptions and CreateOptions
   *  @param [through] - Data to add into association for Many to Many relations
   *  @param [checkPermissions=true] - Whether to check permissions
   */
  public async bulkCreate(
    body: Array<Partial<I>>, customOptions?: ICreateOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I[]> {
    if (!Array.isArray(body)) {
      return msg.badRequest('To update multiple items, there should be a list of them in request body') as IMsg;
    }

    const results: I[] = [];

    for (const item of body) {
      /* eslint-disable-next-line */
      const result = await this.Create(item, customOptions, through, checkPermissions);
      /* eslint-disable-next-line */
      if (result.status >= 400) results.push(result as any);
      else results.push(result.data);
    }

    return msg.created(results);
  }

  /**
   *  Public method for updating record (records) / list of records.
   *
   *  If body is array of items - will update multiple items, where each item must have id prop.
   *
   *  @param body - Item data / list of items w/ data to be updated
   *  @param [id] - Record id to update
   *  @param [customOptions] - Custom options for updating operation
   *  @param [through] - Data to add into association for Many to Many relations
   *  @param [checkPermissions=true] - Whether to check permissions
   */
  public async update(
    body: Array<Partial<I>>, id?: null, customOptions?: IUpdateOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I[]>;
  public async update(
    body: Partial<I>, id: null, customOptions: IUpdateOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I[]>;
  public async update(
    body: Partial<I>, id: number | string, customOptions?: IUpdateOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I>;
  public async update(
    body: Partial<I> | Array<Partial<I>>, id?: number | string, customOptions?: IUpdateOptions,
    through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I | I[]> {
    if (Array.isArray(body)) return this.bulkUpdate(body, customOptions, through, checkPermissions);
    const result = await this.Update(body, id, customOptions, through, checkPermissions);
    return result as IMsg;
  }

  /**
   *  Public method for bulk updating of list of records
   *
   *  @param body - List of items w/ data to be updated
   *  @param [customOptions] - Custom options for updating operation
   *  @param [through] - Data to add into association for Many to Many relations
   *  @param [checkPermissions=true] - Whether to check permissions
   */
  public async bulkUpdate(
    body: Array<Partial<I>>, customOptions?: IUpdateOptions,
    through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I[]> {
    if (!Array.isArray(body)) {
      return msg.badRequest('To update multiple items, there should be a list of them in request body') as IMsg;
    }

    const results: I[] = [];

    for (const item of body) {
      if (!item.id) {
        /* eslint-disable-next-line */
        results.push(msg.badRequest('There should be an "id" property in each object to update') as any);
        return;
      }

      /* eslint-disable-next-line */
      const result = await this.Update(item, item.id as number, customOptions, through, checkPermissions);
      /* eslint-disable-next-line */
      if (result.status >= 400) results.push(result as any);
      else results.push(result.data);
    }

    return msg.ok(results);
  }

  /**
   *  Update items order in DB - reordering
   *
   *  @param body - Items with new orders or array of changes
   *  @param [options] - Additional Query options
   *  @param [checkPermissions=true] - Whether to check permissions or not
   */
  public async updateItemsOrder<C extends IOrderedItem>(
    body: C[], options: IQueryParams = { }, checkPermissions = true,
  ): IMsgPromise<I[]> {
    if (checkPermissions) {
      await this.checkPermissions([`${this.permissionsNamespace}.update'`]);
    }

    if (!this.model || !this.model.rawAttributes.order) {
      return msg.badRequest('There is no opportunity to reorder items for this resource') as IMsg;
    }

    if (!Array.isArray(body)) {
      return msg.badRequest('To update multiple instances, there should be a list of them in request body') as IMsg;
    }

    const query = await this.buildQuery({ ...options, limit: 'none' });

    // const available = await this.getAvailableResources({ ...query, where: options.where });
    const available = await this.getAvailableResources({ ...query });
    if (available.status >= 400) return available as IMsg;

    const reordered = reorderItemsInArray(body, this.sequelizeToPlainObject(available.data) as unknown as C[]);
    if (reordered.status >= 400) return reordered as IMsg;

    const transaction = await OrmSequelize.createTransaction();

    let errors = false;

    for (const item of reordered.data) {
      /* eslint-disable-next-line */
      const result = await this.update({ order: item.order } as any, item.id, { transaction });
      if (result.status >= 400) errors = true;
    }

    if (!errors) transaction.commit();
    else {
      transaction.rollback();
      return msg.internalServerError();
    }

    return msg.ok(reordered.data as unknown as I[]);
  }

  /**
   *  Public method for reading
   *
   *  @param [options] - Query options
   *  @param [id] - Id or query to find by
   *  @param [checkPermissions=true] - Whether to check permissions
   */
  public async read(
    options?: IQueryParams, checkPermissions?: boolean,
  ): IMsgPromise<IDbMultipleResponse<I>>;
  public async read(
    options?: IQueryParams, id?: number | string, checkPermissions?: boolean,
  ): IMsgPromise<I>;
  public async read(
    options?: IQueryParams, id?: number | string | boolean, checkPermissions = true,
  ): IMsgPromise<I | IDbMultipleResponse<I>> {
    return this.Read(options, id as number | string, checkPermissions);
  }

  /**
   *  Public method for deleting
   *
   *  @param id - Record id
   *  @param [customOptions] - Custom options for record deletion
   *  @param [checkPermissions=true] - Whether to check permissions or not
   */
  public async delete(id: string | number, customOptions?: IDeleteOptions, checkPermissions = true): IMsgPromise<string> {
    return this.Delete(id, customOptions, checkPermissions);
  }

  /** Gets model name */
  public getModelName(): string {
    return this.model.name;
  }

  /**
   *  Reads all records list directly from DB. No specific validation and modifications.
   *
   *  @param [filter] - Sequelize FindOptions object.
   */
  public findAll(filter?: FindOptions): Promise<M[]> {
    return this.model.findAll(filter) as unknown as Promise<M[]>;
  }

  /**
   *  Reads one record directly from DB. No specific validation and modifications.
   *
   *  @param [filter] - Sequelize FindOptions object.
   */
  public findOne(filter?: FindOptions): Promise<M> {
    return this.model.findOne(filter) as unknown as Promise<M>;
  }

  /**
   *  Reads record by PK directly from DB. No specific validation and modifications.
   *
   *  @param id - Entity id.
   */
  public findByPk(id: number): Promise<M> {
    return this.model.findByPk(id) as unknown as Promise<M>;
  }

  /**
   *  Creates record directly in DB. No specific validation and modifications.
   *
   *  @param body - Entity data.
   */
  public createObject(body: Partial<I> = { }): Promise<M> {
    return this.model.create(body) as unknown as Promise<M>;
  }

  /**
   *  Creates a new record in DB
   *
   *  @param body - Record data
   *  @param [customOptions] - Custom options for record creation. Include QueryOptions and CreateOptions
   *  @param [through] - Data to add into association for Many to Many relations
   *  @param [checkPermissions=true] - Whether to check permissions
   */
  protected async Create(
    body: Partial<I> = { }, customOptions: ICreateOptions = { }, through: GenericObject = { }, checkPermissions = true,
  ): IMsgPromise<I> {
    try {
      if (checkPermissions) await this.checkPermissions([`${this.permissionsNamespace}.create'`]);

      /* eslint-disable no-param-reassign */
      if (Object.hasOwnProperty.call(body, 'id')) delete body.id;
      /* eslint-enable no-param-reassign */

      // This one is necessary in order not to immune input customOptions object, if provided link to it
      /* eslint-disable-next-line */
      if (customOptions) customOptions = { ...customOptions };
      await this.onBeforeCreate(body, customOptions);
      const preparedOptions = this.prepareCustomOptions(customOptions);

      const result = await this.model
        /* eslint-disable-next-line */
        .create(body, preparedOptions.sequelize as any)
        /* eslint-disable-next-line */
        .then((res) => this.addAssociatedData(res as any, body, preparedOptions.all, through))
        // This one is necessary for correct status
        .then((res) => msg.created(res.data))
        .catch((err) => this.createCustomError(err));

      return result;
    } catch (err) {
      return this.createCustomError(err);
    }
  }

  /**
   *  Reads records or record by id from DB Model
   *
   *  @param [options] - Query options
   *  @param [id] - Id or query to find by
   *  @param [checkPermissions=true] - Whether to check permissions
   */
  protected async Read(
    options?: IQueryParams, checkPermissions?: boolean,
  ): IMsgPromise<IDbMultipleResponse<I>>;
  protected async Read(
    options?: IQueryParams, id?: number | string, checkPermissions?: boolean,
  ): IMsgPromise<I>;
  protected async Read(
    options: IQueryParams = { }, id?: number | string | boolean, checkPermissions = true,
  ): IMsgPromise<I | IDbMultipleResponse<I>> {
    try {
      if (checkPermissions) await this.checkPermissions([`${this.permissionsNamespace}.read'`]);

      // This one is necessary in order not to immuteinput options object, if provided link to it
      /* eslint-disable-next-line */
      if (options) options = { ...options };

      await this.onBeforeRead(options, id);

      const originalQuery = await this.buildQuery(options, typeof id === 'boolean' ? null : id);

      // Get & return data for request w/ id
      if (id && typeof id !== 'boolean') {
        const result = await this.model.findOne(originalQuery);
        if (!result) return msg.notFound('Item not found') as IMsg;

        const value = this.sequelizeToPlainObject(result);

        // return result
        //   ? msg.ok(this.sequelizeToPlainObject(result))
        //   : msg.notFound('Item not found') as IMsg;

        const reordered = await this.checkIfHasValidOrder([value], id as string | number, options);
        if (reordered) return reordered;

        return msg.ok(value);
      }

      const fixedQuery = await this.fixSequeliseQueryWithLeftJoins(originalQuery);
      if (fixedQuery.status >= 400) return fixedQuery as IMsg;
      const { query, total: fixedTotal } = fixedQuery.data;

      const result = await this.model.findAndCountAll({ ...query });
      if (!result) return msg.notFound('Items not found') as IMsg;

      const value = this.sequelizeToPlainObject(result.rows);

      // Updating items without order or with equal orders
      // if (value && value.length && hasItemsWithoutOrderOrWithEqualOrders(value)) {
      //   const reordered = await this.updateItemsOrder([], options);
      //   if (reordered.status >= 400) return reordered as IMsg;
      //   return this.Read(options, id as number | string, checkPermissions);
      // }
      const reordered = await this.checkIfHasValidOrder(value, id as string | number, options);
      if (reordered) return reordered;

      return msg.ok(this.convertIntoResponseWithPager(value, fixedTotal || result.count, originalQuery));
    } catch (err) {
      return this.createCustomError(err);
    }
  }

  /**
   *  Updates record in DB
   *
   *  @param body - Data to be inserted
   *  @param [id] - Record Id
   *  @param [customOptions] - Custom options for updating operation
   *  @param [through] - Data to add into association for Many to Many relations
   *  @param [checkPermissions=true] - Whether to check permissions
   */
  protected async Update(
    body: Partial<I>, id?: null, customOptions?: IUpdateOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I[]>;
  protected async Update(
    body: Partial<I>, id: number | string, customOptions?: IUpdateOptions, through?: GenericObject, checkPermissions?: boolean,
  ): IMsgPromise<I>;
  protected async Update(
    body: Partial<I> = { }, id?: string | number | null, customOptions: IUpdateOptions = { },
    through: GenericObject = { }, checkPermissions = true,
  ): IMsgPromise<I | I[]> {
    try {
      if (checkPermissions) await this.checkPermissions([`${this.permissionsNamespace}.update'`]);

      if (!id) return msg.badRequest('Please, provide valid id') as IMsg;

      /* eslint-disable no-param-reassign */
      if (Object.hasOwnProperty.call(body, 'id')) delete body.id;
      if (Object.hasOwnProperty.call(body, 'createdAt')) delete body.createdAt;
      if (Object.hasOwnProperty.call(body, 'updatedAt')) delete body.updatedAt;
      /* eslint-enable no-param-reassign */

      // This one is necessary in order not to immune input customOptions object, if provided link to it
      /* eslint-disable-next-line */
      if (customOptions) customOptions = { ...customOptions };
      await this.onBeforeUpdate(id, body, customOptions);
      const preparedOptions = this.prepareCustomOptions(customOptions);

      const query = { where: { ...this.softDeleteFilter, ...preparedOptions.all.where } };

      const available: IMsg<M | M[]> = await this.getAvailableResources(query, id);
      if (available.status >= 400) return available as IMsg;

      // Update by id and return result
      if (!Array.isArray(available.data)) {
        return available.data
          .update(body, { ...preparedOptions.sequelize, ...query })
          .then((res) => this.addAssociatedData(res, body, preparedOptions.all, through))
          .catch((err) => this.createCustomError(err));
      }

      const response = msg.ok<I[]>([]);

      const results = [];
      for (const item of available.data) {
        results.push(
          item
            .update(body, { ...preparedOptions.sequelize, ...query })
            // .then((res) => response.data.push(this.sequelizeToPlainObject(res)))
            .then(async (res) => {
              const result = await this.addAssociatedData(res, body, preparedOptions.all, through);
              response.data.push(result.data);
            })
            .catch((err) => response.data.push(this.createCustomError(err).data)),
        );
      }
      await Promise.all(results);

      // Define status
      if (response.data.length) {
        const found = response.data.find((item) => item.id);
        if (!found) response.status = 400;
      }

      return response;
    } catch (err) {
      return this.createCustomError(err);
    }
  }

  /**
   *  Deletes record from DB.
   *
   *  @param id - Record id
   *  @param [customOptions] - Custom options for record deletion
   *  @param [checkPermissions=true] - Whether to check permissions
   */
  protected async Delete(id: string | number, customOptions: IDeleteOptions = { }, checkPermissions = true): IMsgPromise<string> {
    try {
      if (checkPermissions) await this.checkPermissions([`${this.permissionsNamespace}.delete'`]);

      if (!id) return msg.badRequest('Please, provide valid id');

      // This one is necessary in order not to immute input customOptions object, if provided link to it
      /* eslint-disable-next-line */
      if (customOptions) customOptions = { ...customOptions };
      await this.onBeforeDelete(id, customOptions);
      const preparedOptions = this.prepareCustomOptions(customOptions);

      const options = { cascade: true, ...preparedOptions.sequelize };
      const query: GenericWhere = { where: { id, ...this.softDeleteFilter, ...preparedOptions.all.where } };

      // Soft delete
      if (this.model.rawAttributes[this.config.defaults.isRemovedProp]) {
        const res = await this.Update({ [this.config.defaults.isRemovedProp]: true } as I, id, query, { }, false);
        if (res.status >= 400) return res as IMsg;

        return msg.ok(`Successfully soft deleted by id(s): ${id}`);
      }

      const result = await this.model.destroy({ ...options, ...query });
      if (result && id) return msg.ok(`Successfully deleted by id(s): ${id}`);
      if (result) return msg.ok(`Successfully deleted by conditions(s): ${JSON.stringify(query.where)}`);
      return msg.notFound(`Incorrect condition(s): ${JSON.stringify(query.where)}`);
    } catch (err) {
      return this.createCustomError(err);
    }
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/no-empty-function */
  /**
   *  Method for override. Checks permissions.
   *  Should throw error w/ explanation if it is.
   *
   *  @param _permissions - Permissions to check
   */
  protected async checkPermissions(_permissions: string[]): Promise<void> { }

  /**
   *  Method to overrided to provide resource specific filters
   *
   *  @param [_query] - Previously parsed query params into Sequelize appropriate find and count options
   */
  protected async provideSpecificQuery(query?: FindAndCountOptions): Promise<FindAndCountOptions> {
    return { ...query };
  }

  /** Provides context for current request */
  protected async provideContext(): Promise<any> {}

  /**
   *  Hook which invokes directly before create operation
   *
   *  @param _body - Body for record creation
   *  @param [_customOptions] - Custom options for record creation
   */
  protected async onBeforeCreate(_body: GenericObject, _customOptions?: ICreateOptions): Promise<void> { }

  /**
   *  Hook which invokes directly before read operation
   *
   *  @param [_options] - Query options
   *  @param [_id] - Id or query to find by
   */
  protected async onBeforeRead(_options?: IQueryParams, _id?: string | number | boolean): Promise<void> { }

  /**
   *  Hook which invokes directly before update operation
   *
   *  @param _id - Record it or query
   *  @param _body - Body for record creation
   *  @param [_customOptions] - Custom options for record update
   */
  protected async onBeforeUpdate(_id: GenericId, _body: GenericObject, _customOptions?: IUpdateOptions): Promise<void> { }

  /**
   *  Hook which invokes directly before delete operation
   *
   *  @param [_id] - Id or query to find by
   *  @param [_customOptions] - Custom options for record (s) destroy
   */
  protected async onBeforeDelete(_id: GenericId, _customOptions: IDeleteOptions): Promise<void> { }

  /**
   *  Hook which fires right before adding associated data.
   *
   *  @param _result - Previously created / updated resource
   *  @param _body - Request body with params
   *  @param [_customOptions] - Query options
   *  @param [_through] - Data to which to add into association for Many to Many relations
   */
  protected async onBeforeAddAssociatedData(
    _result: M, _body: GenericObject, _customOptions?: IBaseSequelizeCrudRepositoryMethodOptions,
    _through?: GenericObject,
  ): Promise<void> { }

  /**
   *  Hook which invokes directly before fixSequeliseQueryWithLeftJoins (before lists read operations)
   *
   *  @param _query - Parsed and ready to use query object
   */
  protected async onBeforeFixSequeliseQueryWithLeftJoins(_query: FindAndCountOptions): Promise<void> { }
  /* eslint-enable @typescript-eslint/no-empty-function */
  /* eslint-enable @typescript-eslint/no-explicit-any */
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /**
   *  Extracts actual data / list of data from response w/ pager
   *
   *  @param data - record or records response w/ pager
   */
  protected extractFromResponseWithPager<T>(data: T): T;
  protected extractFromResponseWithPager<T>(data: IDbMultipleResponse<T>): T[];
  protected extractFromResponseWithPager<T>(data: IDbMultipleResponse<T> | T): T | T[] {
    return 'value' in data ? data.value : data;
  }

  /**
   *  Checks if specific resource(s) is available for specific query and returns it (them)
   *
   *  @param model - DB Model
   *  @param id - Resource id or query. Id is necessary it order to define return type (overloading)
   *  @param query - Query options
   */
  private async getAvailableResources(
    query: FindAndCountOptions,
  ): IMsgPromise<M[]>;
  private async getAvailableResources(
    query: FindAndCountOptions, id: string | number,
  ): IMsgPromise<M>;
  private async getAvailableResources(
    query: FindAndCountOptions, id?: string | number,
  ): IMsgPromise<M | M[]> {
    try {
      const specificQuery = await this.provideSpecificQuery(query);

      if (id) (specificQuery.where as WhereAttributeHash).id = id;

      const unit = !id
        ? await this.model
          .findAll(specificQuery)
          .then((res) => {
            if (res && res.length) return msg.ok(res);
            return msg.badRequest(`Incorrect query: ${JSON.stringify(query.where)}`);
          })
          .catch((err) => this.createCustomError(err))
        : await this.model
          .findOne(specificQuery)
          .then((res) => (res ? msg.ok(res) : msg.badRequest(`Incorrect id${id ? `: ${id}` : ''}`)))
          .catch((err) => this.createCustomError(err));

      return unit;
    } catch (err) {
      return this.createCustomError(err);
    }
  }

  /**
   *  Adds associations data, if provided
   *
   *  @param result - Previously created / updated resource
   *  @param body - Request body with params
   *  @param [options] - Query options
   *  @param [through] - Data to which to add into association for Many to Many relations
   *  @param [id] - Id for resource
   */
  private async addAssociatedData(
    result: M, body: GenericObject, customOptions?: IBaseSequelizeCrudRepositoryMethodOptions,
    through?: GenericObject,
  ): IMsgPromise<I> {
    try {
      /* eslint-disable-next-line */
      if (!result || !(result as any).id) return result as any;

      await this.onBeforeAddAssociatedData(result, body, customOptions, through);

      const options: IBaseSequelizeCrudRepositoryMethodOptions = {
        associate: true,
        replaceOnJoin: true,
        returnData: true,
        ...customOptions,
      };
      const include: IncludeOptions[] = [];
      const promises: M[] = [];
      let data: GenericObject;

      if (!isEmpty(through)) {
        if (!data) data = { through: { } };
        data.through = { ...data.through, ...through };
      }

      const addOrRemoveAssociatedData = (resource: M, key: string, payload?: GenericObject): void => {
        if (!Array.isArray(body[key])) return;

        let toRemoveArray: number[];
        const toAddArray: number[] = [];
        promises.push(
          (resource as GenericObject)[`get${capitalize(key)}`]()
            .then((res: GenericObject[]) => {
              body[key].forEach((item: number) => {
                const found = res.find((unit) => +unit.id === +item);
                if (!found) toAddArray.push(item);
              });

              toRemoveArray = res.map((item) => +item.id).filter((item) => !body[key].includes(item));

              return res;
            })
            .then(() => (options.replaceOnJoin
              ? (resource as GenericObject)[`remove${capitalize(key)}`](toRemoveArray)
              : null))
            .then(() => (resource as GenericObject)[`add${capitalize(key)}`](toAddArray, payload)),
        );
      };

      Object.keys(this.model.associations).forEach((key) => {
        if (body && Object.keys(body).includes(key) && body[key]) {
          include.push({ association: key });
          if (options.associate) addOrRemoveAssociatedData(result, key, data);
        }
      });

      if (promises.length) {
        await Promise.all(promises);
      }

      if (options.include) {
        include.push(...this.includeParser(options.include));
      }

      if (!options.returnData) {
        return msg.ok();
      }

      const updated = await this.Read(
        { ...customOptions, include: include as unknown as string }, (result as GenericObject).id as number | string,
      );
      return updated.status < 400 ? updated : msg.ok(this.sequelizeToPlainObject(result));
    } catch (err) {
      return this.createCustomError(err);
    }
  }

  /**
   *  Checks whether entities has valid orders, if there is such field on provided model and
   *  corrects it if not.
   *
   *  @param value - List of entities to check
   *  @param id - Entity id, if provided
   *  @param [query] - Optional query params
   */
  private async checkIfHasValidOrder(value: I[], id?: string | number, query?: IQueryParams): IMsgPromise<I | IDbMultipleResponse<I>> {
    if (value && value.length && hasItemsWithoutOrderOrWithEqualOrders(value)) {
      const reordered = await this.updateItemsOrder([], query);
      if (reordered.status >= 400) return reordered as IMsg;
      return this.Read(query, id as number | string, false);
    }
  }

  /**
   *  Workaround for Sequelize illogical behavior when quering with LEFT JOINS and having LIMIT / OFFSET
   *
   *  Here we group by 'id' prop of main (source) model, abd using undocumented 'includeIgnoreAttributes'
   *  Sequelize prop (it is used in its static count() method) in order to get correct SQL request
   *  Without usage of 'includeIgnoreAttributes' there are a lot of extra invalid columns in SELECT statement
   *
   *  Incorrect example without 'includeIgnoreAttributes'. Here we will get correct SQL query
   *  BUT useless according to business logic:
   *
   *  SELECT "Media"."id", "Solutions->MediaSolutions"."mediaId", "Industries->MediaIndustries"."mediaId",...,
   *  FROM "Medias" AS "Media"
   *  LEFT JOIN ...
   *  WHERE ...
   *  GROUP BY "Media"."id"
   *  ORDER BY ...
   *  LIMIT ...
   *  OFFSET ...
   *
   *  Correct example with 'includeIgnoreAttributes':
   *
   *  SELECT "Media"."id"
   *  FROM "Medias" AS "Media"
   *  LEFT JOIN ...
   *  WHERE ...
   *  GROUP BY "Media"."id"
   *  ORDER BY ...
   *  LIMIT ...
   *  OFFSET ...
   *
   *  @param query - Parsed and ready to use query object
   */
  private async fixSequeliseQueryWithLeftJoins(
    query: FindAndCountOptions,
  ): IMsgPromise<{ query: FindAndCountOptions; total?: number }> {
    try {
      await this.onBeforeFixSequeliseQueryWithLeftJoins(query);

      if (!query.include || !query.include.length) return msg.ok({ query });

      const fixedQuery: FindAndCountOptions = { ...query };

      // Here we need to put it to singular form,
      // because Sequelize gets singular form for models AS aliases in SQL query
      const modelAlias = singular(this.model.tableName);

      const firstQuery = {
        ...fixedQuery,
        group: [`${modelAlias}.id`],
        attributes: ['id'],
        raw: true,
        includeIgnoreAttributes: false,
        distinct: true,
      };

      // Ordering by joined table column - when ordering by joined data need to add it into the group
      if (Array.isArray(firstQuery.order)) {
        firstQuery.order.forEach((item) => {
          if ((item as GenericObject).length === 2) {
            firstQuery.group.push(`${modelAlias}.${(item as GenericObject)[0]}`);
          } else if ((item as GenericObject).length === 3) {
            firstQuery.group.push(`${(item as GenericObject)[0]}.${(item as GenericObject)[1]}`);
          }
        });
      }

      return this.model.findAndCountAll(firstQuery)
        .then((ids) => {
          if (ids && ids.rows && ids.rows.length) {
            fixedQuery.where = {
              ...fixedQuery.where,
              id: {
                [Op.in]: ids.rows.map((item: GenericObject) => item.id),
              },
            };
            delete fixedQuery.limit;
            delete fixedQuery.offset;
          }

          fixedQuery.distinct = true;

          /* eslint-disable-next-line */
          const total = Array.isArray(ids.count) ? (ids.count as any).length : ids.count;

          return msg.ok({ query: fixedQuery, total });
        })
        .catch((err) => this.createCustomError(err));
    } catch (err) {
      return this.createCustomError(err);
    }
  }

  /**
   *  Builds query for read operation
   *
   *  @param options - Custom query options
   *  @param [id] - Id or query to find by
   *  @param [model] - Model is necessary when we are going to add specific filter by some model
   *  Ex: by Tenant model. Also is necessary for filtering and ordering thought associations
   */
  private async buildQuery(options?: IQueryParams, id?: string | number): Promise<FindAndCountOptions> {
    const {
      limit, skip, sort, select, include = [] as unknown as Includeable[], filter,
      getBy = this.config.defaults.getBy, where,
    } = options;
    const query: FindAndCountOptions = { where: { } };

    if (id) query.where = { [getBy]: id };

    query.where = { ...query.where, ...this.softDeleteFilter };

    // General parsers
    this.attributesParser(select, query);
    this.includeParser(include, query);
    this.filterParser(id ? {} : filter, where, query);

    // For multiple DB query
    if (!id) {
      this.orderParser(sort, null, query);
      this.offsetParser(skip, query);
      this.limitParser(limit, query);
    }

    this.addSoftDeletedFilterToJoinedTables(query);

    return this.provideSpecificQuery(query);
  }

  /** Provides soft delete filter */
  private get softDeleteFilter(): WhereAttributeHash {
    return this.model.rawAttributes[this.config.defaults.isRemovedProp]
      ? { [this.config.defaults.isRemovedProp]: false }
      : { };
  }

  /* eslint-disable no-param-reassign */
  /**
   *  Parses include prop and produces array of include associations
   *
   *  @param include - Query string include param or custom include array (only from server code)
   *  @param [query] - Query object
   */
  private includeParser(include: Includeable[] | string, query?: FindAndCountOptions): IncludeOptions[] {
    let customInclude: IncludeOptions[] = [];

    if (typeof include === 'string') {
      const splited = include.split(',');
      splited.forEach((item) => customInclude.push(this.createAssociation(item)));
    }

    if (Array.isArray(include)) customInclude.push(...include as IncludeOptions[]);

    customInclude = this.provideIncludeOptions(customInclude);

    if (query && customInclude && customInclude.length) query.include = customInclude;

    return customInclude;
  }

  /**
   *  Parses skip prop to define DB query offset
   *
   *  @param skip - Number of records to skip
   *  @param [query] - Query object
   */
  private offsetParser(skip: number, query?: FindAndCountOptions): number {
    const offset = skip && !Number.isNaN(skip) ? +skip : 0;
    if (query) query.offset = offset;
    return offset;
  }

  /**
   *  Parses limit prop to define amount of records for DB query
   *
   *  @param limit - Number of records to query
   *  @param [query] - Query object
   */
  private limitParser(limit: number | string, query?: FindAndCountOptions): number {
    if (limit !== 'none') {
      const limitation = limit && !Number.isNaN(limit as number) ? +limit : this.config.defaults.limit;
      if (query) query.limit = limitation;
      return limitation;
    }
  }

  /**
   *  Parses attributes query string into array
   *
   *  @param select - String of attributes to include in DB query
   *  @param [query] - Query object
   */
  private attributesParser(select: string, query?: FindAndCountOptions): string[] {
    let attributes: string[] = [];
    if (select) attributes = select.split(',');
    if (query && attributes && attributes.length) query.attributes = attributes;
    return attributes;
  }

  /**
   *  Parses sort query string into object
   *
   *  @param sort - Sort query string
   *  @param [attributes] - Array of attributes to include in DB query.
   *  This one is necessary here in order to check if there is no field under which
   *  result is sorted in attributes and add it
   *  @param [query] - Query object. Attributes also could be picked here
   */
  private orderParser(
    sort: string, attributes?: ProjectionAlias[], query?: FindAndCountOptions,
  ): OrderItem[][] {
    const order: OrderItem[][] = [];

    if (sort) {
      const groups: string[] = sort.split(';');

      groups.forEach((item) => {
        const parts = item.split(',');
        const nestedItem = parts[0].split('.');
        // order.push([Sequelize.literal(`\`${parts[0]}\``), parts[1]]);
        order.push([...nestedItem, parts[1]]);
      });
    } else order.push(this.config.defaults.order);

    if (order.length && sort && (attributes || query.attributes)) {
      const attrs: FindAttributeOptions = attributes || query.attributes as ProjectionAlias[];

      order.forEach((item) => {
        const found = attrs.find((unit) => unit === item[0]);

        if (!found && attrs && attrs.length && Object.hasOwnProperty.call(this.model.rawAttributes, item[0])) {
          attrs.push(item[0] as string);
        }
      });
    }

    if (query) query.order = order as OrderItem[];

    return order;
  }

  /**
   *  Parses filter query string into object with filter props. THIS IS @next version of parser
   *  It is available if query param 'enFilter' is set to true
   *
   *  @param filter - Filter query param, parsed by qs parser (under the hood of express)
   *  @param [where] - Custom where conditions object, which could be provided with server code
   *  @param [query] - Query object
   */
  private filterParser(
    filter: GenericObject, where?: GenericObject, query?: FindAndCountOptions,
  ): WhereOptions {
    let parsedFilters: GenericObject = { ...filter };

    if (where && typeof where === 'object' && !isEmpty(where)) {
      parsedFilters = { ...parsedFilters, ...where };
    }

    parsedFilters = this.parseFiltersViaAssociations(parsedFilters, this.model.associations, query);

    if (query) query.where = { ...query.where, ...parsedFilters };

    return parsedFilters;
  }
  /* eslint-enable no-param-reassign */

  /**
   *  Parses object created from query string, to define and correctly
   *  convert 'solutions.id' like keys into appropriate for Sequelize
   *  (annotated with '$' at the start and end) -> '$solutions.id$'
   *
   *  @param filter - Object with filters created by qs.parse() + optional custom 'where'
   *  @param associations - Model associations, to validate input
   *  @param [query] - Query object
   */
  private parseFiltersViaAssociations(
    filter: GenericObject, associations: GenericObject, query?: FindAndCountOptions,
  ): WhereOptions {
    if (!filter) return filter;

    const parsedFilters: GenericObject = filter;

    Object.keys(parsedFilters).forEach((key) => {
      if (parsedFilters[key] && typeof parsedFilters[key] === 'object' && !Array.isArray(parsedFilters[key])) {
        this.parseFiltersViaAssociations(parsedFilters[key], associations, query);
      }

      if (key.indexOf('.') !== -1) {
        const splited = key.split('.');

        if (Object.keys(associations).includes(splited[0])) {
          // This one is necessary in order to JOIN table, thought which we are filtering
          if (query) {
            /* eslint-disable-next-line */
            if (!query.include) query.include = [];
            const included = query.include.find((item: GenericObject) => item.association === splited[0]);

            if (!included) {
              query.include.push({
                association: splited[0],
                duplicating: false,
                attributes: [],
              });
            }
          }

          parsedFilters[`$${key}$`] = parsedFilters[key];
          delete parsedFilters[key];
        }
      }
    });

    return this.parseOperators(parsedFilters);
  }

  /**
   *  Parses include param and adds SOFT_DELETE_PROPERTY to where conditions, if it exists on queried model.
   *
   *  @param query - Already parsed and ready for Sequelize usage query options
   */
  private addSoftDeletedFilterToJoinedTables(query: FindAndCountOptions): void {
    if (!query.include || !query.include.length) return;
    // if (this.model.name !== 'Tenant') console.log('include >>>', query.include);

    (query.include as IncludeOptions[]).forEach((item, i) => {
      if (!item.association || !this.model.associations[item.association as string]) return;

      /* eslint-disable-next-line */
      const association: any = this.model.associations[item.association as string];
      const through = association.through && association.through.model ? association.through.model : null;
      const { target } = association;

      /* eslint-disable no-param-reassign */
      // if (through && through.rawAttributes && through.rawAttributes[this.config.defaults.isRemovedProp]) {
      //   if (!item.where) item.where = { };
      //   (item.where as WhereAttributeHash)[this.config.defaults.isRemovedProp] = false;
      //   query.include[i] = item;
      // }

      // Add soft delete property into joined where query, if it is
      if (!through && target && target.rawAttributes && target.rawAttributes[this.config.defaults.isRemovedProp]) {
        if (!item.where) item.where = { };
        (item.where as WhereAttributeHash)[this.config.defaults.isRemovedProp] = false;
        item.required = false;
        query.include[i] = item;
      }

      // Sort joined query by order, if it is
      // if (!through && target && target.rawAttributes && target.rawAttributes.order) {
      //   if (!item.order) item.order = [];
      //   (item.order as any).push(['order', 'asc']);
      // }
      //
      // item.required = false;
      // query.include[i] = item;
    });

    // if (this.model.name !== 'Tenant') {
    //   console.log('include 2 >>>', query.include);
    //   query.include.forEach((item) => {
    //     console.log('item >>>', item);
    //   });
    // }
  }

  /**
   *  Creates pager appropriate result response*
   *
   *  @param value - Values to be returned
   *  @param total - Total amount of values
   *  @param query - Query object, where offset and limit for current request where defined
   */
  private convertIntoResponseWithPager<I>(
    value: I[], total: number, query: FindAndCountOptions,
  ): IDbMultipleResponse<I> {
    const nextSkip = +query.offset + +query.limit;

    const result: IDbMultipleResponse<I> = query.limit && total && nextSkip && total > nextSkip
      ? { nextSkip, total, value }
      : { total, value };

    if (!total) delete result.total;

    return result;
  }

  /**
   *  Parses object created from query string, to define and correctly
   *  convert '$gt' like operators into appropriate for Sequelize (Symbols)
   *
   *  @param obj - Object created by qs.parse()
   */
  private parseOperators(obj: GenericObject): GenericObject {
    const parseObj: GenericObject = { };

    if (Array.isArray(obj)) return obj;

    const parsed = parseTypes(obj);

    if (!parsed || isEmpty(parsed)) return parsed;

    Object.entries(parsed).forEach((item) => {
      const value = typeof item[1] === 'object' ? this.parseOperators(item[1]) : item[1];

      if (item[0].indexOf('$') === 0 && item[0].indexOf('.') === -1) {
        parseObj[(Op as GenericObject)[item[0].slice(1)]] = value;
      } else parseObj[item[0]] = value;
    });

    return parseObj;
  }

  /**
   *  Parses custom options for Create, Update, Delete operations.
   *
   *  @param customOptions - Original custom options.
   */
  private prepareCustomOptions<C extends IBaseSequelizeCrudRepositoryMethodOptions>(
    customOptions: C,
  ): { all: C; sequelize: C } {
    const result: { all: C; sequelize: C } = { all: { } as C, sequelize: { } as C };

    ['associate', 'transaction', 'replaceOnJoin', 'returnData'].forEach((item) => {
      if (!Object.hasOwnProperty.call(customOptions, item)) return;

      (result.all as GenericObject)[item] = (customOptions as GenericObject)[item];
    });

    if (customOptions.include) result.all.include = this.includeParser(customOptions.include) as unknown as string;
    if (customOptions.where) {
      const where = this.filterParser({ }, customOptions.where) as WhereAttributeHash;
      result.all.where = where;
      result.sequelize.where = where;
    }

    return result;
  }

  /**
   *  Converts response w/ Sequelize Model object into response w/ plain JS object
   *
   *  @param data - Model or list of models
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private sequelizeToPlainObject<C extends Model>(data: C): I;
  private sequelizeToPlainObject<C extends Model>(data: C[]): I[];
  private sequelizeToPlainObject<C extends Model>(data: C | C[]): I | I[] {
    if (!data) return data as any;

    if (Array.isArray(data)) {
      return data.map((item) => {
        if (item.get && typeof item.get === 'function') {
          return parseTypes(item.get({ plain: true })) as I;
        }
        return item as any;
      });
    }

    if (typeof data === 'object' && data.get && typeof data.get === 'function') {
      return parseTypes(data.get({ plain: true })) as I;
    }

    return data as any;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  /**
   *  Recursively iterates and add nested associations (include) strings into Sequelize IncludeOptions array.
   *
   *  @param association - Include string to be parsed
   */
  private createAssociation(association: string): IncludeOptions {
    const nested = association.split('.');
    const parent: IncludeOptions = { };
    if (nested.length === 1) parent.association = association;
    else {
      parent.association = nested.shift();
      (parent.include as IncludeOptions[]) = [];
      parent.include.push(this.createAssociation(nested.join('.')));
    }

    return parent;
  }

  /**
   *  Recursively iterates and updates nested includes.
   *
   *  @param includes - Already correctly parsed include array
   *  @param options - Options to include
   */
  private provideIncludeOptions(
    includes: IncludeOptions[], options: IncludeOptions = { duplicating: false },
  ): IncludeOptions[] {
    const result = [...includes];
    if (!result || !result.length) return;

    /* eslint-disable-next-line */
    // options = {
    //   ...options,
    //   where: { [this.config.defaults.isRemovedProp]: false },
    // };

    // 'duplicating: false' is necessary in order to correctly filter by associted tables with limit param
    result.forEach((_item, i) => {
      result[i] = { ...result[i], ...options };
      if (result[i].include) result[i].include = this.provideIncludeOptions(result[i].include as IncludeOptions[]);
    });

    return result;
  }

  /**
   *  Creates custom response error from default Sequelize error
   *
   *  @param err - Error
   */
  /* eslint-disable-next-line */
  private createCustomError(err: any): IMsg {
    // if (process.env.NODE_ENV !== 'production') logger.verbose(err, ['>>> DEV: PostgreSQL ERROR <<<']);
    // if (process.env.NODE_ENV !== 'production') console.log('>>> DEV: PostgreSQL ERROR <<<', err);
    if (process.env.NODE_ENV !== 'production') log.error(err, ['>>> ERROR in CrudRepository <<<']);
    const detailedError = err && err.parent ? `: ${err.parent.message}` : '';
    const customError = err.message + detailedError || { ...err.original, name: err.name };
    return msg.badRequest(customError);
  }
}
