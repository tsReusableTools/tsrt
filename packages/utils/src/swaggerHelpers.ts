import {
  OK, CREATED, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, BAD_GATEWAY,
  GATEWAY_TIMEOUT, INTERNAL_SERVER_ERROR,
} from 'http-status';

import {
  ISwaggerResponsesConfig, ISwaggerParam, ISwaggerResponseSchema,
  ISwaggerResponseExample, ISwaggerResponse, ISwaggerApiResponse, ISwaggerConfig,
} from './types';
import { createDataStructure, capitalize } from './utils';
import { msg } from './msg';

/**
 *  Common response Model
 */
export const response = (data?: GenericAny, query = false): ISwaggerResponseSchema => (
  query
    ? {
      type: 'object',
      properties: {
        status: { type: 'integer', format: 'int32' },
        statusText: { type: 'string' },
        requestFrom: { type: 'string' },
        method: { type: 'string' },
        endPoint: { type: 'string' },
        params: { type: 'object', properties: { someQuery: { type: 'string' } } },
        data,
      },
      required: ['status', 'statusText', 'requestFrom', 'method', 'endPoint'],
    }
    : {
      type: 'object',
      properties: {
        status: { type: 'integer', format: 'int32' },
        statusText: { type: 'string' },
        requestFrom: { type: 'string' },
        method: { type: 'string' },
        endPoint: { type: 'string' },
        data,
      },
      required: ['status', 'statusText', 'requestFrom', 'method', 'endPoint'],
    }
);

/**
 *  Constructor for request params
 */
const createParam = (
  type: string, name: string, description: string,
  schema: GenericObject = { type: 'string' }, required = false,
): ISwaggerParam => ({
  description,
  name,
  schema,
  required,
  in: type,
});

/**
 *  Common request params constructor
 */
export const param = {
  /**
   *  Alias for query param
   */
  query: (
    name: string, descr: string, schema?: GenericObject,
    required?: boolean,
  ): ISwaggerParam => createParam('query', name, descr, schema, required),

  /**
   *  Alias for path param
   */
  path: (
    name: string, descr: string, schema?: GenericObject,
    required?: boolean,
  ): ISwaggerParam => createParam('path', name, descr, schema, required),

  /**
   *  Alias for header param
   */
  header: (
    name: string, descr: string, schema?: GenericObject,
    required?: boolean,
  ): ISwaggerParam => createParam('header', name, descr, schema, required),

  /**
   *  Alias for body param
   */
  body: (
    name: string, descr: string, schema?: GenericObject,
    required?: boolean,
  ): ISwaggerParam => createParam('body', name, descr, schema, required),
};

/**
 *  Common Authorization header param
 */
export const authHeader = [param.header(
  'Authorization',
  'If there is no active session in browser, '
  + 'it is necessary to provide correct token',
  { type: 'string', example: 'Bearer {place_your_token_here}' },
)];

/**
 *  Limit query param
 */
export const limit = param.query(
  'limit',
  'Number. Limits number of records. '
  + 'If limit === none -> will show all records. Default: 10',
);

/**
 *  Skip query param
 */
export const skip = param.query('skip', 'Number. Skip records.');

/**
 *  Select query param
 */
export const select = param
  .query('select', 'String values, separated by comma. Select properties (fields) to return.');

/**
 *  Filter query param
 */
// export const filter = param.query(
//   'filter',
//   'Filtering. Key-value pairs separated by comma. '
//   + '3rd optional prop -> operator. Example: filter=id,2 -> { id: 2 }. '
//   + 'Example: filter=id,$gte,2 -> { id: { $gte: 2 } }',
// );
export const filter = param.query(
  'filter',
  'Filtering. Object literal notated. Example: media?filter[id][$eq]=2&filter[title][$iLike]=%asd%'
  + ' will be converted to: { filter: { id: { eq: 2 }, title: { iLike: "%asd%" } } }',
);

/**
 *  GetBy query param
 */
export const getBy = param.query(
  'getBy',
  'String. Property to getBy in case if trying to get by id. '
  + 'Example: /api/v1/documents/{email}?getBy=email. '
  + 'Default: id',
);

/**
 *  Sort query param
 */
export const sort = param.query(
  'sort',
  'String values, separated by comma. Sort order for return values. Example: ?sort=email,asc. '
  + 'For nested sorting: ?sort=centers.id,asc. Default: id,asc',
);

/**
 *  Include query param
 */
export const include = param.query(
  'include',
  'For cases with nested associations to include. '
  + 'String values, separated by comma. Example: /api/v1/documents?include=locations,solutions',
);

/**
 *  Include query param
 */
export const withFiles = param.query(
  'withFiles',
  'Boolean. For APIs, where there are foreignKeys to files. '
  + 'True option will also join those files data int oresponse',
);

/**
 *  Common params for GET request
 */
export const commonGetParams = (exclude?: string[]): ISwaggerParam[] => {
  const params = [];

  if (!exclude) {
    params.push(limit);
    params.push(skip);
    params.push(select);
    params.push(filter);
    params.push(getBy);
    params.push(sort);
    params.push(include);
    params.push(withFiles);
  } else {
    if (!exclude.find((item) => item === 'limit')) params.push(limit);
    if (!exclude.find((item) => item === 'skip')) params.push(skip);
    if (!exclude.find((item) => item === 'select')) params.push(select);
    if (!exclude.find((item) => item === 'filter')) params.push(filter);
    if (!exclude.find((item) => item === 'getBy')) params.push(getBy);
    if (!exclude.find((item) => item === 'sort')) params.push(sort);
    if (!exclude.find((item) => item === 'include')) params.push(include);
    if (!exclude.find((item) => item === 'withFiles')) params.push(withFiles);
  }

  return params;
};

/**
 *  LocationId param, depending on path / query
 *
 *  @param [inPath=true] - Whether param is in path (not query)
 */
export const locationIdParam = (inPath = true): ISwaggerParam => ({
  in: inPath ? 'path' : 'query',
  name: 'locationId',
  description: inPath
    ? 'Location id'
    : 'Select for which locationId documents to return',
  schema: { type: 'string' },
  required: inPath,
});

/**
 *  Definitions Object
 */
export const definitions: GenericObject = { };

/**
 *  Creates data structure and write it into definitions
 *
 *  @param data - Object, for which to create structure
 *  @param [title] - Title for Model, it necessary to create a model definition
 */
export const createAndWriteDataStructure = <T extends GenericObject | string | number | boolean>(
  data: T, title?: string,
): GenericObject => {
  // Get structure
  const structure = !data ? createDataStructure('') : createDataStructure(data);

  // Write into definitions object
  if (title) definitions[title] = structure;
  // definitions[title] = response(structure);

  return structure;
};

/**
 *  Hardcode default requestFrom
 *
 *  @param [status] - Response status code
 *  @param [data] - Response data
 *  @param [endPoint] - Request api endPoint
 *  @param [method] - Request method
 *  @param [params] - Request query params
 *  @param [requestFrom=https://some_requestor.com] - Requestor
 */
export const example = (
  status?: number, data?: GenericAny, endPoint?: string, method?: string,
  params?: GenericObject, requestFrom = 'https://some_requestor.com',
): ISwaggerResponseExample => ({
  example: { ...msg.note(status, data, endPoint, method, requestFrom, params) },
});

/**
 *  Common ok response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 *  @param [title] - Title for Model, it necessary to create a model definition
 */
export const okRes = (
  endPoint: string, data?: GenericAny, method?: string, title?: string, multipleDb?: boolean,
): ISwaggerResponse => {
  const modifiedData = multipleDb ? { total: 100, nextSkip: 10, value: [data] } : data;
  return {
    [OK]: {
      description: 'OK',
      schema: {
        ...response(createAndWriteDataStructure(modifiedData, title)),
        ...example(OK, modifiedData, endPoint, method || 'GET'),
      },
    },
  };
};

/**
 *  Common created response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 *  @param [title] - Title for Model, it necessary to create a model definition
 */
export const createdRes = (
  endPoint: string, data?: GenericAny, method?: string, title?: string,
): ISwaggerResponse => ({
  [CREATED]: {
    description: 'Created',
    schema: {
      ...response(createAndWriteDataStructure(data, title)),
      ...example(CREATED, data, endPoint, method || 'GET'),
    },
  },
});

/**
 *  Common badRequest response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 */
export const badRequestRes = (
  endPoint: string, data?: GenericAny, method?: string,
): ISwaggerResponse => ({
  [BAD_REQUEST]: {
    description: 'Bad request',
    schema: {
      ...response(createAndWriteDataStructure(data)),
      ...example(BAD_REQUEST, data, endPoint, method || 'GET'),
    },
  },
});

/**
 *  Common unAuthorized response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 */
export const unAuthorizedRes = (
  endPoint: string, data?: GenericAny, method?: string,
): ISwaggerResponse => ({
  [UNAUTHORIZED]: {
    description: 'Unauthorized',
    schema: {
      ...response(createAndWriteDataStructure('')),
      ...example(UNAUTHORIZED, data || 'Unauthorized', endPoint, method || 'GET'),
    },
  },
});

/**
 *  Common forbidden response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 */
export const forbiddenRes = (
  endPoint: string, data?: GenericAny, method?: string,
): ISwaggerResponse => ({
  [FORBIDDEN]: {
    description: 'Forbidden',
    schema: {
      ...response(createAndWriteDataStructure(data)),
      ...example(FORBIDDEN, data, endPoint, method || 'GET'),
    },
  },
});

/**
 *  Common notFound response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 */
export const notFoundRes = (
  endPoint: string, data?: GenericAny, method?: string,
): ISwaggerResponse => ({
  [NOT_FOUND]: {
    description: 'Not Found',
    schema: {
      ...response(createAndWriteDataStructure(data)),
      ...example(NOT_FOUND, data, endPoint, method || 'GET'),
    },
  },
});

/**
 *  Common conflict response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 */
export const conflictRes = (
  endPoint: string, data?: GenericAny, method?: string,
): ISwaggerResponse => ({
  [CONFLICT]: {
    description: 'Conflict',
    schema: {
      ...response(createAndWriteDataStructure(data)),
      ...example(CONFLICT, data, endPoint, method || 'PUT'),
    },
  },
});

/**
 *  Common internalServerError response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 */
export const internalServerErrorRes = (
  endPoint: string, data?: GenericAny, method?: string,
): ISwaggerResponse => ({
  [INTERNAL_SERVER_ERROR]: {
    description: 'Internal Server Error',
    schema: {
      ...response(createAndWriteDataStructure(data)),
      ...example(INTERNAL_SERVER_ERROR, data, endPoint, method || 'GET'),
    },
  },
});

/**
 *  Common badGateway response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 */
export const badGatewayRes = (
  endPoint: string, data?: GenericAny, method?: string,
): ISwaggerResponse => ({
  [BAD_GATEWAY]: {
    description: 'Bad Gateway',
    schema: {
      ...response(createAndWriteDataStructure(data)),
      ...example(BAD_GATEWAY, data, endPoint, method || 'GET'),
    },
  },
});

/**
 *  Common gatewayTimeout response
 *
 *  @param endPoint - Request api endPoint
 *  @param [data] - Response data
 *  @param [method] - Request method
 */
export const gatewayTimeoutRes = (
  endPoint: string, data?: GenericAny, method?: string,
): ISwaggerResponse => ({
  [GATEWAY_TIMEOUT]: {
    description: 'Gateway Timeout',
    schema: {
      ...response(createAndWriteDataStructure(data)),
      ...example(GATEWAY_TIMEOUT, data, endPoint, method || 'GET'),
    },
  },
});

/**
 *  Common response object
 *
 *  @param opts - Configuration for responses
 */
export const responses = (opts: ISwaggerResponsesConfig): ISwaggerResponse => {
  const {
    url, title, method, ok, created, badRequest, unAuthorized,
    forbidden, notFound, conflict, badGateway, gatewayTimeout,
    internalServerError, multipleDb,
  } = opts;

  let results: ISwaggerResponse = { };

  // If OK (200)
  if (ok || ok === '' || opts[200] || opts[200] === '') {
    results = { ...results, ...okRes(url, ok || opts[200], method, title, multipleDb) };
  }

  // If CREATED (201)
  if (created || created === '' || opts[201] || opts[201] === '') {
    results = { ...results, ...createdRes(url, created || opts[201], method, title) };
  }

  // If BAD_REQUEST (400)
  if (badRequest || badRequest === '' || opts[400] || opts[400] === '') {
    results = { ...results, ...badRequestRes(url, badRequest || opts[400], method) };
  }

  // If UNAUTHORIZED (401) or If not info -> add unAuthorizedRes
  if (unAuthorized || unAuthorized === '' || opts[401] || opts[401] === '') {
    results = { ...results, ...unAuthorizedRes(url, unAuthorized || opts[401], method) };
  }

  // If FORBIDDEN (403)
  if (forbidden || forbidden === '' || opts[403] || opts[403] === '') {
    results = { ...results, ...forbiddenRes(url, forbidden || opts[403], method) };
  }

  // If NOT_FOUND (404)
  if (notFound || notFound === '' || opts[404] || opts[404] === '') {
    results = { ...results, ...notFoundRes(url, notFound || opts[404], method) };
  }

  // If CONFLICT (409)
  if (conflict || conflict === '' || opts[409] || opts[409] === '') {
    results = { ...results, ...conflictRes(url, conflict || opts[409], method) };
  }

  // If INTERNAL_SERVER_ERROR (500)
  if (internalServerError || internalServerError === '' || opts[500] || opts[500] === '') {
    results = {
      ...results,
      ...internalServerErrorRes(url, internalServerError || opts[500], method),
    };
  }

  // If BAD_GATEWAY (502)
  if (badGateway || badGateway === '' || opts[502] || opts[502] === '') {
    results = { ...results, ...badGatewayRes(url, badGateway || opts[502], method) };
  }

  // If GATEWAY_TIMEOUT (504)
  if (gatewayTimeout || gatewayTimeout === '' || opts[504] || opts[504] === '') {
    results = { ...results, ...badGatewayRes(url, badGateway || opts[504], method) };
  }

  return results;
};

/**
 *  Method for inserting config for common get all API
 *
 *  @param endPoint - API endpoint
 *  @param tag - Tag for this API
 *  @param data - Data for example response, response model and optionally for definition
 *  @param [exclude] - Array of query params to exclude from commonGetParams
 */
export const commonGetAllApi = (
  endPoint: string, tag: string, data: GenericAny, exclude?: string[],
): ISwaggerApiResponse => ({
  get: {
    tags: [tag],
    summary: `Get all ${String(tag).toLowerCase()}`,
    operationId: `get${capitalize(String(tag).toLowerCase())}`,
    parameters: [...authHeader, ...commonGetParams(exclude)],
    responses: responses({
      url: endPoint,
      multipleDb: true,
      ok: data,
      badRequest: '',
      unAuthorized: '',
      notFound: '',
      internalServerError: '',
    }),
  },
});

/**
 *  Method for inserting config for common get by id API
 *
 *  @param endPoint - API endpoint
 *  @param tag - Tag for this API
 *  @param data - Data for example response, response model and optionally for definition
 *  @param [exclude] - Array of query params to exclude from commonGetParams
 */
export const commonGetByIdApi = (
  endPoint: string, tag: string, data: GenericAny, exclude?: string[],
): ISwaggerApiResponse => ({
  get: {
    tags: [tag],
    summary: `Get ${String(tag).toLowerCase().replace(/s$/, '')} by id`,
    operationId: `get${capitalize(String(tag).toLowerCase()).replace(/s$/, '')}ById`,
    parameters: [
      param.path('id', 'Record id', null, true),
      ...authHeader,
      ...commonGetParams(exclude),
    ],
    responses: responses({
      url: endPoint,
      title: capitalize(String(tag).toLowerCase()).replace(/s$/, ''),
      ok: data,
      badRequest: '',
      unAuthorized: '',
      notFound: '',
      internalServerError: '',
    }),
  },
});

/**
 *  Method for inserting config for common post API
 *
 *  @param endPoint - API endpoint
 *  @param tag - Tag for this API
 *  @param data - Data for example response, response model and optionally for definition
 */
export const commonPostApi = (
  endPoint: string, tag: string, data: GenericAny,
): ISwaggerApiResponse => ({
  post: {
    tags: [tag],
    summary: `Create new ${String(tag).toLowerCase()}`,
    operationId: `create${capitalize(String(tag).toLowerCase())}`,
    parameters: [...authHeader],
    responses: responses({
      url: endPoint,
      created: data,
      badRequest: '',
      unAuthorized: '',
      internalServerError: '',
      badGateway: '',
    }),
  },
});

/**
 *  Method for inserting config for common put API
 *
 *  @param endPoint - API endpoint
 *  @param tag - Tag for this API
 *  @param data - Data for example response, response model and optionally for definition
 */
export const commonPutApi = (
  endPoint: string, tag: string, data: GenericAny,
): ISwaggerApiResponse => ({
  put: {
    tags: [tag],
    summary: `Update ${String(tag).toLowerCase()} by id`,
    operationId: `update${capitalize(String(tag).toLowerCase())}ById`,
    parameters: [
      param.path('id', 'Record id', null, true),
      ...authHeader,
    ],
    responses: responses({
      url: endPoint,
      ok: data,
      badRequest: '',
      unAuthorized: '',
      notFound: '',
      internalServerError: '',
      badGateway: '',
    }),
  },
});

/**
 *  Method for inserting config for common delete API
 *
 *  @param endPoint - API endpoint
 *  @param tag - Tag for this API
 */
export const commonDeleteApi = (
  endPoint: string, tag: string,
): ISwaggerApiResponse => ({
  delete: {
    tags: [tag],
    summary: `Delete ${String(tag).toLowerCase()} by id`,
    operationId: `delete${capitalize(String(tag).toLowerCase())}ById`,
    parameters: [
      param.path('id', 'Record id', null, true),
      ...authHeader,
    ],
    responses: responses({
      url: endPoint,
      ok: 'Deleted by {id}',
      badRequest: '',
      unAuthorized: '',
      notFound: '',
      internalServerError: '',
      badGateway: '',
    }),
  },
});

/**
 *  Method for inserting config for common CRUD API
 *
 *  @param endPoint - API endpoint
 *  @param tag - Tag for this API
 *  @param data - Data for example response, response model and optionally for definition
 *  @param [exclude] - Array of query params to exclude from commonGetParams
 */
export const commonApi = (
  endPoint: string, tag: string, data: GenericAny, exclude?: string[],
): { [x: string]: ISwaggerApiResponse } => ({
  [endPoint]: {
    ...commonPostApi(endPoint, tag, data),
    ...commonGetAllApi(endPoint, tag, data, exclude),
  },
  [`${endPoint}/{id}`]: {
    ...commonGetByIdApi(endPoint, tag, data, exclude),
    ...commonPutApi(endPoint, tag, data),
    ...commonDeleteApi(endPoint, tag),
  },
});

/**
 *  Method for creating common CRUD API config: tags, paths, definitions
 *
 *  @param config - Swagger config object to be modified
 *  @param endPoint - API endpoint
 *  @param tag - Tag for this API
 *  @param data - Data for example response, response model and optionally for definition
 *  @param [exclude] - Array of query params to exclude from commonGetParams
 */
export const addCommonApi = (
  config: ISwaggerConfig, endPoint: string, tag: string, data: GenericAny, exclude?: string[],
): ISwaggerConfig => {
  config.tags.push({
    name: tag,
    description: `${capitalize(String(tag).toLowerCase())} API`,
  });

  /* eslint-disable-next-line */
  config.paths = {
    ...config.paths,

    ...commonApi(endPoint, tag, data, exclude),
  };

  return config;
};
