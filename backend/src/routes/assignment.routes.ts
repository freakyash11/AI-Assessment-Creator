import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignment,
  deleteAssignment,
  regenerateAssignment,
} from '../controllers/assignment.controller';

const router = Router();

router.post('/', createAssignment);
router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.delete('/:id', deleteAssignment);
router.post('/:id/regenerate', regenerateAssignment);

export default router;
