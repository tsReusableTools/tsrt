import { Configuration } from '@tsed/di';

import { IApplicationSettings as IBaseApplicationSettings } from '@tsrt/application';

export interface IApplicationSettings extends Omit<Partial<Configuration>, 'statics'>, Omit<IBaseApplicationSettings, 'mount'> {
  setSwaggerForApiBaseByDefault?: boolean;
}
