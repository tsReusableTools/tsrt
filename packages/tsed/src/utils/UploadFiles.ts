/* eslint-disable @typescript-eslint/no-explicit-any */
import { Store, useDecorators } from '@tsed/core';
import { ParamMetadata, ParamTypes, EndpointMetadata, Use } from '@tsed/common';
import { JsonEntityFn, JsonParameter, JsonEntityStore, JsonSchema } from '@tsed/schema';
import { AnyDecorator } from '@tsed/core/lib/interfaces/AnyDecorator';

import { MpartyMiddleware, IMpartyMiddlewareOptions } from '@tsrt/mparty-express';

export type ContentTypes = 'multipart/form-data' | 'application/json' | string;

export interface IUploadFileOptions extends IMpartyMiddlewareOptions {
  // consumes?: [ContentTypes?, ContentTypes?],
  consumes?: ContentTypes[];
  useUploader?: boolean;
}

export type IFileOption = string | {
  fieldName: string;
  multiple?: boolean;
};

function getBody(store: JsonEntityStore): ParamMetadata {
  // const body = Array.from(store.children.values()).find((item: ParamMetadata) => item.paramType === ParamTypes.BODY) as ParamMetadata;
  // if (!body) createBody(store);
  return Array.from(store.children.values()).find((item: ParamMetadata) => item.paramType === ParamTypes.BODY) as ParamMetadata;
}

function getOneFileSchema(): Record<string, any> {
  return { type: 'string', format: 'binary' };
}

function getMultipleFilesSchema(): Record<string, any> {
  return { type: 'array', items: { type: 'string', format: 'binary' } };
}

function createSchemaFromFileOptions(fileOptions: IFileOption[] = []): Record<string, any> {
  const schema: Record<string, any> = { };
  fileOptions.forEach((item) => {
    if (typeof item === 'string') schema[item] = getOneFileSchema();
    else if (!item.multiple) schema[item.fieldName] = getOneFileSchema();
    else if (item.multiple) schema[item.fieldName] = getMultipleFilesSchema();
  });
  return schema;
}

function updateBodySchema(schema: JsonSchema, fileOptions: IFileOption[]) {
  const properties = createSchemaFromFileOptions(fileOptions);
  Object.entries(properties).forEach(([key, value]: [string, JsonSchema]) => schema.addProperty(key, value));
}

function createBody(store: JsonEntityStore, fileOptions: IFileOption[]) {
  const { target, propertyKey } = store;
  const paramMetadata = new ParamMetadata({ paramType: ParamTypes.BODY, target, propertyKey });

  const jsonParameter = new JsonParameter();
  jsonParameter.in('body');
  store.operation?.addParameter(-1, jsonParameter);

  // const data = store.operation!.toJSON({ specType: SpecTypes.OPENAPI })
  updateBodySchema(paramMetadata.schema, fileOptions);
  jsonParameter.schema(JsonSchema.from(paramMetadata.schema as any));
}

/** Decorator for adding file schema to the model */
export function File(): PropertyDecorator {
  return JsonEntityFn((entity) => {
    Object.entries(getOneFileSchema()).forEach(([key, value]) => { entity.schema.set(key, value); });
  });
}

/** Decorator for adding multiple files schema to the model */
export function Files(): PropertyDecorator {
  return JsonEntityFn((entity) => {
    Object.entries(getMultipleFilesSchema()).forEach(([key, value]) => { entity.schema.set(key, value); });
  });
}

/**
 *  Decorator which patches body according to provided fileOptions.
 *
 *  If there where no body injected for this method - creates body.
 */
export function PatchBodyWithFiles(fileOptions: IFileOption[], options: IUploadFileOptions = { }): ParameterDecorator {
  const defaultOptions: IUploadFileOptions = { consumes: ['multipart/form-data'] };
  const { consumes = [] } = options;

  return (target: any, propertyKey: string | symbol) => {
    const store = Store.fromMethod(target, String(propertyKey));
    const endpoint: EndpointMetadata = store?.values()?.next()?.value;
    if (!endpoint) return;

    const body = getBody(endpoint);
    if (body) {
      updateBodySchema(body.schema, fileOptions);
      consumes.push('application/json');
    } else createBody(endpoint, fileOptions);

    endpoint.operation.consumes(consumes.concat(defaultOptions.consumes));
  };
}

export function createUploadFilesDecorator(middleware: MpartyMiddleware) {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return function UploadFiles(fileOptions?: IFileOption[], options: IUploadFileOptions = { }) {
    const { useUploader = true } = options;
    const files = fileOptions.map((item) => (typeof item === 'string' ? item : item.fieldName));
    return useDecorators(
      PatchBodyWithFiles(fileOptions, options),
      useUploader && Use(middleware.call(null, files, options)),
    );
  };
}
