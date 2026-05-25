import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Assignment } from '../models/Assignment';
import { addGenerationJob } from '../lib/queue';
import { AssessmentJobPayload } from '../types';
import { QuestionPaper } from '../models/QuestionPaper';
import { redisClient } from '../lib/redis';
import mongoose from 'mongoose';

const createAssignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subject: z.string().min(2, 'Subject must be at least 2 characters'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  dueDate: z.coerce.date().refine((date) => date > new Date(), { message: 'Due date must be in the future' }),
  totalMarks: z.number().positive('Total marks must be positive'),
  duration: z.number().positive('Duration must be positive').min(10, 'Duration must be at least 10 minutes'),
  questionTypes: z.array(z.enum(['mcq', 'short', 'long', 'true-false'])).min(1, 'At least one question type is required'),
  numberOfQuestions: z.number().min(1, 'Must have at least 1 question').max(50, 'Cannot exceed 50 questions'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
  additionalInstructions: z.string().max(500, 'Instructions must not exceed 500 characters').optional(),
  fileUrl: z.string().url('Invalid file URL').optional(),
});

export const createAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createAssignmentSchema.parse(req.body);

    const assignment = new Assignment({
      ...validatedData,
      status: 'pending',
    });

    await assignment.save();

    const jobData = {
      assessmentId: assignment.id,
      subject: assignment.subject,
      gradeLevel: assignment.gradeLevel,
      numQuestions: assignment.numberOfQuestions,
      difficulty: assignment.difficulty,
      topics: [],
    } as unknown as AssessmentJobPayload;

    const jobId = await addGenerationJob(jobData);

    assignment.jobId = jobId;
    await assignment.save();

    res.status(201).json({ assignment, jobId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation Error', code: 400, details: error.errors });
      return;
    }
    next(error);
  }
};

export const getAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Assignment.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Assignment.countDocuments(),
    ]);

    res.json({
      data,
      total,
      page,
      limit,
      hasNext: skip + limit < total,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid assignment ID' });
      return;
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Try to get paper if assignment is completed
    let paper = null;
    if (assignment.status === 'completed' && assignment.resultId) {
      try {
        // Check Redis cache first
        const cached = await redisClient.get(`paper:${id}`);
        if (cached) {
          paper = JSON.parse(cached);
        } else {
          paper = await QuestionPaper.findById(assignment.resultId);
          if (paper) {
            await redisClient.setex(`paper:${id}`, 3600, JSON.stringify(paper));
          }
        }
      } catch (paperErr) {
        // Paper fetch failed — still return assignment without paper
        console.warn('[Assignment] Could not fetch paper:', paperErr);
      }
    }

    res.json({ assignment, paper });
  } catch (error: any) {
    console.error('[Assignment] getAssignment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found', code: 404 });
      return;
    }
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const regenerateAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found', code: 404 });
      return;
    }

    if (assignment.status !== 'completed' && assignment.status !== 'failed') {
      res.status(400).json({ error: 'Can only regenerate completed or failed assignments', code: 400 });
      return;
    }

    // Delete old paper from DB
    if (assignment.resultId) {
      await QuestionPaper.findByIdAndDelete(assignment.resultId);
    }
    await QuestionPaper.deleteMany({ assignmentId: assignment._id });

    // Delete Redis cache
    try {
      await redisClient.del(`paper:${assignment._id}`);
      await redisClient.del(`pdf:${assignment._id}`);
    } catch (redisErr) {
      console.warn('Failed to delete Redis cache during regeneration (ignoring):', redisErr);
    }

    // Update assignment
    assignment.status = 'pending';
    assignment.resultId = undefined;
    assignment.generationCount = (assignment.generationCount || 1) + 1;
    
    const jobData = {
      assessmentId: assignment.id,
      subject: assignment.subject,
      gradeLevel: assignment.gradeLevel,
      numQuestions: assignment.numberOfQuestions,
      difficulty: assignment.difficulty,
      topics: [],
    } as unknown as AssessmentJobPayload;

    const jobId = await addGenerationJob(jobData);
    assignment.jobId = jobId;

    await assignment.save();

    res.status(200).json({ assignment, jobId });
  } catch (error) {
    next(error);
  }
};

