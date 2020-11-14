import { IPipe, OverrideProvider, ParamMetadata, ValidationPipe as BaseValidationPipe } from '@tsed/common';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

import { throwHttpError } from '@tsrt/utils';

@OverrideProvider(BaseValidationPipe)
export class ValidationPipe extends BaseValidationPipe implements IPipe {
  /* eslint-disable-next-line */
  public async transform(value: any, metadata: ParamMetadata): Promise<any> {
    if (!this.shouldValidate(metadata)) return value;

    const object = plainToClass(metadata.type, value);
    const errors = await validate(object);

    if (errors.length > 0) throwHttpError.badRequest(this.removeRestrictedProperties(errors));
    return value;
  }

  protected shouldValidate(metadata: ParamMetadata): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];

    return !super.shouldValidate(metadata) || !types.includes(metadata.type);
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

  protected convertErrorsToString(errors: ValidationError[]): string {
    if (!errors || !errors.length) return;
    return errors
      .map((item) => `\`${item.property}\`: ${Object.keys(item.constraints).map((unit) => item.constraints[unit]).join('; ')}`)
      .join('. ');
  }

  protected convertErrorsToArray(errors: ValidationError[]): GenericObject<string[]> {
    if (!errors || !errors.length) return;
    const result: GenericObject<string[]> = { };
    errors.forEach((item) => { result[item.property] = Object.keys(item.constraints).map((unit) => item.constraints[unit]); });
    return result;
  }

  protected convertErrorsToObject(errors: ValidationError[]): GenericObject<GenericObject<string>> {
    if (!errors || !errors.length) return;
    const result: GenericObject<GenericObject<string>> = { };
    errors.forEach((item) => { result[item.property] = item.constraints; });
    return result;
  }
}
