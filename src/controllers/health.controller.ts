import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { cacheRedis } from '../config/redis';

export function getHealth(req: Request, res: Response) {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = cacheRedis.status === 'ready' ? 'connected' : 'disconnected';

  const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  });
}
