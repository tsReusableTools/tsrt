import { Router } from 'express';

import health from './health';
import info from './info';

export default Router().use(health).use(info);
