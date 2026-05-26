import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: Server | undefined;

export function initSocketIO(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('[WS] Client connected:', socket.id);

    socket.on('join', (assignmentId: string) => {
      socket.join(assignmentId);
      console.log(`[WS] ${socket.id} joined room: ${assignmentId}`);
      socket.emit('joined', { assignmentId });
    });

    socket.on('disconnect', () => {
      console.log('[WS] Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }

  return io;
}
