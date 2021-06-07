import { getMetadataArgsStorage } from 'typeorm';
import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';

/* eslint-disable-next-line */
export type GenericObject<T = any> = { [x: string]: T };
// eslint-disable-next-line @typescript-eslint/ban-types
export type AnyFunction = Function;

export function insertIntoClass<C, T>(context: C, data: T): void {
  if (!data || !context) throw new Error('It is necessary to provide both: data and context');
  Object.entries(data).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return;
    // eslint-disable-next-line no-param-reassign
    (context as GenericObject)[key] = value;
  });
}

function getPrototypes(target: AnyFunction): AnyFunction[] {
  let result: AnyFunction[] = [target];
  if (Object.getPrototypeOf(target)?.name) result = result.concat(getPrototypes(Object.getPrototypeOf(target)));
  return result;
}

function getTableColumns(target: AnyFunction): ColumnMetadataArgs[] {
  let result: ColumnMetadataArgs[] = [];
  getPrototypes(target).forEach((item) => { result = result.concat(getMetadataArgsStorage().filterColumns(item)); });
  return result;
}

export function insertEntityData<C, T>(context: C, data: T): void {
  if (!data) return;
  const properties = getTableColumns(context.constructor)?.map(({ propertyName }) => propertyName);
  const filteredData: GenericObject = { };
  Object.entries(data).forEach(([key, value]) => { if (properties?.includes(key)) filteredData[key] = value; });
  insertIntoClass(context, filteredData);
}
