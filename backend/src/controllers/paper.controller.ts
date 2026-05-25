import { Request, Response, NextFunction } from 'express';
import { QuestionPaper } from '../models/QuestionPaper';
import { redisClient } from '../lib/redis';

export const getPaperByAssignmentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    
    // Check Redis cache first
    const cacheKey = `paper:${assignmentId}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    // If miss, fetch from MongoDB
    const paper = await QuestionPaper.findOne({ assignmentId });
    if (!paper) {
      res.status(404).json({ error: 'Question paper not found', code: 404 });
      return;
    }

    // Cache for future requests
    await redisClient.setex(cacheKey, 3600, JSON.stringify(paper.toJSON()));

    res.json(paper);
  } catch (error) {
    next(error);
  }
};
