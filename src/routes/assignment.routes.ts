import { Router } from 'express';
import { createAssignment, triggerGeneration, getResult, listAssignments, deleteAssignment } from '../controllers/assignment.controller';
import { upload } from '../middleware/upload';
import { validateBody, CreateAssignmentSchema } from '../middleware/validate';

const router = Router();

router.post('/', upload.single('file'), validateBody(CreateAssignmentSchema), createAssignment);
router.get('/', listAssignments);
router.post('/:id/generate', triggerGeneration);
router.get('/:id/result', getResult);
router.delete('/:id', deleteAssignment);

export default router;
