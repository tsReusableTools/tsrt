import { json, urlencoded } from 'express';
import cors from 'cors';

import '@tsed/ajv';
import { importFiles, PlatformApplication } from '@tsed/common';
import { Configuration, Inject } from '@tsed/di';
import '@tsed/platform-express'; // /!\ keep this import
import '@tsed/swagger';

// import { Application } from '@tsd/application';

import { HealthController } from './controllers/HealthController';

const API = '/api/v1';

@Configuration({
  rootDir: __dirname,
  commonServerDir: __dirname,
  mount: { [API]: [`${__dirname}/controllers/**/*.ts`] },
  // mount: { [API]: [HealthController] },
  httpsPort: false,
  swagger: [{ path: `${API}/api-docs` }],
  exclude: ['**/*.spec.ts', '**/*.d.ts'],
})
export class Server {
  @Inject() public app: PlatformApplication;
  @Configuration() public settings: Configuration;

  public $beforeInit(): void {
    console.log('this.settings.mount >>>', this.settings);
    this.app.use((req: any, res: any, next: any) => {
      console.log('1 >>>', 1);
      next();
    });
  }

  public $beforeRoutesInit(): void {
    console.log('this.app >>>', this.app.raw.settings);
    this.app
      .use(cors())
      .use(json())
      .use(urlencoded({ extended: true }));
  }
}
