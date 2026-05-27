import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: Server | undefined;

export function initSocketIO(httpServer: HTTPServer): Server {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://himanshu6001.dev',
    'https://www.himanshu6001.dev'
  ];

  if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',').forEach((origin) => {
      const trimmed = origin.trim();
      if (trimmed && !allowedOrigins.includes(trimmed)) {
        allowedOrigins.push(trimmed);
      }
    });
  }

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
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
