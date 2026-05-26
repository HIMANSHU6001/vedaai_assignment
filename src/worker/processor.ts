import { Job } from 'bullmq';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { buildPrompt } from '../llm/prompt';
import { runGenerationAgent } from '../llm/agent';
import { cacheRedis } from '../config/redis';
import { publishJobEvent } from '../websocket/pubsub';
import type { GenerationJobData } from '../services/queue.service';

export async function processGenerationJob(job: Job<GenerationJobData>) {
	const { assignmentId } = job.data;

	const assignment = await Assignment.findById(assignmentId);
	if (!assignment) {
		throw new Error(`Assignment ${assignmentId} not found`);
	}

	await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
	try {
		await publishJobEvent(assignmentId, { status: 'processing' });
	} catch (err) {
		console.error('[processor] publishJobEvent failed (processing):', err);
	}

	try {
		const prompt = buildPrompt(assignment);
		const result = await runGenerationAgent(prompt);

		const paper = await QuestionPaper.findOneAndUpdate(
			{ assignmentId },
			{
				...result,
				assignmentId,
				modelUsed: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
				generatedAt: new Date(),
			},
			{ upsert: true, new: true, runValidators: true }
		);

		await Assignment.findByIdAndUpdate(assignmentId, { status: 'done' });
		await cacheRedis.setex(`paper:${assignmentId}`, 3600, JSON.stringify(paper));
		try {
			await publishJobEvent(assignmentId, { status: 'done', paperId: paper._id });
		} catch (err) {
			console.error('[processor] publishJobEvent failed (done):', err);
		}

		return { paperId: paper._id };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		await Assignment.findByIdAndUpdate(assignmentId, {
			status: 'failed',
			errorMessage: message,
		});
		await publishJobEvent(assignmentId, { status: 'failed', error: message });
		throw error;
	}
}

