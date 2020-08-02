import { BaseRepository } from '@tsu/orm-sequelize';

import { Role } from '@dal/models';
import { IRole } from '@dal/interfaces';

export const RolesRepository = new BaseRepository<IRole>(Role);
