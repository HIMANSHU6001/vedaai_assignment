import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { uploadToCloudinary } from '../services/cloudinary.service';
import { extractTextFromBuffer } from '../services/pdf.service';
import { generationQueue } from '../services/queue.service';
import { cacheRedis } from '../config/redis';
import { QuestionPaper } from '../models/QuestionPaper';

export async function createAssignment(req: Request, res: Response) {
  const body = req.body as any;

  let fileUrl: string | undefined;
  let filePublicId: string | undefined;
  let extractedText: string | undefined;

  if (req.file) {
    try {
      const { url, publicId } = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      fileUrl = url;
      filePublicId = publicId;
    } catch (err: any) {
      console.warn("[Cloudinary] Upload failed, using mock local fallback due to connection issues:", err.message);
      fileUrl = `/uploads/mock-${Date.now()}-${req.file.originalname}`;
      filePublicId = `mock-${Date.now()}`;
    }

    try {
      extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    } catch (err: any) {
      console.error("[PDF Extraction] Failed to extract text:", err.message);
    }
  }

  const assignment = await Assignment.create({
    ...body,
    fileUrl,
    filePublicId,
    extractedText,
    status: 'pending',
  });

  res.status(201).json({ success: true, data: { assignmentId: assignment._id, status: assignment.status } });
}

export async function triggerGeneration(req: Request, res: Response) {
  const { id: rawId } = req.params as { id?: string | string[] };
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ success: false, error: 'Assignment ID is required' });

  const assignment = await Assignment.findById(id);
  if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });

  if (assignment.status === 'processing' && assignment.jobId) {
    const existing = await generationQueue.getJob(assignment.jobId);
    if (existing) {
      const state = await existing.getState();
      if (!['completed', 'failed'].includes(state)) {
        return res.status(202).json({ success: true, data: { jobId: assignment.jobId, assignmentId: id, status: 'processing' } });
      }
    }
  }

  // delete old paper and cache
  await QuestionPaper.deleteOne({ assignmentId: id });
  await cacheRedis.del(`paper:${id}`);

  await Assignment.findByIdAndUpdate(id, { status: 'pending', jobId: null, errorMessage: null });

  const job = await generationQueue.add('generate', { assignmentId: id });
  await Assignment.findByIdAndUpdate(id, { jobId: job.id, status: 'processing' });

  res.status(202).json({ success: true, data: { jobId: job.id, assignmentId: id, status: 'processing' } });
}

export async function getResult(req: Request, res: Response) {
  const { id: rawId } = req.params as { id?: string | string[] };
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ success: false, error: 'Assignment ID is required' });

  const cached = await cacheRedis.get(`paper:${id}`);
  if (cached) {
    return res.status(200).json({ success: true, cached: true, data: JSON.parse(cached) });
  }

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    return res.status(404).json({ success: false, error: 'Assignment not found' });
  }

  const paper = await QuestionPaper.findOne({ assignmentId: id });
  if (!paper) {
    let errorMsg = 'Question paper not ready.';
    if (assignment.status === 'pending') {
      errorMsg = 'Question paper generation has not been triggered yet. Please trigger generation by calling POST /api/assignments/:id/generate first.';
    } else if (assignment.status === 'processing') {
      errorMsg = 'Question paper is currently being generated. Please wait.';
    } else if (assignment.status === 'failed') {
      errorMsg = `Question paper generation failed. Error: ${assignment.errorMessage ?? 'Unknown error'}`;
    }
    return res.status(404).json({ success: false, error: errorMsg });
  }

  await cacheRedis.setex(`paper:${id}`, 3600, JSON.stringify(paper));
  res.status(200).json({ success: true, cached: false, data: paper });
}

export async function listAssignments(_req: Request, res: Response) {
  const items = await Assignment.find().sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ success: true, data: items });
}

export async function deleteAssignment(req: Request, res: Response) {
  const { id: rawId } = req.params as { id?: string | string[] };
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ success: false, error: 'Assignment ID is required' });

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    return res.status(404).json({ success: false, error: 'Assignment not found' });
  }

  // Delete associated paper
  await QuestionPaper.deleteOne({ assignmentId: id });

  // Delete from cache
  await cacheRedis.del(`paper:${id}`);

  // Delete assignment document
  await Assignment.findByIdAndDelete(id);

  res.status(200).json({ success: true, data: { assignmentId: id } });
}
