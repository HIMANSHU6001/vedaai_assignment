import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { connectDB } from './config/db';
import { initSocketIO } from './websocket/io';
import { startPubSubBridge } from './websocket/pubsub';

const PORT = process.env.PORT ?? 4000;

async function start() {
  await connectDB();
  console.log('[Server] MongoDB connected');

  const httpServer = http.createServer(app);
  initSocketIO(httpServer);
  startPubSubBridge();

  httpServer.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
  });
}

start();
