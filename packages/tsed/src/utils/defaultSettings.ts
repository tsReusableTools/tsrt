import { IApplicationSettings } from '../interfaces';
import { GlobalErrorHandler, NotFoundHandler } from '../middlewares';

/** TsED default options */
export const defaultTsedSettings: IApplicationSettings = {
  httpsPort: false,
  logger: { level: 'error', debug: false },
  routers: { mergeParams: true },
  exclude: ['**/*.spec.ts', '**/*.d.ts'],
};

/** Application default options */
export const defaultSettings: IApplicationSettings = {
  apiBase: '/api/v1',
  cors: { credentials: true, origin: true },
  qs: { strictNullHandling: true, comma: true },
  validationOptions: { whitelist: true, forbidNonWhitelisted: true },

  notFoundHandler: NotFoundHandler,
  globalErrorHandler: GlobalErrorHandler,

  useDefaultControllers: true,
  patchValidatorsWithoutGroups: true,
  patchBodyParamsDecorator: true,
  parseBodyTypesAfterValidation: true,
  parseResponseTypes: false,
  setSwaggerForApiBaseByDefault: true,

  ...defaultTsedSettings,
};
