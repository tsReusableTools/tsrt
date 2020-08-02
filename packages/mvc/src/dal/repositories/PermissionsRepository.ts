import { BaseRepository } from '@tsu/orm-sequelize';

import { Permission } from '@dal/models';
import { IPermission } from '@dal/interfaces';

export const PermissionsRepository = new BaseRepository<IPermission>(Permission);
