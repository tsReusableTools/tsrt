import { CreateOptions, UpdateOptions, DestroyOptions, RestoreOptions, WhereAttributeHash } from 'sequelize';

export interface IBaseRepositoryConfig {
  defaults: {
    /** @deprecated. Old soft delete property name */
    isRemovedProp?: string;

    /** Defalt limit param for read operations. Defaults to 10 */
    limit: number;

    /** Defalt order param for read operations. Defaults to 'order,asc' */
    order: string[];

    /** Defalt param for read operations, by which to getBy. Defaults to 'id' */
    getBy: string;
  };
}

export interface IPagedData<T extends GenericObject = GenericObject> {
  value: T[];
  nextSkip?: number;
  total?: number;
}

export interface IBaseRepositoryOptions extends IQueryParams {
  where?: WhereAttributeHash;
}

/**
 *  Interface for CRUD controller method options, which influence on adding association data and
 *  response object (whether to create association between tables, or return JOINed result).
 */
export interface IBaseRepositoryExtendedOptions extends IBaseRepositoryOptions {
  /** Whether it is necessary to associate (create reference) if reference id list provided */
  associate?: boolean;

  /**
   *  Whether it should replace associatins w/ new reference list (delete and add).
   *
   *  Example for replaceOnJoin: true(default):
   *  Model.update({ id: 1, files: [1, 2, 3] }) -> after this query Model will
   *  be associated only w/ files w/ ids [1, 2, 3] even if previously it was associted w/ some others.
   *
   *  Example for replaceOnJoin: false:
   *  Model.update({ id: 1, files: [1, 2, 3] }) -> after this query Model will be associted w/ those files
   *  it was associated before + new unique ids (if they were unique in provided list).
   *  So if previously Model was associated with [1, 2, 4] Files, after query it will be: [1, 2, 3, 4].
   */
  replaceOnJoin?: boolean;

  /** Whether to return response data, after adding all associations. If false -> return empty response */
  returnData?: boolean;
}

/** Interface for possible options of create method */
export interface ICreateOptions extends IBaseRepositoryExtendedOptions, Omit<Partial<CreateOptions>, 'where' | 'include'> {}

/** Interface for possible options of update method */
export interface IUpdateOptions extends IBaseRepositoryExtendedOptions, Omit<Partial<UpdateOptions>, 'where' | 'limit'> {}

/** Interface for possible options of delete method */
export interface IDeleteOptions extends Omit<IBaseRepositoryOptions, 'limit'>, Omit<Partial<DestroyOptions>, 'where'> {}

/** Interface for possible options of restore method */
export interface IRestoreOptions extends Omit<IBaseRepositoryOptions, 'limit'>, Omit<Partial<RestoreOptions>, 'where'> {}
