/* eslint-disable @typescript-eslint/no-explicit-any */
import { getJsonSchema } from '@tsed/schema';
import { validate, validateSync, ValidatorOptions } from 'class-validator';

import { insertIntoClass, parseTypes } from '@tsrt/utils';

import { getValidationError, IValidationError } from '../utils/getValidationError';

export class BaseDto<T extends GenericObject = GenericObject> {
  constructor(data?: T) { if (data) insertIntoClass(this, data); }

  public static getJsonSchema(): any {
    return getJsonSchema(this);
  }

  public getJsonSchema?(): any {
    return getJsonSchema((this as any).constructor);
  }

  public validate?(options?: ValidatorOptions & { async?: false | undefined }): IValidationError[]
  public async validate?(options?: ValidatorOptions & { async?: true }): Promise<IValidationError[]>
  public validate?(options: ValidatorOptions & { async?: boolean } = { }): IValidationError[] | Promise<IValidationError[]> {
    return options.async
      ? validate(this, options).then((result) => result.map((item) => getValidationError(item)))
      : validateSync(this, options).map((item) => getValidationError(item));
  }

  public parseTypes?<C extends T>(deepness?: number): C {
    return parseTypes(this, deepness) as unknown as C;
  }
}
