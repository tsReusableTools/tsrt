import { execSync } from 'child_process';
import { Controller, Get, Status } from '@tsed/common';
import readPkg from 'read-pkg-up';

let dateTime: string;
let commit: string;
let version: string;
let instance: string;

async function getMetaData(): Promise<GenericObject> {
  if (!instance) instance = process.env.NODE_ENV || 'dev';
  if (!dateTime) dateTime = new Date().toISOString();
  try {
    if (!commit) commit = execSync('git log --pretty=format:\'%h\' -n 1', { encoding: 'utf8' });
    if (!version) version = (await readPkg()).packageJson.version;
  } catch (err) {
    //
  }

  return { instance, version, dateTime, commit };
}

@Controller('/info')
export class InfoController {
  @Get('/')
  @Status(200)
  public async getInfo(): Promise<GenericObject> {
    return getMetaData();
  }
}

// export LAUNCH_COMMIT=`git log --pretty=format:'%h' -n 1`
// export LAUNCH_DATE_TIME=`date -u +"%D %T"`
