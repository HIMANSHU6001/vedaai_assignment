import { Worker } from 'bullmq';
import { workerRedis } from '../config/redis';
import { connectDB } from '../config/db';
import { processGenerationJob } from './processor';
import { Assignment } from '../models/Assignment';
import { publishJobEvent } from '../websocket/pubsub';
import type { GenerationJobData } from '../services/queue.service';

async function startWorker() {
	await connectDB();
	console.log('[Worker] MongoDB connected');

	const worker = new Worker<GenerationJobData>('question-generation', processGenerationJob, {
		connection: workerRedis,
		concurrency: 2,
	});

	worker.on('completed', (job, result) => {
		console.log(`[Worker] Job ${job.id} completed`, result);
	});

	worker.on('failed', async (job, err) => {
		console.error(`[Worker] Job ${job?.id} failed:`, err.message);
		if (job?.data.assignmentId) {
			await Assignment.findByIdAndUpdate(job.data.assignmentId, {
				status: 'failed',
				errorMessage: err.message,
			});
			await publishJobEvent(job.data.assignmentId, {
				status: 'failed',
				error: err.message,
			});
		}
	});

	console.log('[Worker] Listening for jobs on queue: question-generation');
}

startWorker();

