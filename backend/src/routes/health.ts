import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../lib/redis';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient?.status === 'ready' ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
