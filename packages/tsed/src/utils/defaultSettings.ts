import { IApplicationSettings } from '../interfaces';

export const defaultSettings: IApplicationSettings = {
  // Application default options
  patchValidatorsWithoutGroups: true,
  patchBodyParamsDecorator: true,
  parseBodyTypesAfterValidation: true,
  parseResponseTypes: false,
  setSwaggerForApiBaseByDefault: true,
  validationOptions: { whitelist: true, forbidNonWhitelisted: true },

  // TsED default options
  httpsPort: false,
  logger: { level: 'error' },
  routers: { mergeParams: true },
  exclude: ['**/*.spec.ts', '**/*.d.ts'],
};
