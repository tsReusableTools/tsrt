/* eslint-disable no-empty */
import { Router } from 'express';
import { execSync } from 'child_process';
import readPkgUp from 'read-pkg-up';

import { IApplicationInfo } from '../interfaces';

let dateTime: string;
let commit: string;
let version: string;
let env: string;

export async function getApplicationInfo(): Promise<IApplicationInfo> {
  if (!env) env = process.env.NODE_ENV || 'dev';
  if (!dateTime) dateTime = new Date().toISOString();

  try {
    if (!commit) commit = execSync('git log --pretty=format:\'%h\' -n 1', { encoding: 'utf8' });
  } catch (err) { }

  try {
    if (!version) version = (await readPkgUp()).packageJson.version;
  } catch (err) { }

  return { env, version, dateTime, commit };
}

export const InfoController = Router().get('/info', async (_req, res) => res.send(await getApplicationInfo()));
