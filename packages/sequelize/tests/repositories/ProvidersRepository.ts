import { BaseRepository } from '../../src';
import { Provider, IProviderEntity, IProvider } from '../models';

export const ProvidersRepository = new BaseRepository<IProviderEntity, IProvider>(Provider);
