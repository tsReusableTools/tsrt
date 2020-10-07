import { Router } from 'express';

export const HealthController = Router().get('/health.html', (_req, res) => res.send('I\'m ok.'));
