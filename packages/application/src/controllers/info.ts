import { Router } from 'express';
import { execSync } from 'child_process';
import { join } from 'path';
import { readFileSync } from 'fs';

import { send } from '@tsd/utils';

let dateTime: string;
let commit: string;
let version: string;
let instance: string;

function getMetaData(): GenericObject {
  if (!instance) instance = process.env.NODE_ENV || 'dev';
  if (!dateTime) dateTime = new Date().toISOString();
  try {
    if (!commit) commit = execSync('git log --pretty=format:\'%h\' -n 1', { encoding: 'utf8' });
    // if (!version) version = (await readPkg()).packageJson.version;
    if (!version) {
      const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
      version = pkg.version;
    }
  } catch (err) {
    //
  }

  return { instance, version, dateTime, commit };
}

export default Router().get('/info', (_req, res) => send.ok(res, getMetaData()));

// export LAUNCH_COMMIT=`git log --pretty=format:'%h' -n 1`
// export LAUNCH_DATE_TIME=`date -u +"%D %T"`
