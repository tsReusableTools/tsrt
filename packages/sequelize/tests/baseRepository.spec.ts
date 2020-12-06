import { assert } from 'chai';
import { Sequelize } from 'sequelize-typescript';

import { Database } from '../src';

import { databaseConfig } from './utils';
import { IProviderEntity, ICityEntity, ICity } from './models';
import { CitiesRepository, ProvidersRepository } from './repositories';

describe('Testing BaseRepository...', () => {
  let cityId: number;
  let total = 0;
  let providers: IProviderEntity[];
  let providerPks: number[];

  before(async () => {
    const database = await Database.createConnection(Sequelize, databaseConfig, { logConnectionInfo: false });
    await database.connection.drop();
    await database.connection.sync();
    providers = await ProvidersRepository.bulkCreate([
      { title: 'Lanet', phone: '123456789' },
      { title: 'Triolan', phone: '123456789' },
    ]);
    providerPks = providers.map(({ id }) => id);
  });

  it('create', async () => {
    const mockData = { title: 'Kiev', code: 'Kiev1' };
    const result = await CitiesRepository.create(mockData);
    cityId = result.id;
    total++;

    assert.instanceOf(result.createdAt, Date);
    assert.equal(result.title, mockData.title);
  });

  it('bulkCreate', async () => {
    const mockData: Array<ICity & Partial<ICityEntity>> = [
      { title: 'Verhnedneprovsk', code: 'Verhnedneprovsk1' },
      { title: 'Lviv', code: 'Lviv1' },
    ];
    const result = await CitiesRepository.bulkCreate(mockData);
    total += result.length;

    assert.equal(result.length, mockData.length);
    assert.equal(result[0].title, mockData[0].title);
  });

  it('read', async () => {
    const limit = 1;
    const readMany = await CitiesRepository.read({ limit });
    const readManyByOptions = await CitiesRepository.read({ where: { id: cityId } });
    const readOneByPk = await CitiesRepository.read(cityId);
    const readOneByOptionsAndPk = await CitiesRepository.read({ }, cityId);

    assert.equal(readMany.total, total);
    assert.equal(readMany.value.length, Math.min(limit, total));
    assert.equal(readMany.value[0].id, readManyByOptions.value[0].id);
    assert.equal(readMany.value[0].id, readManyByOptions.value[0].id);
    assert.equal(readManyByOptions.value[0].id, readOneByPk.id);
    assert.equal(readManyByOptions.value[0].id, readOneByOptionsAndPk.id);
  });

  it('readOne', async () => {
    const readOneByPk = await CitiesRepository.readOne(cityId);
    const readOneByOptions = await CitiesRepository.readOne({ where: { id: cityId } });
    const readOneByOptionsAndPk = await CitiesRepository.readOne({ }, cityId);

    assert.equal(readOneByPk.id, cityId);
    assert.equal(readOneByPk.id, readOneByOptions.id);
    assert.equal(readOneByPk.id, readOneByOptionsAndPk.id);
  });

  it('readMany', async () => {
    const limit = 1;
    const readMany = await CitiesRepository.readMany({ limit });

    assert.equal(readMany.total, total);
    assert.equal(readMany.value.length, Math.min(limit, total));
  });

  it('update', async () => {
    let newCity = { title: 'London', code: 'London1' };
    const updateByPk = await CitiesRepository.update(newCity, cityId);

    assert.equal(updateByPk.createdAt < updateByPk.updatedAt, true);
    assert.equal(updateByPk.title, newCity.title);

    newCity = { title: 'Paris', code: 'Paris1' };
    const updateByOptions = await CitiesRepository.update(newCity, { where: { id: cityId } });

    assert.equal(updateByOptions.length, 1);
    assert.equal(updateByPk.updatedAt < updateByOptions[0].updatedAt, true);
    assert.equal(updateByOptions[0].title, newCity.title);
  });

  it('bulkUpdate', async () => {
    const existing = await CitiesRepository.read({ limit: 'none' });
    const dataToUpdate = { code: 'SimilarCode' };
    const updated = existing.value.map((item) => ({ ...item, ...dataToUpdate }));
    const result = await CitiesRepository.bulkUpdate(updated);

    result.forEach((item, i) => {
      assert.equal(existing.value[i].updatedAt < item.updatedAt, true);
      assert.equal(item.code, dataToUpdate.code);
    });
  });

  it('delete (softDelete if model is `paranoid`)', async () => {
    const entities = await CitiesRepository.read({ limit: 'none' });
    const ids = entities.value.map(({ id }) => id);

    await CitiesRepository.delete(ids[0]);
    await CitiesRepository.delete(ids[1], { });
    await CitiesRepository.delete({ where: { id: ids[2] } });
    const entitiesAfterDeletion = await CitiesRepository.read({ limit: 'none' });
    total -= 3;

    assert.equal(entitiesAfterDeletion.value.length, total);
  });

  it('forceDelete', async () => {
    const entities = await CitiesRepository.read({ limit: 'none', paranoid: false });
    const ids = entities.value.map(({ id }) => id);

    await CitiesRepository.forceDelete(ids[0]);
    await CitiesRepository.forceDelete(ids[1], { });
    await CitiesRepository.forceDelete({ where: { id: ids[2] } });
    const entitiesAfterDeletion = await CitiesRepository.read({ limit: 'none', paranoid: false });

    assert.equal(entitiesAfterDeletion.value.length, total);
  });
});
