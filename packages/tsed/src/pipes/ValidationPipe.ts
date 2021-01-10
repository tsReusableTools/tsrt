import { IPipe, OverrideProvider, ParamMetadata, ValidationPipe as BaseValidationPipe } from '@tsed/common';
import { Configuration } from '@tsed/di';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';

import { throwHttpError, parseTypes } from '@tsrt/utils';

import { IApplicationSettings } from '../interfaces';

@OverrideProvider(BaseValidationPipe)
export class ClassValidationPipe extends BaseValidationPipe implements IPipe {
  @Configuration() private settings: IApplicationSettings;
  private _validateOptions: ValidatorOptions = { whitelist: true, forbidNonWhitelisted: true };

  /* eslint-disable-next-line */
  public async transform(value: any, metadata: ParamMetadata): Promise<any> {
    if (!this.shouldValidate(metadata)) return value;

    const options: ValidatorOptions = {
      ...this._validateOptions,
      ...this.settings.validationOptions,
      groups: metadata.validationGroups,
    };

    const dataToValidate = plainToClass(metadata.type, value);
    const result = await this.validate(dataToValidate, options);

    if (result?.length > 0) throwHttpError.badRequest(this.removeRestrictedProperties(result));
    return this.settings.parseBodyTypesAfterValidation ? parseTypes(dataToValidate) : dataToValidate;
  }

  protected async validate<T>(list: T | T[], options: ValidatorOptions = { }): Promise<ValidationError[]> {
    let result: ValidationError[] = [];
    const array = Array.isArray(list) ? list : [list];
    const promises = array.map((item) => validate(item, options).then((errors) => { result = result.concat(errors); }));
    await Promise.all(promises);
    return result;
  }

  protected shouldValidate(metadata: ParamMetadata): boolean {
    /* eslint-disable-next-line @typescript-eslint/ban-types */
    const types: Function[] = [String, Boolean, Number, Array, Object];
    const isAllowedParamType = this.settings.validationParamTypes
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      ? this.settings.validationParamTypes.includes(metadata.type as any)
      : true;
    return isAllowedParamType && (!(metadata.type || metadata.collectionType) || !types.includes(metadata.type));
  }

  protected removeRestrictedProperties(errors: ValidationError[]): GenericObject[] {
    if (!errors || !errors.length) return;
    const result = errors.map((item) => ({
      property: item.property,
      value: item.value,
      errors: item.constraints,
    }));
    return result;
  }
}
