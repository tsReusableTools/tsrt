import { IApplicationSettings as IBaseApplicationSettings, ApplicationStatics } from '@tsrt/application';

// This one is NECESSARY because of for some reasone it is impossible to use TsED.Configuration w/ Omit type to exclude some props.
/* eslint-disable-next-line */
// @ts-ignore
export interface IApplicationSettings extends Partial<TsED.Configuration>, IBaseApplicationSettings {
  statics?: ApplicationStatics;
  setSwaggerForApiBaseByDefault?: boolean;
}
