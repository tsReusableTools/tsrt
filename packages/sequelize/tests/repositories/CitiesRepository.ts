import { BaseRepository } from '../../src';
import { City, ICityEntity, ICityWithAssociations, IOrderingItem } from '../models';

export const CitiesRepository = new BaseRepository<ICityEntity, ICityWithAssociations, IOrderingItem>(City);
