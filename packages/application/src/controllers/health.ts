import { Router } from 'express';

export default Router().get('/health.html', (_req, res) => res.send('I\'m ok'));
