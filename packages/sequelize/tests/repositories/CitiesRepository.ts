import { City, ICityEntity, ICityWithAssociations } from '../models';
import { CustomBaseRepository } from './CustomBaseRepository';

export const CitiesRepository = new CustomBaseRepository<ICityEntity, ICityWithAssociations>(City);
