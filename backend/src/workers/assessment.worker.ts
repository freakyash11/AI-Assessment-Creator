import { Worker, Job, UnrecoverableError } from 'bullmq';
import { QUEUE_NAMES, bullmqConnection } from '../lib/queue';
import { broadcastAll } from '../lib/socket';
import { Assignment } from '../models/Assignment';
import { generateQuestionPaper } from '../services/ai.service';
import { QuestionPaper } from '../models/QuestionPaper';
import { redisClient } from '../lib/redis';
import type { AssessmentJobPayload } from '../types';

export function startAssessmentWorker(): Worker<AssessmentJobPayload> {
  const worker = new Worker<AssessmentJobPayload>(
    QUEUE_NAMES.ASSESSMENT_GENERATION,
    async (job: Job<AssessmentJobPayload>) => {
      const { assessmentId } = job.data;
      console.log(`[Worker] ▶ Processing job ${job.id} for assignment ${assessmentId}`);

      try {
        // a. Fetch assignment
        const assignment = await Assignment.findById(assessmentId);
        if (!assignment) {
          throw new UnrecoverableError(`Assignment ${assessmentId} not found — skipping retries`);
        }

        // b. Update assignment status
        assignment.status = 'processing';
        await assignment.save();

        // c. Send WS message
        broadcastAll({
          type: 'job:started',
          assignmentId: assessmentId,
          jobId: job.id,
          timestamp: new Date().toISOString(),
        });

        // d. Call aiService
        const generatedPaper = await generateQuestionPaper(assignment);

        // e. Save result to QuestionPaper collection
        console.log(`[Worker] Saving paper for assignment:`, assessmentId);
        const paperDoc = new QuestionPaper({
          ...generatedPaper,
          generationCount: assignment.generationCount || 1,
        });
        const savedPaper = await paperDoc.save();
        console.log(`[Worker] Paper saved:`, savedPaper._id);

        // f. Update assignment
        assignment.status = 'completed';
        assignment.resultId = savedPaper._id as any;
        await assignment.save();
        console.log(`[Worker] Assignment updated to completed`);

        // g. Cache result in Redis
        const cacheKey = `paper:${assessmentId}`;
        await redisClient.setex(cacheKey, 3600, JSON.stringify(savedPaper.toJSON()));
        console.log(`[Worker] Paper cached in Redis`);

        // h. Send WS message
        broadcastAll({
          type: 'job:completed',
          assignmentId: assessmentId,
          paperId: (savedPaper._id as any).toString(),
          timestamp: new Date().toISOString(),
        });

        return { paperId: savedPaper._id };
      } catch (error) {
        console.error(`[Worker] ❌ Job ${job.id} failed:`, error);
        
        // Update assignment status to failed
        try {
          await Assignment.findByIdAndUpdate(assessmentId, { status: 'failed' });
        } catch (updateErr) {
          console.error(`[Worker] Failed to update assignment status to failed`, updateErr);
        }

        // Send WS failure message
        broadcastAll({
          type: 'job:failed',
          assignmentId: assessmentId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });

        throw error;
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 10000, // 10s
      },
    }
  );

  worker.on('completed', (job) => console.log(`[Worker] ✅ Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[Worker] ❌ Job ${job?.id} failed:`, err.message));

  return worker;
}
