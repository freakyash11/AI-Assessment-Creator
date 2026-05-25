import { Queue } from 'bullmq';
import type { AssessmentJobPayload, PdfExportJobPayload } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Queue names
// ─────────────────────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  ASSESSMENT_GENERATION: 'assessment-generation',
  PDF_EXPORT: 'pdf-export',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BullMQ connection config
// BullMQ requires its own dedicated connection — it cannot share an ioredis
// singleton. Each Queue (and Worker) gets this plain config object, and
// BullMQ will create its own internal ioredis instance from it.
// ─────────────────────────────────────────────────────────────────────────────

const _url = process.env.REDIS_URL;
if (!_url) throw new Error('REDIS_URL is not set in .env');

export const bullmqConnection = {
  url: _url,
  ...((_url.startsWith('rediss://')) ? { tls: {} } : {}),
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Queue instances
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Primary queue for AI-powered assessment generation.
 * Exported as a named singleton so workers and controllers can import it directly.
 */
export const assessmentQueue = new Queue<AssessmentJobPayload>(
  QUEUE_NAMES.ASSESSMENT_GENERATION,
  {
    connection: bullmqConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2_000, // 2s → 4s → 8s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  }
);

export const pdfExportQueue = new Queue<PdfExportJobPayload>(
  QUEUE_NAMES.PDF_EXPORT,
  {
    connection: bullmqConnection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 1_000 },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 20 },
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Job helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add an assessment generation job to the queue.
 *
 * @param jobData  The full AssessmentJobPayload
 * @param opts     Optional per-job overrides (e.g. priority, delay)
 */
export async function addGenerationJob(
  jobData: AssessmentJobPayload,
  opts?: { priority?: number; delay?: number }
): Promise<string> {
  const job = await assessmentQueue.add(
    `generate:${jobData.assessmentId}`,
    jobData,
    {
      // Job-level overrides — merged on top of defaultJobOptions
      attempts: 3,
      backoff: { type: 'exponential', delay: 2_000 },
      priority: opts?.priority,
      delay: opts?.delay,
    }
  );

  console.log(
    `[Queue] ✅ Job ${job.id} added → ${QUEUE_NAMES.ASSESSMENT_GENERATION}`
  );
  return job.id as string;
}

/**
 * Add a PDF export job to the queue.
 */
export async function addPdfExportJob(
  jobData: PdfExportJobPayload
): Promise<string> {
  const job = await pdfExportQueue.add(
    `pdf:${jobData.assessmentId}`,
    jobData
  );
  console.log(`[Queue] ✅ Job ${job.id} added → ${QUEUE_NAMES.PDF_EXPORT}`);
  return job.id as string;
}

/**
 * Gracefully close all queues (call during shutdown).
 */
export async function closeQueues(): Promise<void> {
  await Promise.all([assessmentQueue.close(), pdfExportQueue.close()]);
  console.log('[Queue] 🔌 All queues closed');
}
