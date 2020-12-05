import {
  ModelCtor, Model, Op, FindAndCountOptions, ProjectionAlias, FindAttributeOptions, OrderItem,
  WhereAttributeHash, IncludeOptions, WhereOptions, CreateOptions, UpdateOptions, Transaction, TransactionOptions,
} from 'sequelize';
// import { ModelCtor, Model } from 'sequelize-typescript';
import { singular } from 'pluralize';
import cloneDeep from 'lodash.clonedeep';

import {
  IOrderedItem, IPagedData, isEmpty, capitalize, parseTypes, reorderItemsInArray,
  hasItemsWithoutOrderOrWithEqualOrders, throwHttpError, createPagedData,
} from '@tsrt/utils';
import { log } from '@tsrt/logger';

import {
  IBaseRepositoryOptions, IBaseRepositoryExtendedOptions, IBaseRepositoryConfig, IBaseRepositoryDefaults,
  ICreateOptions, IReadOptions, IUpdateOptions, IDeleteOptions, IRestoreOptions, TransactionCallBack,
} from './interfaces';
import { defaultConfig } from './utils';

export class BaseRepository<I extends GenericObject = GenericObject, M extends Model = Model> {
  public constructor(
    public readonly model: ModelCtor<M>,
    protected readonly config?: Partial<IBaseRepositoryConfig>,
  ) {
    this.config = defaultConfig;
    if (config) this.config.defaults = { ...this.config.defaults, ...config.defaults };
  }

  public get pk(): string { return this.config?.defaults?.primaryKey ?? defaultConfig.defaults.primaryKey; }

  public get defaults(): IBaseRepositoryDefaults { return { ...(this.config?.defaults ?? defaultConfig.defaults) }; }

  /**
   *  Creates a transaction or executes a transaction callback
   *
   *  @param [options] - Transactions options
   *  @param [cb] - Transaction callback to be executed for managed transactions
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
  public async create(body: Partial<I> = { }, createOptions: ICreateOptions = { }, through: GenericObject = { }): Promise<I> {
    try {
      const customOptions: ICreateOptions = cloneDeep(createOptions);
      await this.onBeforeCreate(body, customOptions, through);
      const dataToSave = this.removeRestrictedPropertiesFromBody(body);
      const { where } = await this.buildQuery(customOptions);
      const options = this.retrieveSequelizeStaticMethodOptions(customOptions);

      const result = await this.model.create(dataToSave, { ...options, where } as CreateOptions);
      const resultWithAssociations = await this.insertAssociatedWithEntityDataFromBody(result as M, dataToSave, customOptions, through);
      return resultWithAssociations ?? this.mapSequelizeModelToPlainObject(result);
    } catch (err) {
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
    body: Array<Partial<I>>, createOptions?: ICreateOptions, through?: GenericObject,
  ): Promise<I[]> {
    if (!Array.isArray(body)) throwHttpError.badRequest('Please, provide a valid list of entities to create.');

    const transaction = await this.model.sequelize.transaction();

    try {
      const customOptions: ICreateOptions = cloneDeep(createOptions);
      await this.onBeforeBulkCreate(body, customOptions, through);
      const dataToSave = body.map((item) => this.removeRestrictedPropertiesFromBody(item));
      const options = this.retrieveSequelizeStaticMethodOptions(customOptions);
      const results = await this.model.bulkCreate<M>(dataToSave, { ...options, transaction } as CreateOptions);

      const insertOptions = { ...options, returnData: false };
      await Promise.all(results.map((item, i) => this.insertAssociatedWithEntityDataFromBody(item, dataToSave[i], insertOptions, through)));

      transaction.commit();
      return this.mapSequelizeModelToPlainObject(results);
    } catch (err) {
      transaction.rollback();
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Alias for common read operations. Works for both readOne and readMany.
   *
   *  @param [queryOptions] - Optional query params.
   *  @param [pk] - Optional Entity primaryKey.
   */
  public async read(readOptions?: IReadOptions): Promise<IPagedData<I>>;
  public async read(readOptions?: IReadOptions, pk?: number | string): Promise<I>;
  public async read(readOptions: IReadOptions = { }, pk?: number | string): Promise<I | IPagedData<I>> {
    return pk ? this.readOne(readOptions, pk) : this.readMany(readOptions);
  }

  /**
   *  Reads one record from Db.
   *
   *  @param [queryOptions] - Optional query params.
   *  @param pk - Entity primaryKey.
   */
  public async readOne(readOptions?: IReadOptions, pk?: number | string): Promise<I> {
    try {
      const options = { ...readOptions };

      await this.onBeforeRead(options, pk);

      const parsedQuery = await this.buildQuery(options, pk);
      const staticMethodOptions = this.retrieveSequelizeStaticMethodOptions(options) as FindAndCountOptions;
      const findQuery = { ...staticMethodOptions, ...parsedQuery };

      const result = await this.model.findOne(findQuery);
      if (!result) throwHttpError.notFound('Item not found');

      const value = this.mapSequelizeModelToPlainObject(result);

      if (hasItemsWithoutOrderOrWithEqualOrders([value])) {
        const reordered = await this.updateItemsOrder([], options);
        if (reordered) return this.readOne(options, pk);
      }

      return value;
    } catch (err) {
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Reads multiple entities from Db and returns paged response.
   *
   *  @param [options] - Optional query params.
   */
  public async readMany(readOptions: IReadOptions = { }): Promise<IPagedData<I>> {
    try {
      const options = { ...readOptions };

      await this.onBeforeRead(options);

      const parsedQuery = await this.buildQuery(options);
      const staticMethodOptions = this.retrieveSequelizeStaticMethodOptions(options) as FindAndCountOptions;
      const findQuery = { ...staticMethodOptions, ...parsedQuery };

      const fixedQuery = await this.fixSequeliseQueryWithLeftJoins(findQuery);
      const { query, total } = fixedQuery;

      const result = await this.model.findAndCountAll({ ...query });
      if (!result) throwHttpError.notFound('Items not found');

      const value = this.mapSequelizeModelToPlainObject(result.rows);

      if (hasItemsWithoutOrderOrWithEqualOrders(value)) {
        const reordered = await this.updateItemsOrder([], options);
        if (reordered) return this.readMany(options);
      }

      return createPagedData(value, total || result.count, findQuery);
    } catch (err) {
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
  public async update(body: Partial<I>, updateOptions: IUpdateOptions, through?: GenericObject): Promise<I[]>;
  public async update(body: Partial<I>, pk: number | string, updateOptions?: IUpdateOptions, through?: GenericObject): Promise<I>;
  public async update(
    body: Partial<I>, pk: number | string | IUpdateOptions, updateOptions: IUpdateOptions = { }, through: GenericObject = { },
  ): Promise<I | I[]> {
    try {
      if (!pk) throwHttpError.badRequest('Please, provide valid primaryKey or updateOptions');

      // Make type checking due to method overloading
      const genericOptions: IUpdateOptions = cloneDeep(typeof pk === 'object' ? pk : updateOptions) ?? { };
      const genericThrough: GenericObject = typeof pk === 'object' ? updateOptions : through;

      await this.onBeforeUpdate(body, typeof pk !== 'object' && pk, genericOptions, genericThrough);
      const dataToSave = this.removeRestrictedPropertiesFromBody(body);
      const { where } = await this.buildQuery(genericOptions, typeof pk !== 'object' && pk);
      const options = this.retrieveSequelizeStaticMethodOptions(genericOptions);

      // Do not use here `returning: true` because need solution not only for postgres.
      await this.model.update(dataToSave, { ...options, where } as UpdateOptions);

      const result = typeof pk !== 'object'
        ? await this.model.findOne({ where }) as M
        : await this.model.findAll({ where }) as M[];
      if (!result || (Array.isArray(result) && !result?.length)) throwHttpError.notFound();

      if (!Array.isArray(result)) return this.insertAssociatedWithEntityDataFromBody(result, dataToSave, genericOptions, genericThrough);
      return Promise.all(result.map((i) => this.insertAssociatedWithEntityDataFromBody(i, dataToSave, genericOptions, genericThrough)));
    } catch (err) {
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
  public async bulkUpdate(body: Array<Partial<I>>, updateOptions?: IUpdateOptions, through?: GenericObject): Promise<I[]> {
    if (!Array.isArray(body)) throwHttpError.badRequest('Please, provide a valid list of entities to update.');

    const transaction = await this.model.sequelize.transaction();

    try {
      const results: I[] = [];

      for (const item of body) {
        if (!item[this.pk]) throwHttpError.badRequest(`There should be an '${this.pk}' (primaryKey) property in each entity to update`);

        /* eslint-disable-next-line */
        const result = await this.update(item, item[this.pk], { ...updateOptions, transaction }, through);
        results.push(result);
      }

      transaction.commit();
      return results;
    } catch (err) {
      transaction.rollback();
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
  public async updateItemsOrder<C extends IOrderedItem>(body: C[], options: IReadOptions = { }): Promise<I[]> {
    if (!this.model?.rawAttributes || !this.model?.rawAttributes.order || !this.model?.rawAttributes[this.pk]) {
      throwHttpError.badRequest(`Unable to reorder entities without '${this.pk}'(primaryKey) or 'order' property`);
    }

    if (!Array.isArray(body)) throwHttpError.badRequest('Please, provide a valid list of entities to update.');

    const transaction = await this.createTransaction();

    try {
      const parsedQuery = await this.buildQuery({ ...options, limit: 'none' });
      const staticMethodOptions = this.retrieveSequelizeStaticMethodOptions(options) as FindAndCountOptions;
      const findQuery = { ...staticMethodOptions, ...parsedQuery };

      const available = await this.model.findAll({ ...findQuery });
      const availableValue = this.mapSequelizeModelToPlainObject(available);

      const reordered = reorderItemsInArray(body, availableValue as unknown as C[]);

      /* eslint-disable-next-line no-await-in-loop */
      for (const item of reordered) await this.model.update({ order: item.order }, { where: { [this.pk]: item[this.pk] }, transaction });

      transaction.commit();
      return reordered as unknown as I[];
    } catch (err) {
      transaction.rollback();
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Deletes entity by primaryKey.
   *  If `paranoid` mode is enabled - soft deletes. Alternatively deletes entity totally.
   *
   *  @param pk - Entity primaryKey.
   *  @param [deleteOptions] - Custom options for entity deletion.
   */
  public async delete(deleteOptions: IDeleteOptions): Promise<string>;
  public async delete(pk: string | number, deleteOptions?: IDeleteOptions): Promise<string>;
  public async delete(pk: string | number | IDeleteOptions, deleteOptions?: IDeleteOptions): Promise<string> {
    try {
      if (!pk) throwHttpError.badRequest('Please, provide at least valid primaryKey or deleteOptions');

      const genericOptions: IDeleteOptions = (typeof pk === 'object' ? pk : deleteOptions) || { };
      const customOptions: IDeleteOptions = { ...genericOptions, cascade: true };
      await this.onBeforeDelete(customOptions, typeof pk !== 'object' && pk);
      const { where } = await this.buildQuery(customOptions, typeof pk !== 'object' && pk) as UpdateOptions;
      const options = this.retrieveSequelizeStaticMethodOptions(customOptions);

      const result = await this.model.destroy({ ...options, where });
      if (!result) throwHttpError.badRequest(`Incorrect condition(s): ${JSON.stringify(where)}`);

      return typeof pk !== 'object' ? `Successfully deleted by primaryKey: ${pk}` : 'Successfully deleted by multiple conditions.';
    } catch (err) {
      this.throwCustomSequelizeError(err);
    }
  }

  /**
   *  Soft deletes entity by primaryKey (only if `paranoid` mode enabled). Alternatively deletes entity totally.
   *
   *  @param pk - Entity primaryKey.
   *  @param [deleteOptions] - Custom options for entity deletion.
   */
  public async softDelete(deleteOptions: IDeleteOptions): Promise<string>;
  public async softDelete(pk: string | number, deleteOptions?: IDeleteOptions): Promise<string>;
  public async softDelete(pk: string | number | IDeleteOptions, deleteOptions?: IDeleteOptions): Promise<string> {
    return typeof pk === 'object' ? this.delete({ ...pk, force: false }) : this.delete(pk, { ...deleteOptions, force: false });
  }

  /**
   *  Totally deletes entity by primaryKey.
   *
   *  @param pk - Entity primaryKey.
   *  @param [deleteOptions] - Custom options for entity deletion.
   */
  public async forceDelete(deleteOptions: IDeleteOptions): Promise<string>;
  public async forceDelete(pk: string | number, deleteOptions?: IDeleteOptions): Promise<string>;
  public async forceDelete(pk: string | number | IDeleteOptions, deleteOptions?: IDeleteOptions): Promise<string> {
    return typeof pk === 'object' ? this.delete({ ...pk, force: true }) : this.delete(pk, { ...deleteOptions, force: true });
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
   */
  protected async onAfterQueryBuilt(parsedQuery?: FindAndCountOptions): Promise<FindAndCountOptions> {
    return { ...parsedQuery };
  }

  /**
   *  Hook which invokes directly before create operation.
   *
   *  @param _body - Body for entity creation.
   *  @param [_customOptions] - Custom options for record creation.
   *  @param [_through] - Data to add into association for Many to Many relations.
   */
  protected async onBeforeCreate(_body: GenericObject, _customOptions?: ICreateOptions, _through?: GenericObject): Promise<void> { }

  /**
   *  Hook which invokes directly before bulk create operation.
   *
   *  @param _body - Body for record creation.
   *  @param [_customOptions] - Custom options for record creation.
   *  @param [_through] - Data to add into association for Many to Many relations.
   */
  protected async onBeforeBulkCreate(_body: GenericObject[], _customOptions?: ICreateOptions, _through?: GenericObject): Promise<void> { }

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
   *  @param _pk - Entity primaryKey or query. __Note__, it could be null.
   *  @param [_customOptions] - Custom options for record update.
   *  @param [_through] - Data to add into association for Many to Many relations.
   */
  protected async onBeforeUpdate(
    _body: GenericObject, _pk: number | string, _customOptions?: IUpdateOptions, _through?: GenericObject,
  ): Promise<void> { }

  /**
   *  Hook which invokes directly before delete operation.
   *
   *  @param [_customOptions] - Custom options for record (s) destroy.
   *  @param [_pk] - primaryKey.
   */
  protected async onBeforeDelete(_customOptions: IDeleteOptions, _pk?: number | string): Promise<void> { }

  /**
   *  Hook which fires right before adding associated data.
   *
   *  @param _entity - Previously created / updated entity.
   *  @param _body - Data / body to find associated data in.
   *  @param [_options] - Optional query params.
   *  @param [_through] - Data which should be added into associated entities (for Many to Many relations).
   */
  protected async onBeforeInsertAssociatedWithEntityDataFromBody(
    _entity: M, _body: GenericObject, _options?: IBaseRepositoryExtendedOptions, _through?: GenericObject,
  ): Promise<void> { }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  /* eslint-enable @typescript-eslint/no-empty-function */

  protected removeRestrictedPropertiesFromBody(body: Partial<I> = { }): Partial<I> {
    const result = { ...body };
    [this.pk, ...this.defaults.restrictedProperties].forEach((key) => { if (Object.hasOwnProperty.call(result, key)) delete result[key]; });
    return result;
  }

  /**
   *  Parses IBaseRepositoryOptions into Sequelize consumable FindAndCountOptions.
   *
   *  @param options - Custom options.
   *  @param [pk] - PrimaryKey.
   */
  private async buildQuery(options?: IBaseRepositoryOptions, pk?: string | number): Promise<FindAndCountOptions> {
    const { limit, skip, sort, select, include = [], filter, getBy = this.pk, where } = options;
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
  private async insertAssociatedWithEntityDataFromBody(
    entity: M, body: GenericObject, options?: IBaseRepositoryExtendedOptions, through?: GenericObject,
  ): Promise<I>;
  private async insertAssociatedWithEntityDataFromBody(
    entity: M, body: GenericObject, options?: IBaseRepositoryExtendedOptions & { returnData: false }, through?: GenericObject,
  ): Promise<void>;
  private async insertAssociatedWithEntityDataFromBody(
    entity: M, body: GenericObject, options?: IBaseRepositoryExtendedOptions, through: GenericObject = { },
  ): Promise<I | void> {
    try {
      if (!entity || !(entity as GenericObject)[this.pk]) return entity as unknown as I;

      await this.onBeforeInsertAssociatedWithEntityDataFromBody(entity, body, options, through);

      const insertionOptions: IBaseRepositoryExtendedOptions = { associate: true, replaceOnJoin: true, returnData: true, ...options };
      const data = isEmpty(through) ? { } : { through: { ...through } };
      let include: Array<string | IncludeOptions> = [];
      const promises: Array<Promise<void>> = [];

      Object.keys(this.model.associations).forEach((key) => {
        if (!body || !Object.keys(body).includes(key) || !body[key]) return;
        include.push(key);
        promises.push(this.addOrRemoveAssociatedWithEntityData(entity, key, data, body, insertionOptions));
      });

      if (promises.length) await Promise.all(promises);

      if (insertionOptions.include) include = include.concat(insertionOptions.include).filter(Boolean);
      if (!insertionOptions.returnData) { return; }

      return this.read({ ...options, include }, this.mapSequelizeModelToPlainObject(entity)[this.pk]);
    } catch (err) {
      this.throwCustomSequelizeError(err);
    }
  }

  private async addOrRemoveAssociatedWithEntityData(
    entity: M, key: string, through: GenericObject, body: GenericObject, options?: IBaseRepositoryExtendedOptions,
  ): Promise<void> {
    if (!Array.isArray(body[key]) || !options.associate) return;

    const allAssociatedEntities: GenericObject[] = await (entity as GenericObject)[`get${capitalize(key)}`]();
    const toRemoveArray = allAssociatedEntities.map((item) => +item[this.pk]).filter((item) => !body[key].includes(item));
    const toAddArray: number[] = [];

    body[key].forEach((item: number) => {
      const found = allAssociatedEntities.find((unit) => +unit[this.pk] === +item);
      if (!found) toAddArray.push(item);
    });

    if (options.replaceOnJoin) await (entity as GenericObject)[`remove${capitalize(key)}`](toRemoveArray);
    await (entity as GenericObject)[`add${capitalize(key)}`](toAddArray, through);
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
  private throwCustomSequelizeError(err: any): void {
    const message = this.createCustomSequelizeError(err);
    if (err.status) throwHttpError(err.status, message);
    else throwHttpError.badRequest(message);
  }

  /* eslint-disable-next-line */
  private createCustomSequelizeError(err: any): any {
    if (process.env.NODE_ENV !== 'production') log.debug(err, '>>> DEV: PostgreSQL ERROR <<<');
    const detailedError = err && err.parent ? `: ${err.parent.message}` : '';
    const customError = err.message + detailedError || { ...err.original, name: err.name };
    return customError;
  }
}
