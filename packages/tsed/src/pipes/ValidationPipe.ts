/* eslint-disable @typescript-eslint/no-explicit-any */
import { IPipe, OverrideProvider, ParamMetadata, ValidationPipe as BaseValidationPipe } from '@tsed/common';
import { Configuration } from '@tsed/di';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';

import { throwHttpError, parseTypes } from '@tsrt/utils';

import { IApplicationSettings } from '../interfaces';
import { getValidationError } from '../utils/getValidationError';

@OverrideProvider(BaseValidationPipe)
export class ValidationPipe extends BaseValidationPipe implements IPipe {
  @Configuration() private _settings: IApplicationSettings;

  private _validateOptions: ValidatorOptions = { whitelist: true, forbidNonWhitelisted: true };

  /* eslint-disable-next-line */
  public async transform(value: any, metadata: ParamMetadata): Promise<any> {
    if (!this.shouldValidate(metadata)) return value;

    const options: ValidatorOptions = {
      ...this._validateOptions,
      ...this._settings.validationOptions,
      groups: metadata.parameter.groups,
    };

    const dataToValidate = plainToClass(metadata.type, value);
    const result = await this.validate(dataToValidate, options);
    const inPlace = metadata?.paramType?.toLowerCase();

    if (result?.length > 0) throwHttpError.badRequest(result.map((item) => getValidationError(item, inPlace)));
    return this._settings.parseBodyTypesAfterValidation ? parseTypes(dataToValidate) : dataToValidate;
  }

  private async validate<T>(list: T | T[], options: ValidatorOptions = { }): Promise<ValidationError[]> {
    let result: ValidationError[] = [];
    const array = Array.isArray(list) ? list : [list];
    const promises = array.map((item) => validate(item, options).then((errors) => { result = result.concat(errors); }));
    await Promise.all(promises);
    return result;
  }

  private shouldValidate(metadata: ParamMetadata): boolean {
    /* eslint-disable-next-line @typescript-eslint/ban-types */
    const types: Function[] = [String, Boolean, Number, Array, Object];
    const isAllowedParamType = this._settings.validationParamTypes
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      ? this._settings.validationParamTypes.includes(metadata.type as any)
      : true;
    return isAllowedParamType && (!(metadata.type || metadata.collectionType) || !types.includes(metadata.type));
  }
}
