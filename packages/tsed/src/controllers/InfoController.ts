/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-empty */
import { Controller, Get } from '@tsed/common';
import { Summary } from '@tsed/swagger';

import { execSync } from 'child_process';
import readPkgUp from 'read-pkg-up';

import { IApplicationInfo } from '../interfaces';

@Controller('/info')
export class InfoController {
  @Get('/')
  @Summary('Shows current application info')
  public async check(): Promise<IApplicationInfo> {
    return getApplicationInfo();
  }
}

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
