/* eslint-disable import/no-extraneous-dependencies */
import dotenv from 'dotenv';
import { SequelizeOptions } from 'sequelize-typescript';

import { Database } from '../src';
import * as Models from './models';

dotenv.config();

export const databaseConfig: SequelizeOptions = {
  username: process.env.PGUSER,
  host: process.env.PGHOST,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: +process.env.PGPORT,
  dialect: 'postgres',
  models: Database.getModelsList(Models),
  logging: false,
};
