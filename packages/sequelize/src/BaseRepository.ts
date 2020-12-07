import {
  ModelCtor, Model, Op, FindAndCountOptions, ProjectionAlias, FindAttributeOptions, OrderItem,
  WhereAttributeHash, IncludeOptions, WhereOptions, CreateOptions, UpdateOptions, Transaction, TransactionOptions,
} from 'sequelize';
// import { ModelCtor, Model } from 'sequelize-typescript';
import { singular } from 'pluralize';
import cloneDeep from 'lodash.clonedeep';

import {
  IPagedData, isEmpty, capitalize, parseTypes, throwHttpError, createPagedData, OrderingService, HttpError, isNil,
} from '@tsrt/utils';
import { log } from '@tsrt/logger';

import {
  IBaseRepositoryOptions, IBaseRepositoryExtendedOptions, IBaseRepositoryConfig, IBaseRepositoryDefaults,
  ICreateOptions, IReadOptions, IUpdateOptions, IDeleteOptions, IRestoreOptions, TransactionCallBack,
  IBulkCreateOptions, IBulkUpdateOptions, IBaseOrderingItem,
} from './interfaces';
import { defaultBaseRepositoryConfig } from './utils';

export class BaseRepository<
  I extends GenericObject & O,
  // R extends Partial<I> = Partial<I>,
  R = Partial<I>,
  O extends GenericObject = IBaseOrderingItem,
  M extends Model & Partial<I> = Model & Partial<I>,
> {
  protected readonly orderingService: OrderingService<O>;

  public constructor(
    public readonly model: ModelCtor<M>,
    protected readonly config?: Partial<IBaseRepositoryConfig>,
  ) {
    const {
      defaults: { limit, order, restrictedProperties, logError },
      orderingServiceConfig: { orderKey },
    } = defaultBaseRepositoryConfig;

    if (!this.config) this.config = defaultBaseRepositoryConfig;
    if (!this.config.defaults) this.config.defaults = defaultBaseRepositoryConfig.defaults;
    if (!this.config.defaults.limit) this.config.defaults.limit = limit;
    if (!this.config.defaults.order) this.config.defaults.order = order;
    if (!this.config.defaults.logError) this.config.defaults.logError = logError;
    if (!this.config.defaults.restrictedProperties) this.config.defaults.restrictedProperties = restrictedProperties;

    if (!this.config.orderingServiceConfig) this.config.orderingServiceConfig = defaultBaseRepositoryConfig.orderingServiceConfig;
    if (!this.config.orderingServiceConfig.orderKey) this.config.orderingServiceConfig.orderKey = orderKey;
    this.orderingService = new OrderingService<O>({ ...this.config.orderingServiceConfig, primaryKey: this.pk });
  }

  public get pk(): string { return this.model.primaryKeyAttribute; }

  /**
   *  Creates a transaction or executes a transaction callback.
   *
   *  @param [options] - Transactions options.
   *  @param [cb] - Transaction callback to be executed for managed transactions.
   *
   *  @see https://sequelize.org/master/manual/transactions
   */
  public async createTransaction(options?: TransactionOptions): Promise<Transaction>;
  public async createTransaction<T = I>(cb?: TransactionCallBack<T>): Promise<T>;
  public async createTransaction<T = I>(options?: TransactionOptions, cb?: TransactionCallBack<T>): Promise<T>;
  public async createTransaction<T = I>(
    optionsOrCb?: TransactionOptions | TransactionCallBack<T>, cb?: TransactionCallBack<T>,
  ): Promise<T | Transaction> {
    return typeof optionsOrCb === 'function'
      ? this.model.sequelize.transaction(optionsOrCb)
      : this.model.sequelize.transaction(optionsOrCb, cb);
  }

  /**
   *  Creates a new entity.
   *
   *  @param body - Entity data.
   *  @param [customOptions] - Custom options for entity creation. Include QueryParams and CreateOptions.
   *  @param [through] - Data to add into association for Many to Many relations.
   */
  public async create(body: R, createOptions: ICreateOptions = { }, through: GenericObject = { }): Promise<I> {
    if (isNil(body)) throwHttpError.badRequest('Body should not be null or undefined');
    const transaction = createOptions?.transaction ?? await this.createTransaction();

    try {
      const customOptions: ICreateOptions = cloneDeep(createOptions);
      await this.onBeforeCreate(body, customOptions, through);
      const dataToSave = this.removeRestrictedPropertiesFromBody(body);
      const { where } = await this.buildQuery(customOptions);
      const options = this.retrieveSequelizeStaticMethodOptions(customOptions);

      const created = await this.model.create<M>(dataToSave, { ...options, where, transaction } as CreateOptions);
      const result = await this.insertAssociations(created, dataToSave, { ...customOptions, transaction }, through);
      if (!createOptions?.transaction) await transaction.commit();
      return result;
    } catch (err) {
      if (!createOptions?.transaction) await transaction.rollback();
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Creates multiple entities from provided list (inside transaction).
   *
   *  @param body - List of entities to be created.
   *  @param [createOptions] - Custom options for record creation. Include QueryOptions and CreateOptions.
   *  @param [through] - Data to add into association for Many to Many relations.
   */
  public async bulkCreate(
    body: R[], createOptions?: IBulkCreateOptions, through?: GenericObject,
  ): Promise<I[]> {
    if (!Array.isArray(body)) throwHttpError.badRequest('Please, provide a valid list of entities to create.');
    const transaction = createOptions?.transaction ?? await this.createTransaction();

    try {
      if (body.find((item) => isNil(item))) throwHttpError.badRequest('Body should not be null or undefined');

      const customOptions: ICreateOptions = cloneDeep(createOptions);
      await this.onBeforeBulkCreate(body, customOptions, through);
      const dataToSave = body.map((item) => this.removeRestrictedPropertiesFromBody(item));
      const options = this.retrieveSequelizeStaticMethodOptions(customOptions);
      const results = await this.model.bulkCreate<M>(dataToSave, { ...options, transaction } as CreateOptions);

      const insertOptions = { ...options, transaction };
      const result = await Promise.all(results.map((item, i) => this.insertAssociations(item, dataToSave[i], insertOptions, through)));

      if (!createOptions?.transaction) await transaction.commit();
      if (createOptions && !createOptions.returnData) return;
      return result;
    } catch (err) {
      if (!createOptions?.transaction) await transaction.rollback();
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Alias for common read operations. Works for both readOne and readMany.
   *
   *  @param [readOptionsOrPk] - Optional read options or primaryKey.
   *  @param [readOptions] - Reqd options if primaryKey provided as first arument.
   *
   *  If entity has `orderKey` column, will ensure for each request that all entities for similar conditions
   *  have valid `orderKey` (no NULL(s) and duplicates).
   */
  public async read(readOptions?: IReadOptions): Promise<IPagedData<I>>;
  public async read(pk?: number | string, readOptions?: IReadOptions): Promise<I>;
  public async read(readOptionsOrPk: number | string | IReadOptions = { }, readOptions?: IReadOptions): Promise<I | IPagedData<I>> {
    // Make type checking due to method overloading
    const { genericPk, genericOptions } = this.getGenericOptionsAndPk(readOptionsOrPk, readOptions);
    return genericPk ? this.readOne(genericPk, genericOptions) : this.readMany(genericOptions);
  }

  /**
   *  Reads one record (by pk or options).
   *
   *  @param readOptionsOrPk - Read options or primaryKey.
   *  @param [readOptions] - Reqd options if primaryKey provided as first arument.
   *
   *  If entity has `orderKey` column, will ensure for each request that all entities for similar conditions
   *  have valid `orderKey` (no NULL(s) and duplicates).
   */
  public async readOne(readOptions: IReadOptions): Promise<I>;
  public async readOne(pk: number | string, readOptions?: IReadOptions): Promise<I>;
  public async readOne(readOptionsOrPk: number | string | IReadOptions, readOptions?: IReadOptions): Promise<I> {
    // Make type checking due to method overloading
    const { genericPk, genericOptions } = this.getGenericOptionsAndPk(readOptionsOrPk, readOptions);
    const transaction = genericOptions?.transaction ?? await this.createTransaction();

    try {
      await this.onBeforeRead(genericOptions, genericPk);

      const parsedQuery = await this.buildQuery(genericOptions, genericPk);
      const staticMethodOptions = this.retrieveSequelizeStaticMethodOptions(genericOptions) as FindAndCountOptions;
      const findQuery = { ...staticMethodOptions, ...parsedQuery, transaction };

      const result = await this.model.findOne(findQuery);
      if (!result) throwHttpError.notFound('Item not found');

      const value = this.mapSequelizeModelToPlainObject(result);

      if (this.model.rawAttributes[this.orderKey] && this.orderingService.hasDuplicateOrEmptyOrders([value])) {
        const reordered = await this.updateItemsOrder([], { ...genericOptions, transaction });
        if (reordered) return this.readOne(genericPk, { ...genericOptions, transaction });
      }

      if (!genericOptions?.transaction) await transaction.commit();
      return value;
    } catch (err) {
      if (!genericOptions?.transaction) await transaction.rollback();
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Reads multiple entities from Db and returns paged response.
   *
   *  @param [readOptions] - Optional read options.
   *
   *  If entity has `orderKey` column, will ensure for each request that all entities for similar conditions
   *  have valid `orderKey` (no NULL(s) and duplicates).
   */
  public async readMany(readOptions: IReadOptions = { }): Promise<IPagedData<I>> {
    const transaction = readOptions?.transaction ?? await this.createTransaction();

    try {
      const options = { ...readOptions };

      await this.onBeforeRead(options);

      const parsedQuery = await this.buildQuery(options);
      const staticMethodOptions = this.retrieveSequelizeStaticMethodOptions(options) as FindAndCountOptions;
      const findQuery = { ...staticMethodOptions, ...parsedQuery, transaction };

      const fixedQuery = await this.fixSequeliseQueryWithLeftJoins(findQuery);
      const { query, total } = fixedQuery;

      const result = await this.model.findAndCountAll({ ...query, transaction });
      if (!result) throwHttpError.notFound('Items not found');

      const value = this.mapSequelizeModelToPlainObject(result.rows);

      if (this.model.rawAttributes[this.orderKey] && this.orderingService.hasDuplicateOrEmptyOrders(value)) {
        const reordered = await this.updateItemsOrder([], { ...options, transaction });
        if (reordered) return this.readMany({ ...options, transaction });
      }

      if (!readOptions?.transaction) await transaction.commit();
      return createPagedData(value, total || result.count, findQuery);
    } catch (err) {
      if (!readOptions?.transaction) await transaction.rollback();
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Updates entity(ies).
   *
   *  @param body - Data to be updated.
   *  @param pk - Entity primaryKey or updateOptions.
   *  @param [updateOptions] - Custom options for updating operation or through.
   *  @param [through] - Data to add into association for Many to Many relations.
   */
  public async update(body: Partial<R>, updateOptions: IUpdateOptions, through?: GenericObject): Promise<I[]>;
  public async update(body: Partial<R>, pk: number | string, updateOptions?: IUpdateOptions, through?: GenericObject): Promise<I>;
  public async update(
    body: Partial<R>, updateOptionsOrPk: number | string | IUpdateOptions, updateOptions?: IUpdateOptions, through: GenericObject = { },
  ): Promise<I | I[]> {
    // Make type checking due to method overloading
    const { genericPk, genericOptions } = this.getGenericOptionsAndPk(updateOptionsOrPk, updateOptions);
    const genericThrough: GenericObject = (typeof updateOptionsOrPk === 'object' ? updateOptions : through) ?? { };
    const transaction = genericOptions?.transaction ?? await this.createTransaction();

    try {
      if (!updateOptionsOrPk) throwHttpError.badRequest('Please, provide valid primaryKey or updateOptions');

      await this.onBeforeUpdate(body, genericPk, genericOptions, genericThrough);
      const dataToSave = this.removeRestrictedPropertiesFromBody(body);
      const { where } = await this.buildQuery(genericOptions, genericPk);
      const options = this.retrieveSequelizeStaticMethodOptions(genericOptions);

      // Do not use here `returning: true` because need solution not only for postgres.
      await this.model.update(dataToSave, { ...options, where, transaction } as UpdateOptions);

      const updated = genericPk
        ? await this.model.findOne({ where, transaction }) as M
        : await this.model.findAll({ where, transaction }) as M[];
      if (!updated || (Array.isArray(updated) && !updated?.length)) throwHttpError.notFound();

      const insertOptions = { ...genericOptions, transaction };
      const result = !Array.isArray(updated)
        ? await this.insertAssociations(updated, dataToSave, insertOptions, genericThrough)
        : await Promise.all(updated.map((i) => this.insertAssociations(i, dataToSave, insertOptions, genericThrough)));
      if (!genericOptions?.transaction) await transaction.commit();
      return result;
    } catch (err) {
      if (!genericOptions?.transaction) await transaction.rollback();
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Updates multiple entities from provided list (inside transaction).
   *
   *  @param body - List of entities to be updated.
   *  @param [updateOptions] - Custom options for updating operation.
   *  @param [through] - Data to add into association for Many to Many relations.
   */
  public async bulkUpdate(body: Array<Partial<R>>, updateOptions?: IBulkUpdateOptions, through?: GenericObject): Promise<I[]> {
    if (!Array.isArray(body)) throwHttpError.badRequest('Please, provide a valid list of entities to update.');
    const transaction = updateOptions?.transaction ?? await this.createTransaction();

    try {
      const results: I[] = [];

      for (const item of body) {
        const pk = (item as GenericObject)[this.pk];
        if (!pk) throwHttpError.badRequest(`There should be an '${this.pk}' (primaryKey) property in each entity to update`);
        /* eslint-disable-next-line no-await-in-loop */
        const result = await this.update(item, pk, { ...updateOptions, transaction }, through);
        results.push(result);
      }

      if (!updateOptions?.transaction) await transaction.commit();
      if (updateOptions && !updateOptions.returnData) return;
      return results;
    } catch (err) {
      if (!updateOptions?.transaction) await transaction.rollback();
      if (err instanceof HttpError) throw err;
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Update entities order in DB (reordering).
   *
   *  @param body - Items with new orders or array of changes. Each item should contain at leaset order and primaryKey properties.
   *  @param [options] - Additional Query options
   *  @param [checkPermissions=true] - Whether to check permissions or not
   */
  public async updateItemsOrder<C extends Required<O>>(body: C[], options: IReadOptions = { }): Promise<I[]> {
    if (!this.model?.rawAttributes || !this.model?.rawAttributes[this.orderKey] || !this.model?.rawAttributes[this.pk]) {
      throwHttpError.badRequest(
        `Unable to reorder entities without '${this.pk}'(primaryKey) or '${this.orderKey}'(orderKey) property`,
      );
    }
    if (!Array.isArray(body)) throwHttpError.badRequest('Please, provide a valid list of entities to update.');
    const transaction = options?.transaction ?? await this.createTransaction();

    try {
      const parsedQuery = await this.buildQuery({ ...options, limit: 'none' });
      const staticMethodOptions = this.retrieveSequelizeStaticMethodOptions(options) as FindAndCountOptions;
      const findQuery = { ...staticMethodOptions, ...parsedQuery, transaction };

      const available = await this.model.findAll({ ...findQuery });
      const availableValue = this.mapSequelizeModelToPlainObject(available);

      const reordered = this.orderingService.reorder(availableValue as unknown as C[], body);

      for (const item of reordered) {
        /* eslint-disable-next-line no-await-in-loop */
        await this.model.update({ [this.orderKey]: item[this.orderKey] }, { where: { [this.pk]: item[this.pk] }, transaction });
      }

      if (!options?.transaction) await transaction.commit();
      return reordered as unknown as I[];
    } catch (err) {
      if (!options?.transaction) await transaction.rollback();
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Deletes entity by primaryKey.
   *  If `paranoid` mode is enabled - soft deletes. Alternatively deletes entity totally.
   *
   *  @param deleteOptionsOrPk - Entity primaryKey or deleteOptions.
   *  @param [deleteOptions] - Custom options for entity deletion if first argument is primaryKey.
   */
  public async delete(deleteOptions: IDeleteOptions): Promise<string>;
  public async delete(pk: string | number, deleteOptions?: IDeleteOptions): Promise<string>;
  public async delete(deleteOptionsOrPk: string | number | IDeleteOptions, deleteOptions?: IDeleteOptions): Promise<string> {
    try {
      if (!deleteOptionsOrPk) throwHttpError.badRequest('Please, provide at least valid primaryKey or deleteOptions');

      // Make type checking due to method overloading
      const { genericPk, genericOptions } = this.getGenericOptionsAndPk(deleteOptionsOrPk, deleteOptions, { cascade: true });

      await this.onBeforeDelete(genericOptions, genericPk);
      const { where } = await this.buildQuery(genericOptions, genericPk) as UpdateOptions;
      const options = this.retrieveSequelizeStaticMethodOptions(genericOptions);

      const result = await this.model.destroy({ ...options, where });
      if (!result) throwHttpError.badRequest(`Incorrect condition(s): ${JSON.stringify(where)}`);

      return genericPk ? `Successfully deleted by primaryKey: ${genericPk}` : 'Successfully deleted by multiple conditions.';
    } catch (err) {
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Soft deletes entity by primaryKey (only if `paranoid` mode enabled). Alternatively deletes entity totally.
   *
   *  @param deleteOptionsOrPk - Entity primaryKey or deleteOptions.
   *  @param [deleteOptions] - Custom options for entity deletion if first argument is primaryKey.
   */
  public async softDelete(deleteOptions: IDeleteOptions): Promise<string>;
  public async softDelete(pk: string | number, deleteOptions?: IDeleteOptions): Promise<string>;
  public async softDelete(deleteOptionsOrPk: string | number | IDeleteOptions, deleteOptions?: IDeleteOptions): Promise<string> {
    return typeof deleteOptionsOrPk === 'object'
      ? this.delete({ ...deleteOptionsOrPk, force: false })
      : this.delete(deleteOptionsOrPk, { ...deleteOptions, force: false });
  }

  /**
   *  Totally deletes entity by primaryKey.
   *
   *  @param deleteOptionsOrPk - Entity primaryKey or deleteOptions.
   *  @param [deleteOptions] - Custom options for entity deletion if first argument is primaryKey.
   */
  public async forceDelete(deleteOptions: IDeleteOptions): Promise<string>;
  public async forceDelete(pk: string | number, deleteOptions?: IDeleteOptions): Promise<string>;
  public async forceDelete(deleteOptionsOrPk: string | number | IDeleteOptions, deleteOptions?: IDeleteOptions): Promise<string> {
    return typeof deleteOptionsOrPk === 'object'
      ? this.delete({ ...deleteOptionsOrPk, force: true })
      : this.delete(deleteOptionsOrPk, { ...deleteOptions, force: true });
  }

  /**
   *  Restores soft deleted entity(-ies).
   *
   *  @param [restoreOptions] - Custom options for restore operation.
   */
  public async restore(restoreOptions?: IRestoreOptions): Promise<string> {
    try {
      const { where } = await this.buildQuery(restoreOptions);
      const options = this.retrieveSequelizeStaticMethodOptions(restoreOptions);

      await this.model.restore({ ...options, where });
      return `Successfully restores by conditions(s): ${JSON.stringify(where)}`;
    } catch (err) {
      this.throwCustomSequelizeError(err);
    }
  }

  // Hooks section //

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-function */
  /**
   *  Hook called after query was built.
   *
   *  @param [parsedQuery] - Previously parsed query params into Sequelize appropriate find and count options.
   *
   *  @note Unlike other hooks should return updated query.
   */
  protected async onAfterQueryBuilt(parsedQuery?: FindAndCountOptions): Promise<FindAndCountOptions> {
    return { ...parsedQuery };
  }

  /**
   *  Hook which invokes directly before create operation.
   *
   *  @param _body - Body for entity creation.
   *  @param [_createOptions] - Custom options for record creation.
   *  @param [_through] - Data to add into association for Many to Many relations.
   */
  protected async onBeforeCreate(_body: R, _createOptions?: ICreateOptions, _through?: GenericObject): Promise<void> { }

  /**
   *  Hook which invokes directly before bulk create operation.
   *
   *  @param _body - Body for record creation.
   *  @param [_createOptions] - Custom options for record creation.
   *  @param [_through] - Data to add into association for Many to Many relations.
   */
  protected async onBeforeBulkCreate(_body: R[], _createOptions?: ICreateOptions, _through?: GenericObject): Promise<void> { }

  /**
   *  Hook which invokes directly before read operations.
   *
   *  @param [_options] - Read options.
   *  @param [_pk] - PrimaryKey.
   */
  protected async onBeforeRead(_options?: IReadOptions, _pk?: string | number | boolean): Promise<void> { }

  /**
   *  Hook which invokes directly before update operation.
   *
   *  @param _body - Body for record creation.
   *  @param _pk - Entity primaryKey or query.
   *  @param [_updateOptions] - Custom options for record update.
   *  @param [_through] - Data to add into association for Many to Many relations.
   *
   *  @note `_pk` arg could be null.
   */
  protected async onBeforeUpdate(
    _body: Partial<R>, _pk: number | string, _updateOptions?: IUpdateOptions, _through?: GenericObject,
  ): Promise<void> { }

  /**
   *  Hook which invokes directly before delete operation.
   *
   *  @param [_deleteOptions] - Custom options for record (s) destroy.
   *  @param [_pk] - primaryKey.
   */
  protected async onBeforeDelete(_deleteOptions: IDeleteOptions, _pk?: number | string): Promise<void> { }

  /**
   *  Hook which fires right before adding associated data.
   *
   *  @param _entity - Previously created / updated entity.
   *  @param _body - Data / body to find associated data in.
   *  @param [_insertOptions] - Optional params.
   *  @param [_through] - Data which should be added into associated entities (for Many to Many relations).
   */
  protected async onBeforeInsertAssociatedWithEntityDataFromBody(
    _entity: M, _body: GenericObject, _insertOptions?: IBaseRepositoryExtendedOptions, _through?: GenericObject,
  ): Promise<void> { }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  /* eslint-enable @typescript-eslint/no-empty-function */

  protected get defaults(): IBaseRepositoryDefaults {
    return { ...(this.config?.defaults ?? defaultBaseRepositoryConfig.defaults) } as IBaseRepositoryDefaults;
  }

  protected get orderKey(): string {
    return this.config.orderingServiceConfig?.orderKey ?? defaultBaseRepositoryConfig.orderingServiceConfig.orderKey;
  }

  protected removeRestrictedPropertiesFromBody(body: Partial<R> = { }): Partial<R> {
    const result = { ...body };
    [this.pk, ...this.defaults.restrictedProperties].forEach((key) => {
      if (Object.hasOwnProperty.call(result, key)) delete (result as GenericObject)[key];
    });
    return result;
  }

  protected getGenericOptionsAndPk<T extends GenericObject>(
    optionsOrPk: string | number | T, options?: T, additionalOpts: Partial<T> = { },
  ): { genericOptions: T; genericPk?: string | number | null } {
    const genericPk = typeof optionsOrPk !== 'object' ? optionsOrPk : null;
    const genericOptions = (typeof optionsOrPk === 'object' ? optionsOrPk : options) ?? { } as T;
    if (additionalOpts) Object.entries(additionalOpts).forEach(([key, value]) => { (genericOptions as GenericObject)[key] = value; });
    return { genericPk, genericOptions };
  }

  /**
   *  Parses IBaseRepositoryOptions into Sequelize consumable FindAndCountOptions.
   *
   *  @param options - Custom options.
   *  @param [pk] - PrimaryKey.
   */
  protected async buildQuery(options?: IBaseRepositoryOptions, pk?: string | number): Promise<FindAndCountOptions> {
    const { limit, skip, sort, select, include = [], filter, getBy = this.pk, where } = cloneDeep(options);
    const query: FindAndCountOptions = { where: { } };

    if (pk) query.where = { [getBy]: pk };

    this.attributesParser(select, query);
    this.includeParser(include, query);
    this.filterParser(pk ? { } : filter, where, query);

    if (!pk) {
      this.orderParser(sort, null, query);
      this.offsetParser(skip, query);
      this.limitParser(limit, query);
    }

    return this.onAfterQueryBuilt(query);
  }

  /* eslint-disable no-param-reassign */
  private attributesParser(select: string | string[], query?: FindAndCountOptions): string[] {
    let attributes: string[] = [];
    if (select) attributes = Array.isArray(select) ? [...select] : String(select).split(',');
    if (attributes) attributes = attributes.map((item) => String(item).trim());
    if (query && attributes && attributes.length) query.attributes = attributes;
    return attributes;
  }

  private includeParser(include: string | Array<string | IncludeOptions>, query?: FindAndCountOptions): IncludeOptions[] {
    let customInclude: IncludeOptions[] = [];

    let list: Array<string | IncludeOptions> = typeof include === 'string' ? String(include).split(',') : cloneDeep(include);
    list = list.map((item) => (typeof item === 'string' ? String(item).trim() : item)).filter(Boolean);
    list.forEach((item) => customInclude.push(typeof item === 'string' ? this.createSequelizeAssociations(item) : item));

    customInclude = this.insertNecessaryIncludeOptions(customInclude);
    if (query && customInclude && customInclude.length) query.include = customInclude;

    return customInclude;
  }

  private orderParser(
    sort: string | string[], attributes?: ProjectionAlias[], query?: FindAndCountOptions,
  ): OrderItem[][] {
    const order: OrderItem[][] = [];

    if (sort && (typeof sort === 'string' || Array.isArray(sort))) {
      let groups: string[] = Array.isArray(sort) ? [...sort] : String(sort).split(',');
      groups = groups.map((item) => String(item).trim());

      groups.forEach((keyValuePair) => {
        const [key, value] = String(keyValuePair).trim().split(':');
        if (!key || !value) {
          throwHttpError.badRequest('Invalid `sort` query param provided. The following syntax is allowed - `property:direction`');
        }
        const listOfNestedKeys = key.trim().split('.');
        order.push([...listOfNestedKeys, value.trim()]);
      });
    } else order.push(this.defaults.order ?? [this.pk, 'asc']);

    if (order.length && sort && (attributes || query.attributes)) {
      const attrs: FindAttributeOptions = attributes || query.attributes as ProjectionAlias[];

      order.forEach((orderItem) => {
        const found = attrs.find((unit) => unit === orderItem[0]);

        if (!found && attrs && attrs.length && Object.hasOwnProperty.call(this.model.rawAttributes, orderItem[0])) {
          attrs.push(orderItem[0] as string);
        }
      });
    }

    if (query) query.order = order as OrderItem[];

    return order;
  }

  private offsetParser(skip: number, query?: FindAndCountOptions): number {
    const offset = skip && !Number.isNaN(+skip) ? +skip : 0;
    if (query) query.offset = offset;
    return offset;
  }

  private limitParser(limit: number | string, query?: FindAndCountOptions): number {
    if (limit !== 'none') {
      const limitation = limit && !Number.isNaN(+limit) ? +limit : this.config.defaults.limit;
      if (query) query.limit = limitation;
      return limitation;
    }
  }

  private filterParser(
    filter: GenericObject, where: GenericObject, query?: FindAndCountOptions,
  ): WhereAttributeHash {
    let parsedFilters: GenericObject = typeof filter === 'object' ? { ...filter } : { };
    if (where && typeof where === 'object' && !isEmpty(where)) parsedFilters = { ...parsedFilters, ...where };
    parsedFilters = this.parseQueryFiltersWithNestedAssociationsLiterals(parsedFilters, this.model.associations, query);
    if (query) query.where = { ...query.where, ...parsedFilters };
    return parsedFilters;
  }

  /**
   *  Parses object created from queryString, to define and correctly
   *  convert 'solutions.someColumn' like keys into appropriate for Sequelize
   *  (annotated with '$' at the start and end) -> '$solutions.someColumn$'
   *
   *  @param filter - Object with filters created by qs.parse() + optional custom 'where'
   *  @param associations - Model associations, to validate input
   *  @param [query] - Query object
   */
  private parseQueryFiltersWithNestedAssociationsLiterals(
    filter: GenericObject, associations: GenericObject, query?: FindAndCountOptions,
  ): WhereOptions {
    if (!filter) return filter;

    const parsedFilters: GenericObject = filter;

    Object.keys(parsedFilters).forEach((key) => {
      if (parsedFilters[key] && typeof parsedFilters[key] === 'object' && !Array.isArray(parsedFilters[key])) {
        this.parseQueryFiltersWithNestedAssociationsLiterals(parsedFilters[key], associations, query);
      }

      if (key.indexOf('.') !== -1) {
        const [association] = String(key).split('.');

        if (Object.keys(associations).includes(association)) {
          // This one is necessary in order to JOIN table, throught which we are filtering
          if (query) {
            if (!query.include) query.include = [];
            const included = query.include.find((item: IncludeOptions) => item.association === association);

            if (!included) {
              query.include.push({
                association,
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

    return this.parseSequelizeQueryOperators(parsedFilters);
  }
  /* eslint-enable no-param-reassign */

  /**
   *  Parses object created from query string, to define and correctly
   *  convert '$gt' like operators into appropriate for Sequelize (Symbols)
   *
   *  @param parsedQueryObject - Object created by qs.parse().
   */
  private parseSequelizeQueryOperators(parsedQueryObject: GenericObject): GenericObject {
    const parsedOperators: GenericObject = { };

    if (Array.isArray(parsedQueryObject)) return parsedQueryObject;

    const parsed = parseTypes(parsedQueryObject);
    if (!parsed || isEmpty(parsed)) return parsed;

    Object.entries(parsed).forEach(([key, value]) => {
      const parsedValue = typeof value === 'object' ? this.parseSequelizeQueryOperators(value) : value;
      if (key.indexOf('$') === 0 && key.indexOf('.') === -1) parsedOperators[(Op as GenericObject)[key.slice(1)]] = parsedValue;
      else parsedOperators[key] = parsedValue;
    });

    return parsedOperators;
  }

  /**
   *  Recursively iterates and adds nested associations (include) strings into Sequelize IncludeOptions array.
   *
   *  @param association - Include string to be parsed
   */
  private createSequelizeAssociations(association: string): IncludeOptions {
    if (!association) throwHttpError.badRequest(`Invalid association alias \`${association}\``);

    const nestedAssociations = String(association).split('.');
    const parentAssociation: IncludeOptions = { };
    if (nestedAssociations.length === 1) parentAssociation.association = association;
    else {
      parentAssociation.association = nestedAssociations.shift();
      parentAssociation.include = [this.createSequelizeAssociations(nestedAssociations.join('.'))];
    }

    return parentAssociation;
  }

  /**
   *  Recursively iterates and updates nested includes.
   *
   *  @note !! 'duplicating: false' is necessary in order to correctly filter by associted tables with limit param.
   *
   *  @param includes - Already correctly parsed include array.
   *  @param options - Options to include.
   */
  private insertNecessaryIncludeOptions(
    includes: IncludeOptions[], options: IncludeOptions = { },
  ): IncludeOptions[] {
    const result = [...includes];
    if (!result || !result.length) return;

    result.forEach((_item, i) => {
      result[i] = { ...result[i], duplicating: false, ...options };
      if (result[i].include) result[i].include = this.insertNecessaryIncludeOptions(result[i].include as IncludeOptions[]);
    });

    return result;
  }

  /**
   *  Inserts into Db data from body, if it is associated with this.model.
   *
   *  @param entity - Previously created / updated entity.
   *  @param body - Data / body to find associated data in.
   *  @param [options] - Optional query params.
   *  @param [through] - Data which should be added into associated entities (for Many to Many relations).
   */
  private async insertAssociations(
    entity: M, body: GenericObject, options?: IBaseRepositoryExtendedOptions, through: GenericObject = { },
  ): Promise<I> {
    try {
      if (!entity || !(entity as GenericObject)[this.pk]) return entity as unknown as I;

      await this.onBeforeInsertAssociatedWithEntityDataFromBody(entity, body, options, through);

      const insertionOptions: IBaseRepositoryExtendedOptions = { associate: true, replaceAssociations: true, returnData: true, ...options };
      const data = isEmpty(through) ? { } : { through: { ...through } };
      let include: Array<string | IncludeOptions> = [];
      const promises: Array<Promise<void>> = [];

      Object.keys(this.model.associations).forEach((key) => {
        if (!body || !Object.keys(body).includes(key) || !body[key]) return;
        // if (!body && !Array.isArray(body[key]) && !Array.isArray(body[`${key}${this.defaults.relationPksSuffix}`])) return;
        include.push(key);
        promises.push(this.addOrRemoveAssociation(entity, key, data, body[key], insertionOptions));
      });

      if (promises.length) await Promise.all(promises);
      if (insertionOptions.include) include = include.concat(insertionOptions.include).filter(Boolean);
      if (!insertionOptions.returnData) { return; }

      return this.readOne(this.mapSequelizeModelToPlainObject(entity)[this.pk], { ...options, include });
    } catch (err) {
      this.throwCustomSequelizeError(err);
    }
  }

  private async addOrRemoveAssociation(
    entity: M, key: string, through: GenericObject, association: Array<number | string>, options?: IBaseRepositoryExtendedOptions,
  ): Promise<void> {
    if (!Array.isArray(association) || !options.associate) return;

    const opts = { transaction: options.transaction };
    const allAssociatedEntities: GenericObject[] = await (entity as GenericObject)[`get${capitalize(key)}`](opts);

    const newIds = parseTypes(association);
    const existingIds: Array<number | string> = parseTypes(allAssociatedEntities.map((item) => item[this.pk]));

    const toRemoveArray = existingIds.filter((item) => !newIds.includes(item));
    const toAddArray = newIds.filter((item) => !existingIds.includes(item));

    if (options.replaceAssociations) await (entity as GenericObject)[`remove${capitalize(key)}`](toRemoveArray, opts);
    await (entity as GenericObject)[`add${capitalize(key)}`](toAddArray, { ...opts, through });
  }

  private retrieveSequelizeStaticMethodOptions<T extends IBaseRepositoryExtendedOptions>(options: T): T {
    const result: T = { ...options };
    ['limit', 'skip', 'select', 'getBy', 'sort', 'include', 'filter', 'where'].forEach((item) => {
      if (Object.hasOwnProperty.call(result, item)) delete (result as GenericObject)[item];
    });
    return result;
  }

  private mapSequelizeModelToPlainObject<C extends Model>(data: C): I;
  private mapSequelizeModelToPlainObject<C extends Model>(data: C[]): I[];
  private mapSequelizeModelToPlainObject<C extends Model>(data: C | C[]): I | I[] {
    if (!data) return data as unknown as I | I[];

    if (Array.isArray(data)) {
      return data.map((item) => {
        if (item.get && typeof item.get === 'function') {
          return parseTypes(item.get({ plain: true })) as I;
        }
        return item as unknown as I;
      });
    }

    if (typeof data === 'object' && data.get && typeof data.get === 'function') {
      return parseTypes(data.get({ plain: true })) as I;
    }

    return data as unknown as I;
  }

  /**
   *  Workaround for Sequelize illogical behavior when quering with LEFT JOINS and having LIMIT / OFFSET
   *
   *  Here we group by 'primaryKey' prop of main (source) model, abd using undocumented 'includeIgnoreAttributes'
   *  Sequelize prop (it is used in its static count() method) in order to get correct SQL request
   *  Without usage of 'includeIgnoreAttributes' there are a lot of extra invalid columns in SELECT statement
   *
   *  Incorrect example without 'includeIgnoreAttributes'. Here we will get correct SQL query
   *  BUT useless according to business logic:
   *
   *  SELECT "Media"."primaryKey", "Solutions->MediaSolutions"."mediaId", "Industries->MediaIndustries"."mediaId",...,
   *  FROM "Medias" AS "Media"
   *  LEFT JOIN ...
   *  WHERE ...
   *  GROUP BY "Media"."primaryKey"
   *  ORDER BY ...
   *  LIMIT ...
   *  OFFSET ...
   *
   *  Correct example with 'includeIgnoreAttributes':
   *
   *  SELECT "Media"."primaryKey"
   *  FROM "Medias" AS "Media"
   *  LEFT JOIN ...
   *  WHERE ...
   *  GROUP BY "Media"."primaryKey"
   *  ORDER BY ...
   *  LIMIT ...
   *  OFFSET ...
   *
   *  @param query - Parsed and ready to use query object
   */
  private async fixSequeliseQueryWithLeftJoins(query: FindAndCountOptions): Promise<{ query: FindAndCountOptions; total?: number }> {
    try {
      if (!query.include || !query.include.length) return { query };

      const fixedQuery: FindAndCountOptions = { ...query };

      // Here we need to put it to singular form,
      // because Sequelize gets singular form for models AS aliases in SQL query
      const modelAlias = singular(this.model.tableName);

      const firstQuery = {
        ...fixedQuery,
        group: [`${modelAlias}.${this.pk}`],
        attributes: [this.pk],
        raw: true,
        includeIgnoreAttributes: false,
        distinct: true,
      };

      // Ordering by joined table column - when ordering by joined data need to add it into the group
      if (Array.isArray(firstQuery.order)) {
        firstQuery.order.forEach((item) => {
          const orderItem = item as GenericObject;
          if (orderItem.length === 2) firstQuery.group.push(`${modelAlias}.${orderItem[0]}`);
          else if (orderItem.length === 3) firstQuery.group.push(`${orderItem[0]}.${orderItem[1]}`);
        });
      }

      const ids = await this.model.findAndCountAll(firstQuery);

      fixedQuery.distinct = true;

      if (ids && ids.rows && ids.rows.length) {
        fixedQuery.where = {
          ...fixedQuery.where,
          [this.pk]: {
            [Op.in]: ids.rows.map((item: GenericObject) => item[this.pk]),
          },
        };
        delete fixedQuery.limit;
        delete fixedQuery.offset;
      }

      return { query: fixedQuery, total: Array.isArray(ids.count) ? ids.count.length : ids.count };
    } catch (err) {
      this.throwCustomSequelizeError(err);
    }
  }

  /* eslint-disable-next-line */
  protected throwCustomSequelizeError(err: any): void {
    const message = this.createCustomSequelizeError(err);
    if (err.status) throwHttpError(err.status, message);
    else throwHttpError.badRequest(message);
  }

  /* eslint-disable-next-line */
  protected createCustomSequelizeError(err: any): any {
    if (this.defaults.logError) log.debug(err, 'Error occured in BaseRepository');
    const detailedError = err && err.parent ? `: ${err.parent.message}` : '';
    const customError = err.message + detailedError || { ...err.original, name: err.name };
    return customError;
  }
}
