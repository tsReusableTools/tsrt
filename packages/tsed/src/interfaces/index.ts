import { ParamTypes } from '@tsed/common';
import { IApplicationSettings as IBaseApplicationSettings, ApplicationStatics } from '@tsrt/application';
import { ValidatorOptions } from 'class-validator';

// This one is NECESSARY because of for some reasone it is impossible to use TsED.Configuration w/ Omit type to exclude some props.
/* eslint-disable-next-line */
// @ts-ignore
export interface IApplicationSettings extends Partial<TsED.Configuration>, IBaseApplicationSettings {
  /** Statics to serve by server. */
  statics?: ApplicationStatics;

  /** Whether to set swagger api-docs for `apiBase` if only 1 string value provided for it. @default true. */
  setSwaggerForApiBaseByDefault?: boolean;

  /** Whether to patch TsED native BodyParams to allow provide additional options like `validationGroups`. @default true. */
  patchBodyParamsDecorator?: boolean;

  /**
   *  Whether to patch `class-validator` validators without groups and set `always: true` for them.
   *  This will allow to provide groups for some validators and they will be validated only for that groups,
   *  which should also be provided as `validationGroups` options for BodyParams decorator (if `patchBodyParamsDecorator: true`).
   *
   *  @default true.
   *
   *  @example
   *  ```ts
   *  class UpdateDto {
   *    @Property() @IsOptional({ groups: ['update'] }) @IsString() id: string;
   *    @Property() @IsString() name: string;
   *  }
   *
   *  class CreateDto extends UpdateDto {
   *    @Required() id: string;
   *  }
   *
   * @Get('/')
   * public async create(@BodyParams() body: CreateDto) { ... }
   *
   * public async update(@BodyParams({ validationGroups: ['update'] }) body: CreateDto) { ... }
   *  ```
   */
  patchValidatorsWithoutGroups?: boolean;

  /** Whether to parse types validating body. @default true. */
  parseBodyTypesAfterValidation?: boolean;

  /** Whether to parse types of server response. @default false. */
  parseResponseTypes?: boolean;

  /** `class-validator` options for validation pipe. @default { whitelist: true, forbidNonWhitelisted: true }. */
  validationOptions?: ValidatorOptions;

  /** List of TsED `ParamTypes` to validate in ValidationPipe. @default all. */
  validationParamTypes?: Array<ParamTypes | string>;
}
