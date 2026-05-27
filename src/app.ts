import express from 'express';
import cors from 'cors';
import assignmentRoutes from './routes/assignment.routes';
import { errorHandler } from './middleware/error';
import { getHealth } from './controllers/health.controller';

export const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGIN ?? 
  'http://localhost:3000,https://himanshu6001.dev,https://www.himanshu6001.dev'
).split(',');
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', getHealth);
app.use('/api/assignments', assignmentRoutes);

app.use(errorHandler);
