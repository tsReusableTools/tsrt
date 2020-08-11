import { json, urlencoded } from 'express';
import cors from 'cors';

import '@tsed/ajv';
import { importFiles, PlatformApplication } from '@tsed/common';
import { Configuration, Inject } from '@tsed/di';
import '@tsed/platform-express'; // /!\ keep this import
import '@tsed/swagger';

// import { Application } from '@tsd/application';

export const rootDir = __dirname;
console.log('rootDir ___', `${rootDir}/controllers/**/*.ts`);

@Configuration({
  rootDir,
  commonServerDir: rootDir,
  mount: { '/api/v1': [`${rootDir}/controllers/**/*.ts`] },
  httpsPort: false,
  swagger: [{
    path: '/api/v1/api-docs',
    // specPath: `${__dirname}/../spec/swagger.default.json`,
    // cssPath: `${__dirname}/../spec/style.css`,
  }],
  exclude: ['**/*.spec.ts'],
})
export class Server {
  @Inject() public app: PlatformApplication;
  @Configuration() public settings: Configuration;

  public $onInit(): void {
    console.log('this.settings.mount >>>', this.settings.mount);
  }

  public $beforeRoutesInit(): void {
    this.app
      .use(cors())
      .use(json())
      .use(urlencoded({ extended: true }));
  }
}
