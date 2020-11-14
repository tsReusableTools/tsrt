import { Configuration } from '@tsed/common';

import { IApplicationSettings as IBaseApplicationSettings } from '@tsrt/application';

export interface IApplicationSettings extends Omit<Partial<Configuration>, 'statics' | 'mount'>, IBaseApplicationSettings {
}
