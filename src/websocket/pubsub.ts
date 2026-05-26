import { cacheRedis, subRedis } from '../config/redis';
import { getIO } from './io';

const CHANNEL = 'job:events';

export async function publishJobEvent(assignmentId: string, data: object): Promise<void> {
  const payload = JSON.stringify({ assignmentId, ...data });
  await cacheRedis.publish(CHANNEL, payload);
}

export function startPubSubBridge(): void {
  subRedis.subscribe(CHANNEL, (err) => {
    if (err) {
      console.error('[PubSub] Subscribe error:', err);
    } else {
      console.log('[PubSub] Subscribed to channel:', CHANNEL);
    }
  });

  subRedis.on('message', (channel, message) => {
    if (channel !== CHANNEL) {
      return;
    }

    try {
      const payload = JSON.parse(message);
      const { assignmentId, ...data } = payload;
      getIO().to(assignmentId).emit('job:update', { assignmentId, ...data });
      console.log(`[PubSub] Emitted to room ${assignmentId}:`, data.status);
    } catch (error) {
      console.error('[PubSub] Malformed message:', message);
    }
  });
}
