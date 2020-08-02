import { Transaction, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';

/** Interface for DB multiple response */
export interface IDbMultipleResponse<T extends GenericObject = GenericObject> {
  value: T[];
  nextSkip?: number;
  total?: number;
}

/** Interface for bulk API response */
export interface ICrudBulkResponse<T extends GenericObject = GenericObject> {
  created?: T[];
  updated?: T[];
}

/** Inteface for Sequelize CRUD controller config */
export interface IBaseSequelizeCrudRepositoryConfig {
  defaults: {
    /** Removed property literal, which i used on DB models (for soft delete) */
    isRemovedProp: string;

    /** Defalt limit param for read operations. Defaults to 10 */
    limit: number;

    /** Defalt order param for read operations. Defaults to 'order,asc' */
    order: string[];

    /** Defalt param for read operations, by which to getBy. Defaults to 'id' */
    getBy: string;
  };
}

/**
 *  Interface for CRUD controller method options, which influence on adding association data and
 *  response object (whether to create association between tables, or return JOINed result).
 */
export interface IBaseSequelizeCrudRepositoryMethodOptions extends IQueryParams {
  /** Whether it is necessary to associate (create reference) if reference id list provided */
  associate?: boolean;

  /** Transaction for this query */
  transaction?: Transaction;

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

/** Interface for create options */
export interface ICreateOptions extends IBaseSequelizeCrudRepositoryMethodOptions, Omit<Partial<CreateOptions>, 'where' | 'include'> {}

/** Interface for update options */
export interface IUpdateOptions extends IBaseSequelizeCrudRepositoryMethodOptions, Omit<Partial<UpdateOptions>, 'where' | 'limit'> {}

/** Interface for delete options */
export interface IDeleteOptions extends Omit<IBaseSequelizeCrudRepositoryMethodOptions, 'limit'>, Omit<Partial<DestroyOptions>, 'where'> {}
