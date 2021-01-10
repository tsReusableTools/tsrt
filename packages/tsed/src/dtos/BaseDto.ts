/* eslint-disable @typescript-eslint/no-explicit-any */
import { getJsonSchema } from '@tsed/common';
import { validate, validateSync, ValidatorOptions } from 'class-validator';

import { insertIntoClass } from '@tsrt/utils';

import { getValidationError, IValidationError } from '../utils/getValidationError';

export class BaseDto<T extends GenericObject = GenericObject> {
  constructor(data?: T) { if (data) insertIntoClass(this, data); }

  public static getJsonSchema(): any {
    return getJsonSchema(this);
  }

  public getJsonSchema?(): any {
    return getJsonSchema((this as any).constructor);
  }

  public validate(options?: ValidatorOptions & { async?: false | undefined }): IValidationError[]
  public async validate(options?: ValidatorOptions & { async?: true }): Promise<IValidationError[]>
  public validate(options: ValidatorOptions & { async?: boolean } = { }): IValidationError[] | Promise<IValidationError[]> {
    return !options.async
      ? validate(this, options).then((result) => result.map(getValidationError))
      : validateSync(this, options).map(getValidationError);
  }
}
