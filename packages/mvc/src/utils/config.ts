import { HealthController, InfoController } from '../api/controllers';
import { IApplicationSettings } from '../lib/interfaces';

export const API = '/api/v1';

export const DEFAULT_CONFIG: Partial<IApplicationSettings> = {
  httpsPort: false,
  // logger: { level: 'error', logRequest: false, requestFields: ["reqId", "duration"] },
  routers: { mergeParams: true },
  mount: { [API]: [HealthController, InfoController] },
  // swagger: [{ path: `${API}/api-docs` }],
  apiBase: API,
};
